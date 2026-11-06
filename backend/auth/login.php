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

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    if ($role === 'customer' || $role === '') {
        $cStmt = $pdo->prepare('SELECT * FROM customer WHERE Customer_Email = ? LIMIT 1');
        $cStmt->execute([$email]);
        if ($cRow = $cStmt->fetch()) {
            if (password_verify($password, $cRow['Customer_Password']) || $password === $cRow['Customer_Password']) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $ins = $pdo->prepare('INSERT INTO users (custom_id, role, name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), custom_id = VALUES(custom_id)');
                $ins->execute([(string)$cRow['Customer_Id'], 'customer', $cRow['Customer_Name'], $email, $hash, (string)$cRow['Customer_Phone'], $cRow['Customer_Address'] ?? '']);
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                if ($user) {
                    $pdo->prepare('UPDATE customer SET user_id = ? WHERE Customer_Id = ?')->execute([(int)$user['id'], $cRow['Customer_Id']]);
                }
            }
        }
    }
    if (!$user && ($role === 'restaurant' || $role === '')) {
        $rStmt = $pdo->prepare('SELECT * FROM restaurant WHERE Restaurant_Email = ? LIMIT 1');
        $rStmt->execute([$email]);
        if ($rRow = $rStmt->fetch()) {
            if (password_verify($password, $rRow['Restaurant_Password']) || $password === $rRow['Restaurant_Password']) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $ins = $pdo->prepare('INSERT INTO users (custom_id, role, name, email, password_hash, phone, address, restaurant_name, logo, is_open) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), custom_id = VALUES(custom_id)');
                $ins->execute([(string)$rRow['Restaurant_Id'], 'restaurant', $rRow['Restaurant_Owner'], $email, $hash, (string)$rRow['Restaurant_Phone'], $rRow['Restaurant_Address'] ?? '', $rRow['Restaurant_Name'], $rRow['logo'] ?? null, (int)($rRow['is_open'] ?? 1)]);
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                if ($user) {
                    $pdo->prepare('UPDATE restaurant SET user_id = ? WHERE Restaurant_Id = ?')->execute([(int)$user['id'], $rRow['Restaurant_Id']]);
                }
            }
        }
    }
    if (!$user && ($role === 'rider' || $role === '')) {
        $rdStmt = $pdo->prepare('SELECT * FROM rider WHERE Rider_Email = ? LIMIT 1');
        $rdStmt->execute([$email]);
        if ($rdRow = $rdStmt->fetch()) {
            $rdPass = $rdRow['Rider_Password'] ?? '';
            if ($rdPass === '' || password_verify($password, $rdPass) || $password === $rdPass) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $ins = $pdo->prepare('INSERT INTO users (custom_id, role, name, email, password_hash, phone, vehicle_type) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), custom_id = VALUES(custom_id)');
                $ins->execute([(string)$rdRow['Rider_Id'], 'rider', $rdRow['Rider_Name'], $email, $hash, (string)$rdRow['Rider_Phone'], $rdRow['vehicle_type'] ?? 'Bike']);
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                if ($user) {
                    $pdo->prepare('UPDATE rider SET user_id = ? WHERE Rider_Id = ?')->execute([(int)$user['id'], $rdRow['Rider_Id']]);
                }
            }
        }
    }
}

if ($user && !password_verify($password, $user['password_hash'])) {
    $altMatch = false;
    if ($user['role'] === 'customer') {
        $chk = $pdo->prepare('SELECT Customer_Password FROM customer WHERE Customer_Id = ? OR user_id = ? OR Customer_Email = ? LIMIT 1');
        $chk->execute([(string)($user['custom_id'] ?? ''), (int)$user['id'], $user['email']]);
        $rowPass = $chk->fetchColumn();
        if ($rowPass && (password_verify($password, $rowPass) || $password === $rowPass)) {
            $altMatch = true;
        }
    } elseif ($user['role'] === 'restaurant') {
        $chk = $pdo->prepare('SELECT Restaurant_Password FROM restaurant WHERE Restaurant_Id = ? OR user_id = ? OR Restaurant_Email = ? LIMIT 1');
        $chk->execute([(string)($user['custom_id'] ?? ''), (int)$user['id'], $user['email']]);
        $rowPass = $chk->fetchColumn();
        if ($rowPass && (password_verify($password, $rowPass) || $password === $rowPass)) {
            $altMatch = true;
        }
    } elseif ($user['role'] === 'rider') {
        $chk = $pdo->prepare('SELECT Rider_Password FROM rider WHERE Rider_Id = ? OR user_id = ? OR Rider_Email = ? LIMIT 1');
        $chk->execute([(string)($user['custom_id'] ?? ''), (int)$user['id'], $user['email']]);
        $rowPass = $chk->fetchColumn();
        if ($rowPass && (password_verify($password, $rowPass) || $password === $rowPass)) {
            $altMatch = true;
        }
    }
    if ($altMatch) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$newHash, (int)$user['id']]);
        $user['password_hash'] = $newHash;
    }
}

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
