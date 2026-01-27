-- ============================================
-- MIGRATION: Add clerk_id to users table
-- Run this if you already have the users table created
-- ============================================

-- Add clerk_id column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Add last_login_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for clerk_id lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Add clerk_id column to user_selected_library table
ALTER TABLE user_selected_library ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255);

-- Create index for clerk_id in user_selected_library
CREATE INDEX IF NOT EXISTS idx_user_selected_library_clerk ON user_selected_library(clerk_id);

-- ============================================
-- Update trigger for users table updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
