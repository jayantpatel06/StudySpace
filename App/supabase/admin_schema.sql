-- ============================================
-- ADMIN DASHBOARD SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_default_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LIBRARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS libraries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    opening_time TIME DEFAULT '08:00:00',
    closing_time TIME DEFAULT '22:00:00',
    total_seats INTEGER DEFAULT 0,
    description TEXT,
    image_url TEXT,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- UPDATE SEATS TABLE TO LINK TO LIBRARIES
-- ============================================
ALTER TABLE seats ADD COLUMN IF NOT EXISTS library_id INTEGER REFERENCES libraries(id);

-- ============================================
-- UPDATE BOOKINGS TABLE TO LINK TO LIBRARIES
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS library_id INTEGER REFERENCES libraries(id);

-- ============================================
-- USER SELECTED LIBRARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_selected_library (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    clerk_id VARCHAR(255),  -- Also store clerk_id for easier lookups
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_libraries_active ON libraries(is_active);
CREATE INDEX IF NOT EXISTS idx_libraries_location ON libraries(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_seats_library ON seats(library_id);
CREATE INDEX IF NOT EXISTS idx_bookings_library ON bookings(library_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_library ON user_selected_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_library_clerk ON user_selected_library(clerk_id);

-- ============================================
-- SEED DATA: Default Admin
-- Password: admin123 (BCrypt hash)
-- IMPORTANT: Change this password after first login!
-- ============================================
INSERT INTO admins (email, password_hash, name, is_default_password)
VALUES (
    'admin@studysync.com',
    '$2a$10$rQnM.HvGSHBVrZGQVqJxB.5mMvCp7V9Ys1T2L4kK7vE8nP5dZ6hXe',
    'System Admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- REALTIME SUBSCRIPTIONS FOR LIBRARIES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE libraries;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for admins table
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for libraries table
DROP TRIGGER IF EXISTS update_libraries_updated_at ON libraries;
CREATE TRIGGER update_libraries_updated_at
    BEFORE UPDATE ON libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
