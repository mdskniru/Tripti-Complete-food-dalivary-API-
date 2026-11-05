<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    fail('Method not allowed', 405);
}

$pdo = db();

$restaurants = $pdo->query(
    "SELECT id, restaurant_name, logo, phone, address, is_open
     FROM users WHERE role = 'restaurant' ORDER BY restaurant_name"
)->fetchAll();

$foods = $pdo->query(
    'SELECT f.*, u.restaurant_name, u.is_open
     FROM foods f JOIN users u ON u.id = f.restaurant_id
     ORDER BY f.id'
)->fetchAll();

json_response([
    'restaurants' => array_map(static fn (array $row) => [
        'id' => (int) $row['id'],
        'name' => $row['restaurant_name'],
        'logo' => $row['logo'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'isOpen' => (bool) $row['is_open'],
    ], $restaurants),
    'foods' => array_map(static fn (array $row) => [
        'id' => (int) $row['id'],
        'restaurantId' => (int) $row['restaurant_id'],
        'restaurantName' => $row['restaurant_name'],
        'isOpen' => (bool) $row['is_open'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => (float) $row['price'],
        'category' => $row['category'],
        'image' => $row['image'],
        'available' => (bool) $row['available'],
    ], $foods),
]);
