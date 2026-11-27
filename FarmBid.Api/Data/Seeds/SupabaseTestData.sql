-- FarmBid development seed data
-- Run once, after the UseUtcTimestamps migration has been applied.
-- Test-account password for every account below: demo1234

BEGIN;

WITH
vegetables AS (
    INSERT INTO crop_category (category_name, description)
    VALUES ('Vegetables', 'Fresh vegetable crops')
    RETURNING category_id
),
grains AS (
    INSERT INTO crop_category (category_name, description)
    VALUES ('Grains', 'Grain and cereal crops')
    RETURNING category_id
),
fruits AS (
    INSERT INTO crop_category (category_name, description)
    VALUES ('Fruits', 'Fresh fruit crops')
    RETURNING category_id
),
tomato AS (
    INSERT INTO crop (category_id, crop_name, description)
    SELECT category_id, 'Tomato', 'Fresh market tomatoes' FROM vegetables
    RETURNING crop_id
),
rice AS (
    INSERT INTO crop (category_id, crop_name, description)
    SELECT category_id, 'Rice', 'Freshly milled rice' FROM grains
    RETURNING crop_id
),
mango AS (
    INSERT INTO crop (category_id, crop_name, description)
    SELECT category_id, 'Mango', 'Carabao mangoes' FROM fruits
    RETURNING crop_id
),
farmer_maria AS (
    INSERT INTO "user" (
        full_name, email, password_hash, phone_number, role, account_status,
        email_verified_at, created_at
    ) VALUES (
        'Maria Santos', 'farmer.maria@test.farmbid.local',
        '$2a$11$yAhz84kADxfc71MYl3RQm.91ohJsEfUd8ALwgrT6Yi/9z8krVtxO.',
        '09171234567', 'Farmer', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '45 days'
    ) RETURNING user_id
),
farmer_ramon AS (
    INSERT INTO "user" (
        full_name, email, password_hash, phone_number, role, account_status,
        email_verified_at, created_at
    ) VALUES (
        'Ramon Dela Cruz', 'farmer.ramon@test.farmbid.local',
        '$2a$11$yAhz84kADxfc71MYl3RQm.91ohJsEfUd8ALwgrT6Yi/9z8krVtxO.',
        '09181234567', 'Farmer', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '30 days'
    ) RETURNING user_id
),
buyer_joel AS (
    INSERT INTO "user" (
        full_name, email, password_hash, phone_number, role, account_status,
        email_verified_at, created_at
    ) VALUES (
        'Joel Reyes', 'buyer.joel@test.farmbid.local',
        '$2a$11$yAhz84kADxfc71MYl3RQm.91ohJsEfUd8ALwgrT6Yi/9z8krVtxO.',
        '09191234567', 'Buyer', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '20 days'
    ) RETURNING user_id
),
buyer_anna AS (
    INSERT INTO "user" (
        full_name, email, password_hash, phone_number, role, account_status,
        email_verified_at, created_at
    ) VALUES (
        'Anna Villanueva', 'buyer.anna@test.farmbid.local',
        '$2a$11$yAhz84kADxfc71MYl3RQm.91ohJsEfUd8ALwgrT6Yi/9z8krVtxO.',
        '09201234567', 'Buyer', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '12 days'
    ) RETURNING user_id
),
tomato_listing AS (
    INSERT INTO harvest_listing (
        farmer_id, crop_id, quantity, unit, quality_grade, starting_price,
        location, harvest_date, bid_deadline, description, status, created_at
    ) SELECT
        farmer_maria.user_id, tomato.crop_id, 500.00, 'kg', 'A', 42.00,
        'Benguet', CURRENT_DATE - 1, CURRENT_TIMESTAMP + INTERVAL '5 days',
        'Firm, sorted tomatoes packed in 20 kg crates.', 'Active', CURRENT_TIMESTAMP - INTERVAL '1 day'
    FROM farmer_maria CROSS JOIN tomato
    RETURNING listing_id
),
rice_listing AS (
    INSERT INTO harvest_listing (
        farmer_id, crop_id, quantity, unit, quality_grade, starting_price,
        location, harvest_date, bid_deadline, description, status, created_at
    ) SELECT
        farmer_ramon.user_id, rice.crop_id, 1000.00, 'kg', 'A', 48.00,
        'Nueva Ecija', CURRENT_DATE - 2, CURRENT_TIMESTAMP + INTERVAL '7 days',
        'Freshly milled rice, packed in 50 kg sacks.', 'Active', CURRENT_TIMESTAMP - INTERVAL '2 days'
    FROM farmer_ramon CROSS JOIN rice
    RETURNING listing_id
),
mango_listing AS (
    INSERT INTO harvest_listing (
        farmer_id, crop_id, quantity, unit, quality_grade, starting_price,
        location, harvest_date, bid_deadline, description, status, created_at
    ) SELECT
        farmer_maria.user_id, mango.crop_id, 300.00, 'kg', 'A', 95.00,
        'Guimaras', CURRENT_DATE - 3, CURRENT_TIMESTAMP + INTERVAL '3 days',
        'Sweet Carabao mangoes, sorted for wholesale buyers.', 'Active', CURRENT_TIMESTAMP - INTERVAL '3 days'
    FROM farmer_maria CROSS JOIN mango
    RETURNING listing_id
),
closed_mango_listing AS (
    INSERT INTO harvest_listing (
        farmer_id, crop_id, quantity, unit, quality_grade, starting_price,
        location, harvest_date, bid_deadline, description, status, created_at
    ) SELECT
        farmer_ramon.user_id, mango.crop_id, 120.00, 'kg', 'B', 80.00,
        'Guimaras', CURRENT_DATE - 8, CURRENT_TIMESTAMP - INTERVAL '2 days',
        'Completed sample sale for transaction testing.', 'Closed', CURRENT_TIMESTAMP - INTERVAL '8 days'
    FROM farmer_ramon CROSS JOIN mango
    RETURNING listing_id
),
accepted_bid AS (
    INSERT INTO bid (
        listing_id, buyer_id, offered_price, requested_quantity, message,
        status, created_at, updated_at
    ) SELECT
        closed_mango_listing.listing_id, buyer_anna.user_id, 85.00, 120.00,
        'I can collect this tomorrow morning.', 'Accepted',
        CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'
    FROM closed_mango_listing CROSS JOIN buyer_anna
    RETURNING bid_id
),
pending_tomato_bid AS (
    INSERT INTO bid (
        listing_id, buyer_id, offered_price, requested_quantity, message,
        status, created_at, updated_at
    ) SELECT
        tomato_listing.listing_id, buyer_joel.user_id, 45.00, 250.00,
        'Interested in a regular weekly supply.', 'Pending',
        CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours'
    FROM tomato_listing CROSS JOIN buyer_joel
    RETURNING bid_id
),
pending_rice_bid AS (
    INSERT INTO bid (
        listing_id, buyer_id, offered_price, requested_quantity, message,
        status, created_at, updated_at
    ) SELECT
        rice_listing.listing_id, buyer_anna.user_id, 50.00, 1000.00,
        'Can pick up the full lot this week.', 'Pending',
        CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'
    FROM rice_listing CROSS JOIN buyer_anna
    RETURNING bid_id
)
INSERT INTO transaction (
    bid_id, agreed_price, agreed_quantity, total_amount, transaction_status,
    created_at, completed_at
)
SELECT
    accepted_bid.bid_id, 85.00, 120.00, 10200.00, 'Completed',
    CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days'
FROM accepted_bid;

COMMIT;
