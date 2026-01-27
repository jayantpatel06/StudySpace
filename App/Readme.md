# 📚 StudySync App

A modern React Native mobile application for library seat booking, productivity tracking, and study space management. Built with Expo and designed to help students find, book, and maximize their study sessions.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=flat&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat&logo=clerk)

## ✨ Features

### 🪑 Seat Booking System
- Interactive seat map with real-time availability
- Detailed seat information and booking flow
- QR code scanning for quick check-ins
- View and manage your bookings

### ⏱️ Focus Timer
- Pomodoro-style focus timer for productive study sessions
- Track your study time and productivity

### 🎁 Rewards System
- Earn rewards for consistent studying
- Gamified experience to boost motivation

### 📍 Location Services
- Geolocation-based library discovery
- Geofencing for automatic check-ins

### 🔔 Notifications
- Push notifications for booking reminders
- Study session alerts

### 🌙 Theme Support
- Light and dark mode support
- Modern, clean UI design

### 🔐 Authentication
- Secure authentication via Clerk
- User profiles and preferences

### 📡 Real-time Updates
- Live seat availability updates via Supabase Realtime
- Offline support with sync queue

## 🛠️ Tech Stack

- **Framework:** React Native with Expo
- **Styling:** NativeWind (TailwindCSS)
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **Backend:** Supabase
- **Authentication:** Clerk
- **Fonts:** Google Fonts (Montserrat, Inter)
- **State Management:** React Context API

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/StudySync.git
cd StudySync

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Run in web browser
npm run web
```

## 📱 Run on Mobile Device

1. Download **Expo Go** app:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run `npm start` in the terminal

3. Scan the QR code with:
   - **Android:** Expo Go app
   - **iOS:** Camera app

## 📁 Project Structure

```
StudySync/
├── App.js                 # Main application entry
├── src/
│   ├── components/        # Reusable UI components
│   ├── config/            # App configuration (Clerk, etc.)
│   ├── context/           # React Context providers
│   │   ├── AuthContext.js
│   │   ├── BookingContext.js
│   │   ├── LocationContext.js
│   │   └── ThemeContext.js
│   ├── hooks/             # Custom React hooks
│   ├── screens/           # App screens
│   │   ├── HomeScreen.js
│   │   ├── SeatMapScreen.js
│   │   ├── SeatDetailsScreen.js
│   │   ├── BookingsScreen.js
│   │   ├── FocusTimerScreen.js
│   │   ├── RewardsScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── QRScanScreen.js
│   │   ├── LoginScreen.js
│   │   └── SignUpScreen.js
│   ├── services/          # API and service layers
│   │   ├── api.js
│   │   ├── geolocation.js
│   │   ├── notifications.js
│   │   ├── offline.js
│   │   ├── realtime.js
│   │   └── syncQueue.js
│   └── utils/             # Utility functions
├── supabase/              # Supabase configuration
└── assets/                # Images and static assets
```

## ⚙️ Configuration

### Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the required tables for seats, bookings, and users
3. Enable Realtime for live updates

### Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Add your publishable key to the environment variables
3. Configure authentication methods (email, social, etc.)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Made with ❤️ for students everywhere
</p>
