-- Tripti food delivery database (MySQL / MariaDB)
-- Run backend/setup.php instead of importing this file manually:
--   http://localhost/tripti-api/setup.php

CREATE DATABASE IF NOT EXISTS tripti
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tripti;

CREATE TABLE IF NOT EXISTS users (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS foods (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_tokens_hash (token_hash),
  KEY idx_tokens_user (user_id),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
