<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

try {
    $server = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $server->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
} catch (Throwable $e) {
    fail('Could not connect to MySQL. Start MySQL in the XAMPP control panel. ' . $e->getMessage(), 500);
}

$pdo = db();

$tables = [
    "CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        role ENUM('customer', 'restaurant', 'rider') NOT NULL DEFAULT 'customer',
        name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NOT NULL DEFAULT '',
        address VARCHAR(255) NOT NULL DEFAULT '',
        restaurant_name VARCHAR(150) NOT NULL DEFAULT '',
        logo LONGTEXT NULL,
        is_open TINYINT(1) NOT NULL DEFAULT 0,
        vehicle_type VARCHAR(40) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS customer (
        Customer_Id INT UNSIGNED NOT NULL,
        Customer_Name VARCHAR(120) NOT NULL,
        Customer_Email VARCHAR(190) NOT NULL,
        Customer_Phone VARCHAR(30) NOT NULL,
        Customer_Password VARCHAR(255) NOT NULL,
        Customer_Address VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (Customer_Id),
        UNIQUE KEY uniq_customer_email (Customer_Email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS restaurant (
        Restaurant_Id INT UNSIGNED NOT NULL,
        Restaurant_Owner VARCHAR(120) NOT NULL,
        Restaurant_Name VARCHAR(150) NOT NULL,
        Restaurant_Email VARCHAR(190) NOT NULL,
        Restaurant_Phone VARCHAR(30) NOT NULL,
        Restaurant_Password VARCHAR(255) NOT NULL,
        Restaurant_Address VARCHAR(255) NOT NULL DEFAULT '',
        logo LONGTEXT NULL,
        is_open TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (Restaurant_Id),
        UNIQUE KEY uniq_restaurant_email (Restaurant_Email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS rider (
        Rider_Id INT UNSIGNED NOT NULL,
        Rider_Name VARCHAR(120) NOT NULL,
        Rider_Email VARCHAR(190) NOT NULL,
        Rider_Phone VARCHAR(30) NOT NULL,
        Rider_Password VARCHAR(255) NOT NULL DEFAULT '',
        vehicle_type VARCHAR(40) NOT NULL DEFAULT 'Bike',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (Rider_Id),
        UNIQUE KEY uniq_rider_email (Rider_Email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS foods (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        restaurant_id INT UNSIGNED NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(40) NOT NULL,
        image LONGTEXT NOT NULL,
        available TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_foods_restaurant (restaurant_id),
        CONSTRAINT fk_foods_restaurant FOREIGN KEY (restaurant_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL,
        customer_id INT UNSIGNED NOT NULL,
        restaurant_id INT UNSIGNED NOT NULL,
        rider_id INT UNSIGNED NULL,
        customer_name VARCHAR(120) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        address VARCHAR(255) NOT NULL,
        note VARCHAR(500) NOT NULL DEFAULT '',
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 50,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment VARCHAR(20) NOT NULL DEFAULT 'COD',
        status VARCHAR(30) NOT NULL DEFAULT 'Placed',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_orders_code (code),
        KEY idx_orders_customer (customer_id),
        KEY idx_orders_restaurant (restaurant_id),
        KEY idx_orders_rider (rider_id),
        CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_orders_rider FOREIGN KEY (rider_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS order_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id INT UNSIGNED NOT NULL,
        food_id INT UNSIGNED NULL,
        name VARCHAR(150) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        qty INT UNSIGNED NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        KEY idx_items_order (order_id),
        CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT fk_items_food FOREIGN KEY (food_id) REFERENCES foods (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS api_tokens (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_tokens_hash (token_hash),
        KEY idx_tokens_user (user_id),
        CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($tables as $sql) {
    $pdo->exec($sql);
}

$existing = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$seeded = false;

if ($existing === 0) {
    $password = password_hash('123456', PASSWORD_DEFAULT);

    $seedUsers = [
        ['customer', 'Aarav Shrestha', 'demo@tripti.com', '9812345678', 'Baneshwor, Kathmandu', '', '', 0, ''],
        ['restaurant', 'Ramesh Thapa', 'owner@tripti.com', '9801111111', 'Thamel, Kathmandu', 'Spice Garden', '', 1, ''],
        ['restaurant', 'Bikash Shrestha', 'owner2@tripti.com', '9802222222', 'Jhamsikhel, Lalitpur', 'Burger Hub', '', 1, ''],
        ['restaurant', 'Sita Gurung', 'owner3@tripti.com', '9803333333', 'Lakeside, Pokhara', 'Pizza Roma', '', 1, ''],
        ['restaurant', 'Nabin Karki', 'owner4@tripti.com', '9804444444', 'Durbar Marg, Kathmandu', 'Sweet Tooth Cafe', '', 0, ''],
        ['rider', 'Suman Rai', 'rider@tripti.com', '9855555555', 'Kalanki, Kathmandu', '', '', 0, 'Bike'],
    ];

    $userStmt = $pdo->prepare(
        'INSERT INTO users (role, name, email, password_hash, phone, address, restaurant_name, logo, is_open, vehicle_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($seedUsers as $user) {
        $userStmt->execute([...array_slice($user, 0, 3), $password, ...array_slice($user, 3)]);
    }

    $ids = [];
    $idStmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    foreach (['demo@tripti.com', 'owner@tripti.com', 'owner2@tripti.com', 'owner3@tripti.com', 'owner4@tripti.com', 'rider@tripti.com'] as $email) {
        $idStmt->execute([$email]);
        $ids[$email] = (int) $idStmt->fetchColumn();
    }

    $seedFoods = [
        ['owner@tripti.com', 'Chicken Biryani', 'Fragrant basmati rice cooked with tender chicken, saffron and whole spices.', 320, 'Indian', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'],
        ['owner@tripti.com', 'Paneer Butter Masala', 'Soft paneer cubes in a rich, creamy tomato gravy served with butter.', 280, 'Indian', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'],
        ['owner@tripti.com', 'Steamed Veg Momo', 'Ten juicy steamed dumplings packed with cabbage, carrot and ginger.', 180, 'Chinese', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80'],
        ['owner2@tripti.com', 'Classic Cheeseburger', 'Grilled beef patty, cheddar, lettuce, tomato and house sauce.', 350, 'Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'],
        ['owner2@tripti.com', 'Crispy Chicken Burger', 'Buttermilk-fried chicken with slaw and spicy mayo in a brioche bun.', 390, 'Burger', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80'],
        ['owner2@tripti.com', 'Peri Peri Fries', 'Crispy fries tossed in a smoky peri peri seasoning.', 150, 'Sides', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80'],
        ['owner3@tripti.com', 'Margherita', 'Hand-stretched crust, tomato sauce, fresh mozzarella and basil.', 450, 'Pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'],
        ['owner3@tripti.com', 'Pepperoni Pizza', 'Loaded with spicy pepperoni and bubbling mozzarella cheese.', 550, 'Pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80'],
        ['owner3@tripti.com', 'Cheesy Garlic Bread', 'Toasted baguette with garlic butter, herbs and melted cheese.', 220, 'Sides', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'],
        ['owner4@tripti.com', 'Chocolate Lava Cake', 'Warm chocolate cake with a molten centre and vanilla cream.', 240, 'Dessert', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'],
        ['owner4@tripti.com', 'New York Cheesecake', 'Creamy baked cheesecake on a buttery biscuit base.', 280, 'Dessert', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'],
        ['owner4@tripti.com', 'Iced Latte', 'Double espresso poured over milk and ice.', 160, 'Drinks', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80'],
    ];

    $foodStmt = $pdo->prepare(
        'INSERT INTO foods (restaurant_id, name, description, price, category, image, available)
         VALUES (?, ?, ?, ?, ?, ?, 1)'
    );
    $foodIds = [];
    foreach ($seedFoods as $food) {
        $foodStmt->execute([$ids[$food[0]], $food[1], $food[2], $food[3], $food[4], $food[5]]);
        $foodIds[$food[1]] = (int) $pdo->lastInsertId();
    }

    $orderStmt = $pdo->prepare(
        "INSERT INTO orders
        (code, customer_id, restaurant_id, customer_name, phone, address, note, subtotal, delivery_fee, total, payment, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COD', 'Placed')"
    );
    $orderStmt->execute([
        'TRP-100001',
        $ids['demo@tripti.com'],
        $ids['owner@tripti.com'],
        'Aarav Shrestha',
        '9812345678',
        'Baneshwor, Kathmandu',
        'Please ring the bell twice.',
        500,
        50,
        550,
    ]);
    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id, food_id, name, price, qty) VALUES (?, ?, ?, ?, ?)');
    $itemStmt->execute([$orderId, $foodIds['Chicken Biryani'], 'Chicken Biryani', 320, 1]);
    $itemStmt->execute([$orderId, $foodIds['Steamed Veg Momo'], 'Steamed Veg Momo', 180, 1]);

    $seeded = true;
}

$pdo->exec("
    INSERT INTO customer (Customer_Id, Customer_Name, Customer_Email, Customer_Phone, Customer_Password, Customer_Address, created_at)
    SELECT id, name, email, phone, password_hash, address, created_at
    FROM users WHERE role = 'customer'
    ON DUPLICATE KEY UPDATE Customer_Name = VALUES(Customer_Name), Customer_Phone = VALUES(Customer_Phone), Customer_Password = VALUES(Customer_Password), Customer_Address = VALUES(Customer_Address);

    INSERT INTO restaurant (Restaurant_Id, Restaurant_Owner, Restaurant_Name, Restaurant_Email, Restaurant_Phone, Restaurant_Password, Restaurant_Address, logo, is_open, created_at)
    SELECT id, name, restaurant_name, email, phone, password_hash, address, logo, is_open, created_at
    FROM users WHERE role = 'restaurant'
    ON DUPLICATE KEY UPDATE Restaurant_Owner = VALUES(Restaurant_Owner), Restaurant_Name = VALUES(Restaurant_Name), Restaurant_Phone = VALUES(Restaurant_Phone), Restaurant_Password = VALUES(Restaurant_Password), Restaurant_Address = VALUES(Restaurant_Address), logo = VALUES(logo), is_open = VALUES(is_open);

    INSERT INTO rider (Rider_Id, Rider_Name, Rider_Email, Rider_Phone, Rider_Password, vehicle_type, created_at)
    SELECT id, name, email, phone, password_hash, vehicle_type, created_at
    FROM users WHERE role = 'rider'
    ON DUPLICATE KEY UPDATE Rider_Name = VALUES(Rider_Name), Rider_Phone = VALUES(Rider_Phone), Rider_Password = VALUES(Rider_Password), vehicle_type = VALUES(vehicle_type);
");

json_response([
    'ok' => true,
    'message' => 'Tripti database is ready.',
    'seeded' => $seeded,
    'demoAccounts' => [
        'customer' => 'demo@tripti.com / 123456',
        'restaurant' => 'owner@tripti.com / 123456',
        'rider' => 'rider@tripti.com / 123456',
    ],
]);
