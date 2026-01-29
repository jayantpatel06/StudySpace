-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id integer NOT NULL DEFAULT nextval('admins_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  name character varying NOT NULL,
  is_default_password boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bookings (
  id integer NOT NULL DEFAULT nextval('bookings_id_seq'::regclass),
  user_id integer,
  seat_id character varying,
  location character varying,
  start_time timestamp with time zone NOT NULL,
  duration integer NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  checked_in boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  library_id integer,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT bookings_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id),
  CONSTRAINT bookings_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.floors (
  id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
  library_id integer,
  floor_number integer NOT NULL,
  floor_name character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT floors_pkey PRIMARY KEY (id),
  CONSTRAINT floors_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.focus_sessions (
  id integer NOT NULL DEFAULT nextval('focus_sessions_id_seq'::regclass),
  user_id integer,
  duration integer NOT NULL,
  points_earned integer DEFAULT 0,
  session_type character varying DEFAULT 'work'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT focus_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT focus_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.libraries (
  id integer NOT NULL DEFAULT nextval('libraries_id_seq'::regclass),
  name character varying NOT NULL,
  address text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_meters integer DEFAULT 100,
  is_active boolean DEFAULT true,
  opening_time time without time zone DEFAULT '08:00:00'::time without time zone,
  closing_time time without time zone DEFAULT '22:00:00'::time without time zone,
  total_seats integer DEFAULT 0,
  description text,
  image_url text,
  created_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT libraries_pkey PRIMARY KEY (id),
  CONSTRAINT libraries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id)
);
CREATE TABLE public.library_analytics (
  id integer NOT NULL DEFAULT nextval('library_analytics_id_seq'::regclass),
  library_id integer,
  date date NOT NULL,
  total_bookings integer DEFAULT 0,
  total_checkins integer DEFAULT 0,
  total_focus_time integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  peak_occupancy integer DEFAULT 0,
  peak_occupancy_time time without time zone,
  average_session_duration integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT library_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT library_analytics_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.library_clients (
  id integer NOT NULL DEFAULT nextval('library_clients_id_seq'::regclass),
  library_id integer,
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  name character varying NOT NULL,
  email character varying,
  phone character varying,
  is_active boolean DEFAULT true,
  created_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone,
  CONSTRAINT library_clients_pkey PRIMARY KEY (id),
  CONSTRAINT library_clients_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id),
  CONSTRAINT library_clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id)
);
CREATE TABLE public.library_settings (
  id integer NOT NULL DEFAULT nextval('library_settings_id_seq'::regclass),
  library_id integer UNIQUE,
  allow_advance_booking boolean DEFAULT true,
  max_booking_hours integer DEFAULT 4,
  booking_advance_days integer DEFAULT 7,
  require_checkin boolean DEFAULT true,
  checkin_grace_period integer DEFAULT 15,
  auto_cancel_no_show boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  points_per_hour integer DEFAULT 25,
  min_session_for_points integer DEFAULT 60,
  bonus_points_quiet_zone integer DEFAULT 10,
  default_has_power boolean DEFAULT true,
  default_has_wifi boolean DEFAULT true,
  default_wifi_speed character varying DEFAULT 'High-Speed'::character varying,
  default_has_lamp boolean DEFAULT false,
  default_has_ergo_chair boolean DEFAULT false,
  CONSTRAINT library_settings_pkey PRIMARY KEY (id),
  CONSTRAINT library_settings_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.rooms (
  id integer NOT NULL DEFAULT nextval('rooms_id_seq'::regclass),
  floor_id integer,
  library_id integer,
  room_name character varying NOT NULL,
  room_code character varying,
  room_type character varying DEFAULT 'Study Hall'::character varying,
  capacity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  description text,
  has_wifi boolean DEFAULT false,
  wifi_speed character varying DEFAULT NULL::character varying,
  has_power_outlets boolean DEFAULT true,
  has_ac boolean DEFAULT true,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_floor_id_fkey FOREIGN KEY (floor_id) REFERENCES public.floors(id),
  CONSTRAINT rooms_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.seats (
  id character varying NOT NULL,
  label character varying NOT NULL,
  floor integer NOT NULL DEFAULT 1,
  zone character varying DEFAULT 'General'::character varying,
  has_power boolean DEFAULT false,
  is_quiet_zone boolean DEFAULT false,
  has_lamp boolean DEFAULT false,
  has_ergo_chair boolean DEFAULT false,
  status character varying DEFAULT 'available'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  library_id integer,
  room_id integer,
  seat_number integer,
  row_number integer,
  column_number integer,
  is_active boolean DEFAULT true,
  has_wifi boolean DEFAULT false,
  wifi_speed character varying DEFAULT NULL::character varying,
  description text,
  image_url text,
  CONSTRAINT seats_pkey PRIMARY KEY (id),
  CONSTRAINT seats_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id),
  CONSTRAINT seats_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.user_selected_library (
  id integer NOT NULL DEFAULT nextval('user_selected_library_id_seq'::regclass),
  user_id integer UNIQUE,
  library_id integer,
  selected_at timestamp with time zone DEFAULT now(),
  clerk_id character varying,
  CONSTRAINT user_selected_library_pkey PRIMARY KEY (id),
  CONSTRAINT user_selected_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_selected_library_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying UNIQUE,
  department character varying,
  avatar_url text,
  points integer DEFAULT 0,
  streak integer DEFAULT 0,
  total_focus_time integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  clerk_id character varying UNIQUE,
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);