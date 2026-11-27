START TRANSACTION;
ALTER TABLE "user" ALTER COLUMN email_verified_at TYPE timestamp with time zone;

ALTER TABLE "user" ALTER COLUMN email_verification_sent_at TYPE timestamp with time zone;

ALTER TABLE "user" ALTER COLUMN email_verification_expires_at TYPE timestamp with time zone;

ALTER TABLE "user" ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE transaction ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE transaction ALTER COLUMN completed_at TYPE timestamp with time zone;

ALTER TABLE listing_image ALTER COLUMN uploaded_at TYPE timestamp with time zone;

ALTER TABLE harvest_listing ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE harvest_listing ALTER COLUMN bid_deadline TYPE timestamp with time zone;

ALTER TABLE bid ALTER COLUMN updated_at TYPE timestamp with time zone;

ALTER TABLE bid ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE ai_market_report ALTER COLUMN generated_at TYPE timestamp with time zone;

ALTER TABLE ai_analysis ALTER COLUMN generated_at TYPE timestamp with time zone;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261127160821_UseUtcTimestamps', '9.0.1');

COMMIT;

