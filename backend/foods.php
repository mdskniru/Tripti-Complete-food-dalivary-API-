<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

function food_payload(array $row): array
{
    return [
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
    ];
}

function find_food(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT f.*, u.restaurant_name, u.is_open
         FROM foods f JOIN users u ON u.id = f.restaurant_id
         WHERE f.id = ? LIMIT 1'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

$user = require_user(['restaurant']);
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $data = body();
    $name = clean($data['name'] ?? '', 150);
    $description = clean($data['description'] ?? '', 1000);
    $price = (float) ($data['price'] ?? 0);
    $category = clean($data['category'] ?? '', 40);
    $image = $data['image'] ?? '';
    $available = !isset($data['available']) || (bool) $data['available'];

    if ($name === '') {
        fail('Please enter the food name');
    }
    if ($price <= 0) {
        fail('Price must be greater than zero');
    }
    if ($category === '') {
        fail('Please choose a category');
    }
    if (!image_data_ok($image)) {
        fail('Upload a JPG, PNG or WEBP image under 2 MB');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO foods (restaurant_id, name, description, price, category, image, available)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        (int) $user['id'],
        $name,
        $description,
        $price,
        $category,
        $image,
        $available ? 1 : 0,
    ]);

    json_response(['food' => food_payload(find_food($pdo, (int) $pdo->lastInsertId()))], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $data = body();
    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        fail('Food id is required');
    }

    $existing = $pdo->prepare('SELECT * FROM foods WHERE id = ? AND restaurant_id = ? LIMIT 1');
    $existing->execute([$id, (int) $user['id']]);
    if (!$existing->fetch()) {
        fail('Food not found', 404);
    }

    $sets = [];
    $params = [];

    if (array_key_exists('name', $data)) {
        $name = clean($data['name'], 150);
        if ($name === '') {
            fail('Food name cannot be empty');
        }
        $sets[] = 'name = ?';
        $params[] = $name;
    }
    if (array_key_exists('description', $data)) {
        $sets[] = 'description = ?';
        $params[] = clean($data['description'], 1000);
    }
    if (array_key_exists('price', $data)) {
        $price = (float) $data['price'];
        if ($price <= 0) {
            fail('Price must be greater than zero');
        }
        $sets[] = 'price = ?';
        $params[] = $price;
    }
    if (array_key_exists('category', $data)) {
        $category = clean($data['category'], 40);
        if ($category === '') {
            fail('Category cannot be empty');
        }
        $sets[] = 'category = ?';
        $params[] = $category;
    }
    if (array_key_exists('image', $data)) {
        if (!image_data_ok($data['image'])) {
            fail('Upload a JPG, PNG or WEBP image under 2 MB');
        }
        $sets[] = 'image = ?';
        $params[] = $data['image'];
    }
    if (array_key_exists('available', $data)) {
        $sets[] = 'available = ?';
        $params[] = ((bool) $data['available']) ? 1 : 0;
    }

    if (!$sets) {
        fail('Nothing to update');
    }

    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE foods SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($params);

    json_response(['food' => food_payload(find_food($pdo, $id))]);
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        fail('Food id is required');
    }

    $stmt = $pdo->prepare('DELETE FROM foods WHERE id = ? AND restaurant_id = ?');
    $stmt->execute([$id, (int) $user['id']]);
    if ($stmt->rowCount() === 0) {
        fail('Food not found', 404);
    }

    json_response(['ok' => true]);
}

fail('Method not allowed', 405);
