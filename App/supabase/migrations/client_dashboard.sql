-- ============================================
-- CLIENT DASHBOARD SCHEMA
-- Migration for Library Owner/Client Dashboard
-- ============================================

-- ============================================
-- LIBRARY CLIENTS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS library_clients (
    id SERIAL PRIMARY KEY,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Index for quick username lookup
CREATE INDEX IF NOT EXISTS idx_library_clients_username ON library_clients(username);
CREATE INDEX IF NOT EXISTS idx_library_clients_library_id ON library_clients(library_id);

-- ============================================
-- FLOORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(library_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_floors_library_id ON floors(library_id);

-- ============================================
-- ROOMS/HALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    room_code VARCHAR(20),
    room_type VARCHAR(50) DEFAULT 'Study Hall', -- Study Hall, Reading Room, Private Room, etc.
    capacity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_library_id ON rooms(library_id);

-- ============================================
-- UPDATE SEATS TABLE TO INCLUDE ROOM STRUCTURE
-- ============================================
ALTER TABLE seats ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS seat_number INTEGER;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS row_number INTEGER;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS column_number INTEGER;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add new amenity columns to seats
ALTER TABLE seats ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT FALSE;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS wifi_speed VARCHAR(50) DEFAULT NULL;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE seats ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_seats_room_id ON seats(room_id);

-- ============================================
-- UPDATE ROOMS TABLE WITH ADDITIONAL FIELDS
-- ============================================
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS wifi_speed VARCHAR(50) DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_power_outlets BOOLEAN DEFAULT TRUE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_ac BOOLEAN DEFAULT TRUE;

-- ============================================
-- LIBRARY ANALYTICS TABLE
-- Store daily analytics snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS library_analytics (
    id SERIAL PRIMARY KEY,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0, -- in minutes
    unique_users INTEGER DEFAULT 0,
    peak_occupancy INTEGER DEFAULT 0,
    peak_occupancy_time TIME,
    average_session_duration INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(library_id, date)
);

CREATE INDEX IF NOT EXISTS idx_library_analytics_library_date ON library_analytics(library_id, date);

-- ============================================
-- LIBRARY SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS library_settings (
    id SERIAL PRIMARY KEY,
    library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE,
    allow_advance_booking BOOLEAN DEFAULT TRUE,
    max_booking_hours INTEGER DEFAULT 4,
    booking_advance_days INTEGER DEFAULT 7,
    require_checkin BOOLEAN DEFAULT TRUE,
    checkin_grace_period INTEGER DEFAULT 15, -- minutes
    auto_cancel_no_show BOOLEAN DEFAULT TRUE,
    -- Rewards configuration
    points_per_hour INTEGER DEFAULT 25,
    min_session_for_points INTEGER DEFAULT 60, -- minutes
    bonus_points_quiet_zone INTEGER DEFAULT 10,
    -- Default amenities for new seats
    default_has_power BOOLEAN DEFAULT TRUE,
    default_has_wifi BOOLEAN DEFAULT TRUE,
    default_wifi_speed VARCHAR(50) DEFAULT 'High-Speed',
    default_has_lamp BOOLEAN DEFAULT FALSE,
    default_has_ergo_chair BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(library_id)
);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE floors;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE library_clients;

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
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_library_clients_updated_at ON library_clients;
CREATE TRIGGER update_library_clients_updated_at
    BEFORE UPDATE ON library_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_floors_updated_at ON floors;
CREATE TRIGGER update_floors_updated_at
    BEFORE UPDATE ON floors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_settings_updated_at ON library_settings;
CREATE TRIGGER update_library_settings_updated_at
    BEFORE UPDATE ON library_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Current Library Status
CREATE OR REPLACE VIEW library_status AS
SELECT 
    l.id AS library_id,
    l.name AS library_name,
    COUNT(DISTINCT s.id) AS total_seats,
    COUNT(DISTINCT CASE WHEN s.status = 'occupied' THEN s.id END) AS occupied_seats,
    COUNT(DISTINCT CASE WHEN s.status = 'available' THEN s.id END) AS available_seats,
    COUNT(DISTINCT CASE WHEN s.status = 'reserved' THEN s.id END) AS reserved_seats,
    COUNT(DISTINCT CASE WHEN b.status = 'active' AND b.checked_in = TRUE THEN b.user_id END) AS active_users
FROM libraries l
LEFT JOIN seats s ON s.library_id = l.id AND s.is_active = TRUE
LEFT JOIN bookings b ON b.library_id = l.id AND b.status = 'active' AND b.start_time <= NOW()
WHERE l.is_active = TRUE
GROUP BY l.id, l.name;

-- View: Room Occupancy
CREATE OR REPLACE VIEW room_occupancy AS
SELECT 
    r.id AS room_id,
    r.room_name,
    r.library_id,
    f.floor_number,
    COUNT(DISTINCT s.id) AS total_seats,
    COUNT(DISTINCT CASE WHEN s.status = 'occupied' THEN s.id END) AS occupied_seats,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT s.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN s.status = 'occupied' THEN s.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100 
            ELSE 0 
        END, 
        2
    ) AS occupancy_percentage
FROM rooms r
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN seats s ON s.room_id = r.id AND s.is_active = TRUE
WHERE r.is_active = TRUE
GROUP BY r.id, r.room_name, r.library_id, f.floor_number;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE library_clients IS 'Stores library owner/client credentials for dashboard access';
COMMENT ON TABLE floors IS 'Library floor structure';
COMMENT ON TABLE rooms IS 'Rooms/halls within each floor';
COMMENT ON TABLE library_analytics IS 'Daily analytics snapshots for each library';
COMMENT ON TABLE library_settings IS 'Configurable settings for each library';
