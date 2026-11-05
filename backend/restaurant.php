<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PATCH' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
    fail('Method not allowed', 405);
}

$user = require_user(['restaurant']);
$data = body();

if (!array_key_exists('isOpen', $data)) {
    fail('isOpen is required');
}

$isOpen = (bool) $data['isOpen'];
$stmt = db()->prepare('UPDATE users SET is_open = ? WHERE id = ?');
$stmt->execute([$isOpen ? 1 : 0, (int) $user['id']]);

json_response(['isOpen' => $isOpen]);
