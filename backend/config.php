<?php
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'tripti';
const DB_USER = 'root';
const DB_PASS = '';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

set_exception_handler(static function (Throwable $e): void {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
});

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void
{
    json_response(['error' => $message], $status);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return $_POST;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function clean($value, int $max = 255): string
{
    return mb_substr(trim((string) $value), 0, $max);
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if ($header === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $key => $value) {
            if (strtolower((string) $key) === 'authorization') {
                $header = (string) $value;
                break;
            }
        }
    }

    if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $matches)) {
        return trim($matches[1]);
    }
    return null;
}

function current_user(): ?array
{
    static $loaded = false;
    static $user = null;

    if ($loaded) {
        return $user;
    }
    $loaded = true;

    $token = bearer_token();
    if (!$token) {
        return null;
    }

    $stmt = db()->prepare(
        'SELECT u.* FROM api_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = ? AND t.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([hash('sha256', $token)]);
    $row = $stmt->fetch();
    $user = $row ?: null;

    return $user;
}

function require_user(array $roles = []): array
{
    $user = current_user();
    if (!$user) {
        fail('Please sign in to continue', 401);
    }
    if ($roles && !in_array($user['role'], $roles, true)) {
        fail('You do not have access to this action', 403);
    }
    return $user;
}

function public_user(array $user): array
{
    $id = !empty($user['custom_id']) ? (string) $user['custom_id'] : (int) $user['id'];
    return [
        'id' => $id,
        'userId' => (int) $user['id'],
        'code' => $user['custom_id'] ?? '',
        'customId' => $user['custom_id'] ?? '',
        'role' => $user['role'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'address' => $user['address'],
        'restaurantName' => $user['restaurant_name'],
        'logo' => $user['logo'],
        'isOpen' => (bool) $user['is_open'],
        'vehicleType' => $user['vehicle_type'],
        'createdAt' => $user['created_at'],
    ];
}

function generate_role_id(PDO $pdo, string $role): string
{
    $prefixMap = [
        'customer' => ['table' => 'customer', 'col' => 'Customer_Id', 'prefix' => 'CUS'],
        'restaurant' => ['table' => 'restaurant', 'col' => 'Restaurant_Id', 'prefix' => 'RES'],
        'rider' => ['table' => 'rider', 'col' => 'Rider_Id', 'prefix' => 'RID'],
    ];

    $cfg = $prefixMap[$role] ?? $prefixMap['customer'];
    $datePart = date('ymd');
    $pattern = $cfg['prefix'] . '-' . $datePart . '-%';

    $stmt = $pdo->prepare(
        "SELECT {$cfg['col']} FROM {$cfg['table']} WHERE {$cfg['col']} LIKE ? ORDER BY {$cfg['col']} DESC LIMIT 1"
    );
    $stmt->execute([$pattern]);
    $lastId = $stmt->fetchColumn();

    $nextSeq = 1;
    if ($lastId) {
        $parts = explode('-', (string) $lastId);
        $lastSeq = (int) end($parts);
        $nextSeq = $lastSeq + 1;
    }

    do {
        $candidate = sprintf('%s-%s-%04d', $cfg['prefix'], $datePart, $nextSeq);
        $check = $pdo->prepare("SELECT COUNT(*) FROM {$cfg['table']} WHERE {$cfg['col']} = ?");
        $check->execute([$candidate]);
        $exists = (int) $check->fetchColumn() > 0;
        if ($exists) {
            $nextSeq++;
        }
    } while ($exists);

    return $candidate;
}

function issue_token(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $stmt = db()->prepare(
        'INSERT INTO api_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))'
    );
    $stmt->execute([$userId, hash('sha256', $token)]);
    db()->exec('DELETE FROM api_tokens WHERE expires_at < NOW()');
    return $token;
}

function image_data_ok($data): bool
{
    if (!is_string($data) || !preg_match('#^data:image/(jpeg|png|webp);base64,#i', $data)) {
        return false;
    }
    $payload = substr($data, strpos($data, ',') + 1);
    $binary = base64_decode($payload, true);
    return $binary !== false && strlen($binary) > 0 && strlen($binary) <= 2 * 1024 * 1024;
}
