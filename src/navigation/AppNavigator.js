import React, { useState, useEffect } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import UserDashboard from "../screens/user/UserDashboard";
import UserBookings from "../screens/user/UserBookings";
import UserProfile from "../screens/user/UserProfile";
import ManagerDashboard from "../screens/manager/ManagerDashboard";
import ManagerBookings from "../screens/manager/ManagerBookings";
import ManagerVenues from "../screens/manager/ManagerVenues";
import ManagerVacations from "../screens/manager/ManagerVacations";
import ManagerProfile from "../screens/manager/ManagerProfile";
import NewBookingScreen from "../screens/user/NewBookingScreen";
import VenueDetails from "../screens/manager/VenueDetails";
import CustomHeader from "../components/CustomHeader";
import AddCourt from "../screens/manager/AddCourt";
import CourtBookings from "../screens/manager/CourtBookings";
import AddVenue from "../screens/manager/AddVenue";
import CreateBooking from "../screens/manager/CreateBooking";

// NEW EVENT SCREENS
import EventsList from "../screens/manager/EventsList";
import EventForm from "../screens/manager/EventForm";
import EventDetails from "../screens/manager/EventDetails";

// PROFILE SCREENS
import EditProfile from "../screens/manager/EditProfile";
import ChangePassword from "../screens/manager/ChangePassword";
import Language from "../screens/manager/Language";
import AppSettings from "../screens/manager/AppSettings";
import AboutUs from "../screens/manager/AboutUs";
import FAQs from "../screens/manager/FAQs";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconKey;
          if (route.name === "Dashboard") iconKey = "home";
          else if (route.name === "Bookings") iconKey = "bookings";
          else if (route.name === "Profile") iconKey = "profile";
          return <Icon icon={iconKey} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={UserDashboard} />
      <Tab.Screen name="Bookings" component={UserBookings} />
      <Tab.Screen name="Profile" component={UserProfile} />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState("Home");
  const fabAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(fabAnimation, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const animatedStyle = {
    transform: [
      {
        scale: fabAnimation,
      },
    ],
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconKey;
            if (route.name === "Home") iconKey = "home";
            else if (route.name === "Bookings") iconKey = "bookings";
            else if (route.name === "Events") iconKey = "events";
            else if (route.name === "Venues") iconKey = "venues";
            else if (route.name === "Vacations") iconKey = "vacations";
            return <Icon icon={iconKey} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
          headerShown: true,
          header: () => <CustomHeader />,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
        })}
      >
        <Tab.Screen
          name="Home"
          component={ManagerDashboard}
          options={{ tabBarLabel: "Home" }}
          listeners={{
            focus: () => setCurrentTab("Home"),
          }}
        />
        <Tab.Screen
          name="Bookings"
          component={ManagerBookings}
          options={{ tabBarLabel: "Bookings" }}
          listeners={{
            focus: () => setCurrentTab("Bookings"),
          }}
        />
        <Tab.Screen
          name="Events"
          component={EventsList}
          options={{ tabBarLabel: "Events" }}
          listeners={{
            focus: () => setCurrentTab("Events"),
          }}
        />
        <Tab.Screen
          name="Venues"
          component={ManagerVenues}
          options={{ tabBarLabel: "Venues" }}
          listeners={{
            focus: () => setCurrentTab("Venues"),
          }}
        />
        <Tab.Screen
          name="Vacations"
          component={ManagerVacations}
          options={{ tabBarLabel: "Vacations" }}
          listeners={{
            focus: () => setCurrentTab("Vacations"),
          }}
        />
      </Tab.Navigator>

      {/* Centered Floating Action Button - Only visible on Home screen */}
      {currentTab === "Home" && (
        <Animated.View style={[styles.fabContainer, animatedStyle]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              navigation.navigate("AddVenue");
            }}
            activeOpacity={0.8}
          >
            <Icon icon="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

export default function AppNavigator() {
  const { isLoggedIn, userRole, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === "user" ? (
          // User Stack
          <>
            <Stack.Screen
              name="UserTabs"
              component={UserTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NewBooking"
              component={NewBookingScreen}
              options={{
                headerShown: true,
                title: "New Booking",
                headerBackTitle: "Back",
              }}
            />
          </>
        ) : userRole === "manager" ? (
          // Manager Stack (Tabs + additional screens)
          <>
            <Stack.Screen name="ManagerTabs" component={ManagerTabs} />

            {/* Venue & Court Screens */}
            <Stack.Screen
              name="VenueDetails"
              component={VenueDetails}
              options={{
                headerShown: true,
                title: "Venue Details",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="AddCourt"
              component={AddCourt}
              options={{
                headerShown: true,
                title: "Add Court",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="CourtBookings"
              component={CourtBookings}
              options={{
                headerShown: true,
                title: "Court Bookings",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="AddVenue"
              component={AddVenue}
              options={{
                headerShown: true,
                title: "Add Venue",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="CreateBooking"
              component={CreateBooking}
              options={{
                headerShown: true,
                title: "Create Booking",
                headerBackTitle: "Back",
              }}
            />

            {/* NEW EVENT SCREENS */}
            <Stack.Screen
              name="EventsList"
              component={EventsList}
              options={{
                headerShown: true,
                title: "My Events",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="EventForm"
              component={EventForm}
              options={{
                headerShown: true,
                title: "Create Event",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="EventDetails"
              component={EventDetails}
              options={{
                headerShown: true,
                title: "Event Details",
                headerBackTitle: "Back",
              }}
            />

            {/* Profile Screens */}
            <Stack.Screen
              name="Profile"
              component={ManagerProfile}
              options={{
                headerShown: true,
                title: "Profile",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfile}
              options={{
                headerShown: true,
                title: "Edit Profile",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePassword}
              options={{
                headerShown: true,
                title: "Change Password",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="Language"
              component={Language}
              options={{
                headerShown: true,
                title: "Language",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="AppSettings"
              component={AppSettings}
              options={{
                headerShown: true,
                title: "Settings",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="AboutUs"
              component={AboutUs}
              options={{
                headerShown: true,
                title: "About Us",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="FAQs"
              component={FAQs}
              options={{
                headerShown: true,
                title: "FAQs",
                headerBackTitle: "Back",
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fabContainer: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    zIndex: 999,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  plusTabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plusButtonContainer: {
    top: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  plusButtonFocused: {
    backgroundColor: "#1976D2",
    transform: [{ scale: 1.05 }],
  },
});
