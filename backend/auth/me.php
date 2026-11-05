<?php
declare(strict_types=1);

require dirname(__DIR__) . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    fail('Method not allowed', 405);
}

$user = require_user();
json_response(['user' => public_user($user)]);
