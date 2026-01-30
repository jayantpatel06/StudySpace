-- ============================================
-- LIBRARY SUBSCRIPTIONS SCHEMA
-- Migration for Student Library Subscriptions
-- ============================================

-- ============================================
-- LIBRARY SUBSCRIPTIONS TABLE
-- Tracks which students are subscribed to which libraries
-- ============================================
CREATE TABLE IF NOT EXISTS library_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    subscription_code VARCHAR(50), -- Unique code used during subscription
    status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES library_clients(id), -- Library client who added the student
    notes TEXT,
    UNIQUE(user_id, library_id)
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_library_subscriptions_user_id ON library_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_library_subscriptions_library_id ON library_subscriptions(library_id);
CREATE INDEX IF NOT EXISTS idx_library_subscriptions_status ON library_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_library_subscriptions_code ON library_subscriptions(subscription_code);

-- ============================================
-- ADD UNIQUE STUDENT CODE TO USERS TABLE
-- This code is used by library clients to add students
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_code VARCHAR(10) UNIQUE;

-- Generate student code for existing users (if not exists)
-- Format: STU + 6 random alphanumeric characters
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    IF NEW.student_code IS NULL THEN
        LOOP
            new_code := 'STU' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
            SELECT EXISTS(SELECT 1 FROM users WHERE student_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        NEW.student_code := new_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate student code on insert
DROP TRIGGER IF EXISTS generate_student_code_trigger ON users;
CREATE TRIGGER generate_student_code_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_student_code();

-- Generate student codes for existing users without one
DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    FOR user_record IN SELECT id FROM users WHERE student_code IS NULL LOOP
        LOOP
            new_code := 'STU' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
            SELECT EXISTS(SELECT 1 FROM users WHERE student_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE users SET student_code = new_code WHERE id = user_record.id;
    END LOOP;
END $$;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE library_subscriptions;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE library_subscriptions IS 'Tracks student subscriptions to libraries. Students can only see and access libraries they are subscribed to.';
COMMENT ON COLUMN users.student_code IS 'Unique code that students share with library owners to get subscribed to a library.';
