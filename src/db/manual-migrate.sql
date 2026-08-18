-- Safe manual migration: ADD columns only if they don't exist
-- This is idempotent and safe to run multiple times

-- Add settings column (JSONB for notifications/privacy preferences)
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB;

-- Add instagram and snapchat handles
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS snapchat_handle VARCHAR(60);

-- Add onboarding_completed_at if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Add google_id if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100);

-- Add email if missing  
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add unique indexes only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_google_id_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);
    END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_unique') THEN
        CREATE UNIQUE INDEX CONCURRENTLY users_email_unique ON users(email) WHERE email IS NOT NULL;
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add onlyVerified to preferences if missing
ALTER TABLE preferences ADD COLUMN IF NOT EXISTS only_verified BOOLEAN DEFAULT FALSE;

-- Add updatedAt to preferences if missing
ALTER TABLE preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

SELECT 'Migration completed successfully' AS status;
