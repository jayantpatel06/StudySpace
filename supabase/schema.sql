-- StudySync Database Schema for Supabase
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE,  -- Clerk user ID for authentication sync
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department VARCHAR(100),
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0, -- in minutes
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for clerk_id lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- ============================================
-- SEATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seats (
    id VARCHAR(10) PRIMARY KEY,  -- e.g., 'A1', 'B2'
    label VARCHAR(10) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    zone VARCHAR(50) DEFAULT 'General',
    has_power BOOLEAN DEFAULT FALSE,
    is_quiet_zone BOOLEAN DEFAULT FALSE,
    has_lamp BOOLEAN DEFAULT FALSE,
    has_ergo_chair BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seat_id VARCHAR(10) REFERENCES seats(id) ON DELETE CASCADE,
    location VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, cancelled
    checked_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FOCUS SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL, -- seconds completed
    points_earned INTEGER DEFAULT 0,
    session_type VARCHAR(20) DEFAULT 'work', -- work, break
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seat_id ON bookings(seat_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_seats_floor ON seats(floor);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);

-- ============================================
-- SEED DATA: Default User
-- ============================================
-- Use DO block to handle existing data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = 1) THEN
        INSERT INTO users (id, name, email, department, points, streak, total_focus_time)
        VALUES (1, 'Alex Sterling', 'alex@university.edu', 'Computer Science', 2450, 7, 1240);
    END IF;
END $$;

-- ============================================
-- SEED DATA: Seats for Floor 1
-- ============================================
INSERT INTO seats (id, label, floor, zone, has_power, is_quiet_zone, status) VALUES
    ('A1', 'A1', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('A2', 'A2', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('A3', 'A3', 1, 'Quiet Study', FALSE, TRUE, 'occupied'),
    ('A4', 'A4', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('A5', 'A5', 1, 'Quiet Study', TRUE, TRUE, 'reserved'),
    ('A6', 'A6', 1, 'Quiet Study', FALSE, TRUE, 'occupied'),
    ('B1', 'B1', 1, 'Quiet Study', TRUE, TRUE, 'occupied'),
    ('B2', 'B2', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('B3', 'B3', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('B4', 'B4', 1, 'Quiet Study', FALSE, TRUE, 'available'),
    ('B5', 'B5', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('B6', 'B6', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('C1', 'C1', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('C2', 'C2', 1, 'Quiet Study', FALSE, TRUE, 'occupied'),
    ('C3', 'C3', 1, 'Quiet Study', TRUE, TRUE, 'occupied'),
    ('C4', 'C4', 1, 'Quiet Study', TRUE, TRUE, 'reserved'),
    ('C5', 'C5', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('C6', 'C6', 1, 'Quiet Study', FALSE, TRUE, 'available'),
    ('D1', 'D1', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('D2', 'D2', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('D3', 'D3', 1, 'Quiet Study', TRUE, TRUE, 'available'),
    ('D4', 'D4', 1, 'Quiet Study', FALSE, TRUE, 'occupied'),
    ('D5', 'D5', 1, 'Quiet Study', TRUE, TRUE, 'occupied'),
    ('D6', 'D6', 1, 'Quiet Study', TRUE, TRUE, 'available')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED DATA: Additional Leaderboard Users
-- ============================================
INSERT INTO users (name, email, department, points, streak, total_focus_time) VALUES
    ('Sarah Chen', 'sarah.chen@university.edu', 'Biology', 3200, 14, 1560),
    ('Marcus Johnson', 'marcus.j@university.edu', 'Engineering', 2800, 10, 1380),
    ('Emma Williams', 'emma.w@university.edu', 'Mathematics', 2650, 8, 1290),
    ('David Kim', 'david.k@university.edu', 'Physics', 2100, 5, 980)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable for production use
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- Enable for seats to get live updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
