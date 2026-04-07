import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "../../components/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAppSettings } from "../../hooks/useAppSettings";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";

const UserProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const navigation = useNavigation();

  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        updateUser(response.data);
        setProfileImage(response.data.profileImage);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchUserData();
      }
    }, [autoRefresh]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!autoRefresh) {
        fetchUserData();
      }
    });
    return unsubscribe;
  }, [navigation, autoRefresh]);

  const handleLogout = async () => {
    triggerVibration();
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          triggerVibration();
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    triggerVibration();
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            triggerVibration();
            try {
              const token = await AsyncStorage.getItem("token");
              await api.delete("/auth/delete-account", {
                headers: { Authorization: `Bearer ${token}` },
              });
              triggerVibration();
              Alert.alert("Account Deleted", "Your account has been deleted.");
              await logout();
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const menuItems = [
    {
      id: 1,
      title: "Edit Profile Information",
      icon: "edit",
      onPress: () => {
        triggerVibration();
        navigation.navigate("EditProfile", { onProfileUpdate: fetchUserData });
      },
    },
    {
      id: 2,
      title: "Change Password",
      icon: "settings",
      onPress: () => {
        triggerVibration();
        navigation.navigate("ChangePassword");
      },
    },
    {
      id: 3,
      title: "Language",
      icon: "language",
      onPress: () => {
        triggerVibration();
        navigation.navigate("Language");
      },
    },
    {
      id: 4,
      title: "Settings",
      icon: "settings",
      onPress: () => {
        triggerVibration();
        navigation.navigate("AppSettings");
      },
    },
    {
      id: 5,
      title: "About Us",
      icon: "info",
      onPress: () => {
        triggerVibration();
        navigation.navigate("AboutUs");
      },
    },
    {
      id: 6,
      title: "FAQs",
      icon: "help-circle",
      onPress: () => {
        triggerVibration();
        navigation.navigate("FAQs");
      },
    },
    {
      id: 7,
      title: "My Bookings",
      icon: "bookings",
      onPress: () => {
        triggerVibration();
        navigation.navigate("UserTabs", { screen: "Bookings" });
      },
    },
    {
      id: 8,
      title: "Favorites",
      icon: "favorite",
      onPress: () => {
        triggerVibration();
        navigation.navigate("UserTabs", { screen: "Favorites" });
      },
    },
    {
      id: 9,
      title: "Delete Account",
      icon: "delete",
      onPress: handleDeleteAccount,
      isDanger: true,
    },
    {
      id: 10,
      title: "Log Out",
      icon: "logout",
      onPress: handleLogout,
      isLogout: true,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => {
            triggerVibration();
            navigation.navigate("EditProfile", {
              focusImage: true,
              onProfileUpdate: fetchUserData,
            });
          }}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Icon icon="profile" size={80} color={theme.primary} />
          )}
          <View style={styles.editBadge}>
            <Icon icon="edit" size={16} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name || "User Name"}</Text>
        <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
        <Text style={styles.phone}>
          {user?.phone || "No phone number added"}
        </Text>
        <Text style={styles.role}>User Account</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              item.isLogout && styles.logoutItem,
              item.isDanger && styles.dangerItem,
            ]}
            onPress={item.onPress}
            disabled={loading && (item.isLogout || item.isDanger)}
          >
            <View style={styles.menuIcon}>
              <Icon
                icon={item.icon}
                size={22}
                color={
                  item.isLogout
                    ? theme.danger
                    : item.isDanger
                      ? theme.danger
                      : theme.primary
                }
              />
            </View>
            <Text
              style={[
                styles.menuText,
                item.isLogout && styles.logoutText,
                item.isDanger && styles.dangerText,
              ]}
            >
              {item.title}
            </Text>
            <Icon
              icon="back"
              size={20}
              color={theme.textSecondary}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>PlayConnect v1.0</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainer: {
      paddingBottom: 30,
    },
    profileHeader: {
      backgroundColor: theme.card,
      alignItems: "center",
      paddingVertical: 30,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
      borderWidth: 3,
      borderColor: theme.primary,
      position: "relative",
    },
    avatar: {
      width: 94,
      height: 94,
      borderRadius: 47,
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.primary,
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.card,
    },
    name: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 5,
    },
    email: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 3,
    },
    phone: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    role: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "500",
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 15,
    },
    menuContainer: {
      backgroundColor: theme.card,
      marginTop: 20,
      marginHorizontal: 15,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    logoutItem: {
      borderBottomWidth: 0,
    },
    dangerItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuIcon: {
      width: 30,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    logoutText: {
      color: theme.danger,
      fontWeight: "500",
    },
    dangerText: {
      color: theme.danger,
    },
    versionContainer: {
      alignItems: "center",
      marginTop: 30,
      marginBottom: 20,
    },
    versionText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background + "B3",
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default UserProfile;
