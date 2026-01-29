import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClerkProvider, ClerkLoaded, SignedIn, SignedOut } from '@clerk/clerk-expo';


import HomeScreen from "./src/screens/HomeScreen";
import SeatMapScreen from "./src/screens/SeatMapScreen";
import Header from "./src/components/Header";
import FocusTimerScreen from "./src/screens/FocusTimerScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import SeatDetailsScreen from "./src/screens/SeatDetailsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import LibrarySelectionScreen from "./src/screens/LibrarySelectionScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
import AppLoading from "./src/components/AppLoading";

// Admin Screens
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  AdminLibrariesScreen,
  AddEditLibraryScreen,
  AdminSettingsScreen,
  AdminManageSeatsScreen,
} from "./src/screens/admin";

import { LocationProvider } from "./src/context/LocationContext";
import { BookingProvider } from "./src/context/BookingContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { AdminProvider, useAdmin } from "./src/context/AdminContext";
import { LibraryProvider } from "./src/context/LibraryContext";
import { ToastProvider } from "./src/components/Toast";
import QRScanScreen from "./src/screens/QRScanScreen";
import BookingsScreen from "./src/screens/BookingsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { CLERK_PUBLISHABLE_KEY, tokenCache } from "./src/config/clerk";

import { useFonts, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

function HomeStack() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <HomeScreen />
    </View>
  );
}

function MainTabs() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height based on safe area
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,

          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Montserrat_700Bold",
          fontSize: 10,
          textTransform: "uppercase",
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="event-seat" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={SeatMapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="explore" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={MainTabs} />
        <Stack.Screen name="FocusTimer" component={FocusTimerScreen} />
        <Stack.Screen name="Rewards" component={RewardsScreen} />
        <Stack.Screen name="SeatDetails" component={SeatDetailsScreen} />
        <Stack.Screen
          name="QRScan"
          component={QRScanScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="LibrarySelection"
          component={LibrarySelectionScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </>
  );
}

function AuthNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        <AuthStack.Screen name="AdminLogin" component={AdminLoginScreen} />
      </AuthStack.Navigator>
    </>
  );
}

// Admin Navigation
function AdminNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AdminStack.Navigator screenOptions={{ headerShown: false }}>
        <AdminStack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
        />
        <AdminStack.Screen
          name="AdminLibraries"
          component={AdminLibrariesScreen}
        />
        <AdminStack.Screen
          name="AdminAddLibrary"
          component={AddEditLibraryScreen}
        />
        <AdminStack.Screen
          name="AdminEditLibrary"
          component={AddEditLibraryScreen}
        />
        <AdminStack.Screen
          name="AdminManageSeats"
          component={AdminManageSeatsScreen}
        />
        <AdminStack.Screen
          name="AdminSettings"
          component={AdminSettingsScreen}
        />
      </AdminStack.Navigator>
    </>
  );
}

// Root navigator that handles both user and admin flows
function RootNavigator() {
  const { isAdminLoggedIn, isLoading: isAdminLoading } = useAdmin();

  // Wait for admin session check to complete
  if (isAdminLoading) {
    return <AppLoading />;
  }

  // If admin is logged in, show admin dashboard
  if (isAdminLoggedIn) {
    return <AdminNavigator />;
  }

  // Otherwise show normal user flow with Clerk authentication
  return (
    <>
      <SignedIn>
        <AppContent />
      </SignedIn>
      <SignedOut>
        <AuthNavigator />
      </SignedOut>
    </>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (

    <SafeAreaProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkLoaded>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
              <ThemeProvider>
                <AdminProvider>
                  <AuthProvider>
                    <LibraryProvider>
                      <LocationProvider>
                        <BookingProvider>
                          <ToastProvider>
                            <NavigationContainer>
                              <RootNavigator />
                            </NavigationContainer>
                          </ToastProvider>
                        </BookingProvider>
                      </LocationProvider>
                    </LibraryProvider>
                  </AuthProvider>
                </AdminProvider>
              </ThemeProvider>
            </ErrorBoundary>
          </GestureHandlerRootView>
        </ClerkLoaded>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
