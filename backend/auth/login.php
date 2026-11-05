<?php
declare(strict_types=1);

require dirname(__DIR__) . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

$data = body();
$email = strtolower(clean($data['email'] ?? '', 190));
$password = (string) ($data['password'] ?? '');
$role = clean($data['role'] ?? '', 20);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    fail('Enter your email and password');
}

$stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Incorrect email or password', 401);
}
if ($role !== '' && $user['role'] !== $role) {
    fail('This email belongs to a different account type', 403);
}

json_response([
    'token' => issue_token((int) $user['id']),
    'user' => public_user($user),
]);
