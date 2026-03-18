import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import Icon from "../components/Icon";

import HomeScreen from "../screens/user/HomeScreen";
import BookingsScreen from "../screens/user/BookingsScreen";
import ChatbotScreen from "../screens/user/ChatbotScreen";
import FavoritesScreen from "../screens/user/FavoritesScreen";

const Tab = createBottomTabNavigator();

const UserBottomTabNavigator = () => {
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
    transform: [{ scale: fabAnimation }],
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconKey;
            if (route.name === "Home") iconKey = "home";
            else if (route.name === "Bookings") iconKey = "bookings";
            else if (route.name === "Chatbot") iconKey = "chat";
            else if (route.name === "Favorites") iconKey = "favorite";
            return <Icon icon={iconKey} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2E7D32",
          tabBarInactiveTintColor: "gray",
          headerShown: false, // CHANGED: false to hide automatic header
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          listeners={{ focus: () => setCurrentTab("Home") }}
        />
        <Tab.Screen
          name="Bookings"
          component={BookingsScreen}
          listeners={{ focus: () => setCurrentTab("Bookings") }}
        />
        <Tab.Screen
          name="Chatbot"
          component={ChatbotScreen}
          listeners={{ focus: () => setCurrentTab("Chatbot") }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          listeners={{ focus: () => setCurrentTab("Favorites") }}
        />
      </Tab.Navigator>

      {/* FAB for Home and Bookings tabs */}
      {(currentTab === "Home" || currentTab === "Bookings") && (
        <Animated.View style={[styles.fabContainer, animatedStyle]}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: "#2E7D32" }]}
            onPress={() => navigation.navigate("CreateBooking")}
            activeOpacity={0.8}
          >
            <Icon icon="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

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
    bottom: 80,
    alignSelf: "center",
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default UserBottomTabNavigator;
