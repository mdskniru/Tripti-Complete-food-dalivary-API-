<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

const ORDER_BASE_SELECT = 'SELECT o.*, r.restaurant_name, r.address AS restaurant_address, r.is_open AS restaurant_is_open
    FROM orders o JOIN users r ON r.id = o.restaurant_id';

function order_items_map(PDO $pdo, array $orderIds): array
{
    if (!$orderIds) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT order_id, food_id, name, price, qty FROM order_items WHERE order_id IN ($placeholders) ORDER BY id"
    );
    $stmt->execute($orderIds);

    $map = [];
    foreach ($stmt->fetchAll() as $item) {
        $map[(int) $item['order_id']][] = [
            'foodId' => $item['food_id'] !== null ? (int) $item['food_id'] : null,
            'name' => $item['name'],
            'price' => (float) $item['price'],
            'qty' => (int) $item['qty'],
        ];
    }
    return $map;
}

function order_payload(array $row, array $items = []): array
{
    return [
        'code' => $row['code'],
        'status' => $row['status'],
        'payment' => $row['payment'],
        'customerId' => (int) $row['customer_id'],
        'restaurantId' => (int) $row['restaurant_id'],
        'riderId' => $row['rider_id'] !== null ? (int) $row['rider_id'] : null,
        'customerName' => $row['customer_name'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'note' => $row['note'],
        'subtotal' => (float) $row['subtotal'],
        'deliveryFee' => (float) $row['delivery_fee'],
        'total' => (float) $row['total'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'restaurantName' => $row['restaurant_name'],
        'restaurantAddress' => $row['restaurant_address'],
        'restaurantIsOpen' => (bool) $row['restaurant_is_open'],
        'items' => $items,
    ];
}

function payloads_for_rows(PDO $pdo, array $rows): array
{
    $ids = array_map(static fn (array $row) => (int) $row['id'], $rows);
    $items = order_items_map($pdo, $ids);
    return array_map(
        static fn (array $row) => order_payload($row, $items[(int) $row['id']] ?? []),
        $rows
    );
}

function locked_fail(PDO $pdo, string $message, int $status = 409): void
{
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fail($message, $status);
}

$user = require_user();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if ($user['role'] === 'customer') {
        $stmt = $pdo->prepare(ORDER_BASE_SELECT . ' WHERE o.customer_id = ? ORDER BY o.created_at DESC');
        $stmt->execute([(int) $user['id']]);
        json_response(['orders' => payloads_for_rows($pdo, $stmt->fetchAll())]);
    }

    if ($user['role'] === 'restaurant') {
        $stmt = $pdo->prepare(ORDER_BASE_SELECT . ' WHERE o.restaurant_id = ? ORDER BY o.created_at DESC');
        $stmt->execute([(int) $user['id']]);
        json_response(['orders' => payloads_for_rows($pdo, $stmt->fetchAll())]);
    }

    $available = $pdo->prepare(
        ORDER_BASE_SELECT . " WHERE o.status = 'Ready for Pickup' AND o.rider_id IS NULL ORDER BY o.created_at ASC"
    );
    $available->execute();

    $mine = $pdo->prepare(ORDER_BASE_SELECT . ' WHERE o.rider_id = ? ORDER BY o.created_at DESC');
    $mine->execute([(int) $user['id']]);

    json_response([
        'available' => payloads_for_rows($pdo, $available->fetchAll()),
        'mine' => payloads_for_rows($pdo, $mine->fetchAll()),
    ]);
}

if ($method === 'POST') {
    if ($user['role'] !== 'customer') {
        fail('Only customers can place orders', 403);
    }

    $data = body();
    $name = clean($data['name'] ?? '', 120);
    $phone = clean($data['phone'] ?? '', 30);
    $address = clean($data['address'] ?? '', 255);
    $note = clean($data['note'] ?? '', 500);
    $items = $data['items'] ?? [];

    if (!is_array($items) || !$items) {
        fail('Your cart is empty');
    }
    if ($name === '' || $phone === '' || $address === '') {
        fail('Name, phone and delivery address are required');
    }

    $qtyByFood = [];
    foreach ($items as $item) {
        $foodId = (int) ($item['foodId'] ?? 0);
        $qty = (int) ($item['qty'] ?? 0);
        if ($foodId <= 0 || $qty <= 0 || $qty > 20) {
            fail('Invalid cart item');
        }
        $qtyByFood[$foodId] = ($qtyByFood[$foodId] ?? 0) + $qty;
        if ($qtyByFood[$foodId] > 50) {
            fail('Quantity is too large');
        }
    }

    $placeholders = implode(',', array_fill(0, count($qtyByFood), '?'));
    $stmt = $pdo->prepare(
        "SELECT f.*, u.is_open, u.restaurant_name FROM foods f
         JOIN users u ON u.id = f.restaurant_id WHERE f.id IN ($placeholders)"
    );
    $stmt->execute(array_keys($qtyByFood));
    $foods = $stmt->fetchAll();

    if (count($foods) !== count($qtyByFood)) {
        fail('Some items in your cart no longer exist', 409);
    }

    $restaurantId = null;
    $lines = [];
    $subtotal = 0.0;

    foreach ($foods as $food) {
        if (!(bool) $food['is_open']) {
            fail($food['restaurant_name'] . ' is closed right now', 409);
        }
        if (!(bool) $food['available']) {
            fail($food['name'] . ' is currently unavailable', 409);
        }
        if ($restaurantId === null) {
            $restaurantId = (int) $food['restaurant_id'];
        } elseif ($restaurantId !== (int) $food['restaurant_id']) {
            fail('All items in an order must come from the same restaurant', 409);
        }

        $qty = $qtyByFood[(int) $food['id']];
        $price = (float) $food['price'];
        $subtotal += $price * $qty;
        $lines[] = [
            'foodId' => (int) $food['id'],
            'name' => $food['name'],
            'price' => $price,
            'qty' => $qty,
        ];
    }

    $deliveryFee = 50.0;
    $total = $subtotal + $deliveryFee;

    $pdo->beginTransaction();
    try {
        $code = '';
        $codeCheck = $pdo->prepare('SELECT id FROM orders WHERE code = ? LIMIT 1');
        for ($i = 0; $i < 10; $i++) {
            $candidate = 'TRP-' . random_int(100000, 999999);
            $codeCheck->execute([$candidate]);
            if (!$codeCheck->fetch()) {
                $code = $candidate;
                break;
            }
        }
        if ($code === '') {
            locked_fail($pdo, 'Could not create an order number. Please try again.', 500);
        }

        $insertOrder = $pdo->prepare(
            "INSERT INTO orders
             (code, customer_id, restaurant_id, customer_name, phone, address, note, subtotal, delivery_fee, total, payment, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COD', 'Placed')"
        );
        $insertOrder->execute([
            $code,
            (int) $user['id'],
            $restaurantId,
            $name,
            $phone,
            $address,
            $note,
            $subtotal,
            $deliveryFee,
            $total,
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $insertItem = $pdo->prepare(
            'INSERT INTO order_items (order_id, food_id, name, price, qty) VALUES (?, ?, ?, ?, ?)'
        );
        foreach ($lines as $line) {
            $insertItem->execute([$orderId, $line['foodId'], $line['name'], $line['price'], $line['qty']]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $stmt = $pdo->prepare(ORDER_BASE_SELECT . ' WHERE o.id = ?');
    $stmt->execute([$orderId]);
    $row = $stmt->fetch();
    $itemsMap = order_items_map($pdo, [$orderId]);

    json_response(['order' => order_payload($row, $itemsMap[$orderId] ?? [])], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    if (!in_array($user['role'], ['restaurant', 'rider'], true)) {
        fail('You cannot change order status', 403);
    }

    $data = body();
    $code = clean($data['code'] ?? '', 20);
    $status = clean($data['status'] ?? '', 30);

    if ($code === '' || $status === '') {
        fail('Order code and status are required');
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE code = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$code]);
    $order = $stmt->fetch();

    if (!$order) {
        locked_fail($pdo, 'Order not found', 404);
    }

    $orderId = (int) $order['id'];
    $current = $order['status'];

    if ($user['role'] === 'restaurant') {
        if ((int) $order['restaurant_id'] !== (int) $user['id']) {
            locked_fail($pdo, 'This order belongs to another restaurant', 403);
        }
        $allowed = ($current === 'Placed' && in_array($status, ['Accepted', 'Rejected'], true))
            || ($current === 'Accepted' && $status === 'Ready for Pickup');
        if (!$allowed) {
            locked_fail($pdo, 'That status change is not allowed');
        }

        $update = $pdo->prepare('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?');
        $update->execute([$status, $orderId]);
    } else {
        if ($status === 'Picked Up') {
            if ($current !== 'Ready for Pickup') {
                locked_fail($pdo, 'This order is not ready for pickup');
            }
            if ($order['rider_id'] !== null && (int) $order['rider_id'] !== (int) $user['id']) {
                locked_fail($pdo, 'Another rider already picked up this order');
            }
            $update = $pdo->prepare('UPDATE orders SET status = ?, rider_id = ?, updated_at = NOW() WHERE id = ?');
            $update->execute([$status, (int) $user['id'], $orderId]);
        } elseif ($status === 'On the Way' || $status === 'Delivered') {
            $needed = $status === 'On the Way' ? 'Picked Up' : 'On the Way';
            if ($order['rider_id'] === null || (int) $order['rider_id'] !== (int) $user['id']) {
                locked_fail($pdo, 'This delivery is assigned to another rider', 403);
            }
            if ($current !== $needed) {
                locked_fail($pdo, 'That status change is not allowed');
            }
            $update = $pdo->prepare('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?');
            $update->execute([$status, $orderId]);
        } else {
            locked_fail($pdo, 'Riders can only pick up, update or deliver orders');
        }
    }

    $pdo->commit();

    $stmt = $pdo->prepare(ORDER_BASE_SELECT . ' WHERE o.id = ?');
    $stmt->execute([$orderId]);
    $row = $stmt->fetch();
    $itemsMap = order_items_map($pdo, [$orderId]);

    json_response(['order' => order_payload($row, $itemsMap[$orderId] ?? [])]);
}

fail('Method not allowed', 405);
