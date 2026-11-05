<?php
declare(strict_types=1);

require dirname(__DIR__) . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

$token = bearer_token();
if ($token) {
    $stmt = db()->prepare('DELETE FROM api_tokens WHERE token_hash = ?');
    $stmt->execute([hash('sha256', $token)]);
}

json_response(['ok' => true]);
