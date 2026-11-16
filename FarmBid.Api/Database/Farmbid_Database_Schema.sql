-- ============================================================
-- FARM BID - DATABASE SCHEMA
-- MariaDB 11.4 compatible
--
-- Schema only: no demo records, passwords, API keys, SMTP
-- credentials, or other secrets.
--
-- IMPORTANT:
-- 1. Intended for a NEW, EMPTY FarmBid database.
-- 2. Does NOT drop or overwrite existing tables.
-- 3. CREATE TABLE IF NOT EXISTS does not alter an older table.
--    For an existing database, use reviewed ALTER TABLE changes.
-- 4. Follows the approved FarmBid ERD and current
--    FarmBidDbContext mappings, including email verification.
-- ============================================================

CREATE DATABASE IF NOT EXISTS farmbid_database
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE farmbid_database;

-- 1. USER
CREATE TABLE IF NOT EXISTS `user` (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NULL,
    role ENUM('Farmer', 'Buyer') NOT NULL,
    account_status ENUM('Active', 'Pending', 'Disabled') NOT NULL DEFAULT 'Pending',
    email_verification_code_hash VARCHAR(255) NULL,
    email_verification_attempts INT NOT NULL DEFAULT 0,
    email_verification_expires_at DATETIME NULL,
    email_verification_sent_at DATETIME NULL,
    email_verified_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CROP_CATEGORY
CREATE TABLE IF NOT EXISTS crop_category (
    category_id BIGINT NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_crop_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CROP
CREATE TABLE IF NOT EXISTS crop (
    crop_id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    PRIMARY KEY (crop_id),
    KEY ix_crop_category_id (category_id),
    CONSTRAINT fk_crop_category
        FOREIGN KEY (category_id) REFERENCES crop_category(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. HARVEST_LISTING
CREATE TABLE IF NOT EXISTS harvest_listing (
    listing_id BIGINT NOT NULL AUTO_INCREMENT,
    farmer_id BIGINT NOT NULL,
    crop_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quality_grade VARCHAR(50) NULL,
    starting_price DECIMAL(12,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    harvest_date DATE NOT NULL,
    bid_deadline DATETIME NOT NULL,
    description TEXT NULL,
    status ENUM('Active', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (listing_id),
    KEY ix_harvest_listing_farmer_id (farmer_id),
    KEY ix_harvest_listing_crop_id (crop_id),
    CONSTRAINT fk_harvest_listing_farmer
        FOREIGN KEY (farmer_id) REFERENCES `user`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_harvest_listing_crop
        FOREIGN KEY (crop_id) REFERENCES crop(crop_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BID
CREATE TABLE IF NOT EXISTS bid (
    bid_id BIGINT NOT NULL AUTO_INCREMENT,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    offered_price DECIMAL(12,2) NOT NULL,
    requested_quantity DECIMAL(12,2) NOT NULL,
    message TEXT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bid_id),
    KEY ix_bid_listing_id (listing_id),
    KEY ix_bid_buyer_id (buyer_id),
    CONSTRAINT fk_bid_listing
        FOREIGN KEY (listing_id) REFERENCES harvest_listing(listing_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bid_buyer
        FOREIGN KEY (buyer_id) REFERENCES `user`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. LISTING_IMAGE
CREATE TABLE IF NOT EXISTS listing_image (
    image_id BIGINT NOT NULL AUTO_INCREMENT,
    listing_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    KEY ix_listing_image_listing_id (listing_id),
    CONSTRAINT fk_listing_image_listing
        FOREIGN KEY (listing_id) REFERENCES harvest_listing(listing_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AI_ANALYSIS
CREATE TABLE IF NOT EXISTS ai_analysis (
    analysis_id BIGINT NOT NULL AUTO_INCREMENT,
    listing_id BIGINT NOT NULL,
    generated_by BIGINT NOT NULL,
    analysis_result TEXT NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (analysis_id),
    KEY ix_ai_analysis_listing_id (listing_id),
    KEY ix_ai_analysis_generated_by (generated_by),
    CONSTRAINT fk_ai_analysis_listing
        FOREIGN KEY (listing_id) REFERENCES harvest_listing(listing_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ai_analysis_generated_by
        FOREIGN KEY (generated_by) REFERENCES `user`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TRANSACTION
CREATE TABLE IF NOT EXISTS `transaction` (
    transaction_id BIGINT NOT NULL AUTO_INCREMENT,
    bid_id BIGINT NOT NULL,
    agreed_price DECIMAL(12,2) NOT NULL,
    agreed_quantity DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    transaction_status ENUM('Pending', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    PRIMARY KEY (transaction_id),
    UNIQUE KEY uq_transaction_bid_id (bid_id),
    CONSTRAINT fk_transaction_bid
        FOREIGN KEY (bid_id) REFERENCES bid(bid_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional verification queries:
-- SHOW TABLES;
-- DESCRIBE `user`;
-- DESCRIBE crop_category;
-- DESCRIBE crop;
-- DESCRIBE harvest_listing;
-- DESCRIBE bid;
-- DESCRIBE listing_image;
-- DESCRIBE ai_analysis;
-- DESCRIBE `transaction`;
