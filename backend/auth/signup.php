<?php
declare(strict_types=1);

require dirname(__DIR__) . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

$data = body();
$role = clean($data['role'] ?? 'customer', 20);

if (!in_array($role, ['customer', 'restaurant', 'rider'], true)) {
    fail('Invalid account type');
}

$name = clean($data['name'] ?? '', 120);
$email = strtolower(clean($data['email'] ?? '', 190));
$password = (string) ($data['password'] ?? '');
$phone = clean($data['phone'] ?? '', 30);
$address = clean($data['address'] ?? '', 255);
$restaurantName = clean($data['restaurantName'] ?? '', 150);
$vehicleType = clean($data['vehicleType'] ?? '', 40);
$logo = $role === 'restaurant' ? ($data['logo'] ?? '') : '';

if ($name === '') {
    fail('Please enter your name');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Enter a valid email address');
}
if (strlen($password) < 6) {
    fail('Password must be at least 6 characters');
}
if (strlen(preg_replace('/\D/', '', $phone)) < 7) {
    fail('Enter a valid phone number');
}
if (in_array($role, ['customer', 'restaurant'], true) && $address === '') {
    fail('Please enter your address');
}
if ($role === 'restaurant' && $restaurantName === '') {
    fail('Please enter your restaurant name');
}
if ($role === 'rider' && $vehicleType === '') {
    fail('Please choose your vehicle type');
}
if ($logo !== '' && !image_data_ok($logo)) {
    fail('Logo must be a JPG, PNG or WEBP image under 2 MB');
}

$pdo = db();
$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    fail('An account with this email already exists', 409);
}

$stmt = $pdo->prepare(
    'INSERT INTO users (role, name, email, password_hash, phone, address, restaurant_name, logo, is_open, vehicle_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $role,
    $name,
    $email,
    password_hash($password, PASSWORD_DEFAULT),
    $phone,
    $address,
    $restaurantName,
    $logo !== '' ? $logo : null,
    $role === 'restaurant' ? 1 : 0,
    $vehicleType,
]);

$userId = (int) $pdo->lastInsertId();
$userStmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$userStmt->execute([$userId]);
$user = $userStmt->fetch();
$token = issue_token($userId);

json_response(['token' => $token, 'user' => public_user($user)], 201);
