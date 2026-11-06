<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    fail('Method not allowed', 405);
}

$pdo = db();

$restaurants = $pdo->query(
    "SELECT id, custom_id, restaurant_name, logo, phone, address, is_open
     FROM users WHERE role = 'restaurant' ORDER BY restaurant_name"
)->fetchAll();

$foods = $pdo->query(
    'SELECT f.*, u.restaurant_name, u.is_open
     FROM foods f
     LEFT JOIN users u ON (u.custom_id = f.restaurant_id OR CAST(u.id AS CHAR) = f.restaurant_id)
     ORDER BY f.id'
)->fetchAll();

json_response([
    'restaurants' => array_map(static fn (array $row) => [
        'id' => !empty($row['custom_id']) ? (string) $row['custom_id'] : (int) $row['id'],
        'name' => $row['restaurant_name'],
        'logo' => $row['logo'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'isOpen' => (bool) $row['is_open'],
    ], $restaurants),
    'foods' => array_map(static fn (array $row) => [
        'id' => (int) $row['id'],
        'restaurantId' => (string) $row['restaurant_id'],
        'restaurantName' => $row['restaurant_name'] ?? '',
        'isOpen' => (bool) ($row['is_open'] ?? false),
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => (float) $row['price'],
        'category' => $row['category'],
        'image' => $row['image'],
        'available' => (bool) $row['available'],
    ], $foods),
]);
