# Library Client Dashboard

Web-based dashboard for library owners/clients to manage their libraries in the StudySync ecosystem.

## Features

- **Authentication**: Secure login with credentials provided by the admin
- **Dashboard Overview**: Real-time stats on seat occupancy, active students, and bookings
- **Seat Management**: Configure floors, rooms, and seat matrices
- **Analytics**: Track booking trends, peak hours, and usage patterns
- **Settings**: Update library information and account settings

## Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Access to the same Supabase instance as the main app

### Installation

```bash
cd clientDashboard
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## Database Setup

Before using the dashboard, run the migration script in Supabase:

1. Open Supabase SQL Editor
2. Run `App/supabase/migrations/client_dashboard.sql`

This creates the following tables:

- `library_clients` - Client authentication credentials
- `floors` - Library floor structure
- `rooms` - Rooms/halls within floors
- `library_analytics` - Daily analytics snapshots
- `library_settings` - Library configuration

## Authentication Flow

1. Admin creates a library in the mobile app
2. System automatically generates unique username/password for the library owner
3. Admin shares credentials with the library owner
4. Library owner logs in to this dashboard

## Architecture

```
Floor 1
├── Hall A (20 seats)
│   └── Seat Matrix: 4 rows × 5 columns
├── Reading Room (12 seats)
│   └── Seat Matrix: 3 rows × 4 columns
└── Private Study (6 seats)
    └── Seat Matrix: 2 rows × 3 columns

Floor 2
├── Computer Lab (30 seats)
└── Group Study Room (16 seats)
```

## Integration with Mobile App

The seat structure configured in this dashboard is automatically synced with the mobile app:

1. Library owner configures floors → rooms → seats in the dashboard
2. Users opening the mobile app see the same seat layout
3. Real-time updates keep occupancy status in sync

## Tech Stack

- React 18 with Vite
- Tailwind CSS for styling
- Zustand for state management
- Chart.js for analytics visualizations
- Supabase for database and real-time updates

## API Reference

The dashboard uses the same Supabase instance as the mobile app. Key tables:

- `libraries` - Library information
- `library_clients` - Dashboard authentication
- `floors` - Floor configuration
- `rooms` - Room/hall configuration
- `seats` - Individual seat data
- `bookings` - User bookings
- `users` - Student information

## License

Part of the StudySync project.
