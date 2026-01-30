-- ============================================
-- BOOKING WORKFLOW ENHANCEMENT
-- Adds check-in timer, booking ban, and break features
-- ============================================

-- ============================================
-- ADD NEW COLUMNS TO USERS TABLE
-- ============================================
-- booking_banned_until: Timestamp until which user cannot book (30-min ban after no-show)
ALTER TABLE users ADD COLUMN IF NOT EXISTS booking_banned_until TIMESTAMP WITH TIME ZONE;

-- ============================================
-- ADD NEW COLUMNS TO BOOKINGS TABLE
-- ============================================
-- checkin_deadline: When the 15-min check-in timer expires
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_deadline TIMESTAMP WITH TIME ZONE;

-- verification_token: Unique token for QR code check-in verification
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64);

-- break_started_at: When the user started their break
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS break_started_at TIMESTAMP WITH TIME ZONE;

-- break_duration: Duration of break in minutes (max 30)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 0;

-- is_on_break: Whether user is currently on break
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_on_break BOOLEAN DEFAULT FALSE;

-- no_show_count: Track how many times user didn't check in (for analytics)
ALTER TABLE users ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_deadline ON bookings(checkin_deadline);
CREATE INDEX IF NOT EXISTS idx_bookings_verification_token ON bookings(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_booking_banned_until ON users(booking_banned_until);

-- ============================================
-- FUNCTION: Generate verification token
-- ============================================
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS VARCHAR(64) AS $$
DECLARE
    token VARCHAR(64);
BEGIN
    token := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Check and release expired bookings
-- This should be called periodically (e.g., via cron or edge function)
-- ============================================
CREATE OR REPLACE FUNCTION release_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
    released_count INTEGER := 0;
    expired_booking RECORD;
BEGIN
    -- Find bookings where check-in deadline has passed and not checked in
    FOR expired_booking IN 
        SELECT b.id, b.user_id, b.seat_id 
        FROM bookings b
        WHERE b.status = 'pending'
          AND b.checked_in = FALSE
          AND b.checkin_deadline IS NOT NULL
          AND b.checkin_deadline < NOW()
    LOOP
        -- Update booking status to expired
        UPDATE bookings 
        SET status = 'expired', 
            updated_at = NOW() 
        WHERE id = expired_booking.id;
        
        -- Release the seat
        UPDATE seats 
        SET status = 'available' 
        WHERE id = expired_booking.seat_id;
        
        -- Ban user from booking for 30 minutes
        UPDATE users 
        SET booking_banned_until = NOW() + INTERVAL '30 minutes',
            no_show_count = COALESCE(no_show_count, 0) + 1
        WHERE id = expired_booking.user_id;
        
        released_count := released_count + 1;
    END LOOP;
    
    RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Check and release break-expired bookings
-- Releases seats for users on break who are outside geofence
-- This should be called by the app when break timer expires
-- ============================================
CREATE OR REPLACE FUNCTION release_break_expired_booking(booking_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    booking_record RECORD;
BEGIN
    SELECT * INTO booking_record 
    FROM bookings 
    WHERE id = booking_id 
      AND is_on_break = TRUE
      AND break_started_at IS NOT NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if break has exceeded 30 minutes
    IF booking_record.break_started_at + (COALESCE(booking_record.break_duration, 30) * INTERVAL '1 minute') < NOW() THEN
        -- Release the booking
        UPDATE bookings 
        SET status = 'completed', 
            is_on_break = FALSE,
            updated_at = NOW() 
        WHERE id = booking_id;
        
        -- Release the seat
        UPDATE seats 
        SET status = 'available' 
        WHERE id = booking_record.seat_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-set check-in deadline on booking creation
-- Sets 15-minute deadline from booking creation
-- ============================================
CREATE OR REPLACE FUNCTION set_checkin_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Set check-in deadline to 15 minutes from now
    NEW.checkin_deadline := NOW() + INTERVAL '15 minutes';
    
    -- Generate verification token for QR code
    NEW.verification_token := generate_verification_token();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_checkin_deadline_trigger ON bookings;
CREATE TRIGGER set_checkin_deadline_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_checkin_deadline();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN users.booking_banned_until IS 'Timestamp until which user cannot book seats (30-min ban after no-show)';
COMMENT ON COLUMN users.no_show_count IS 'Number of times user failed to check in within deadline';
COMMENT ON COLUMN bookings.checkin_deadline IS '15-minute deadline for user to check in after booking';
COMMENT ON COLUMN bookings.verification_token IS 'Unique token for QR code verification at library gate';
COMMENT ON COLUMN bookings.break_started_at IS 'When user started their break';
COMMENT ON COLUMN bookings.break_duration IS 'Duration of break in minutes (max 30)';
COMMENT ON COLUMN bookings.is_on_break IS 'Whether user is currently on a break';
