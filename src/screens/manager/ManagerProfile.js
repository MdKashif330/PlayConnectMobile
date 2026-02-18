import React, { useState, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";

const ManagerProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  // Fetch updated user data
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
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
            try {
              const token = await AsyncStorage.getItem("token");
              await api.delete("/auth/delete-account", {
                headers: { Authorization: `Bearer ${token}` },
              });
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
      onPress: () =>
        navigation.navigate("EditProfile", { onProfileUpdate: fetchUserData }),
    },
    {
      id: 2,
      title: "Change Password",
      icon: "settings",
      onPress: () => navigation.navigate("ChangePassword"),
    },
    {
      id: 3,
      title: "Language",
      icon: "language",
      onPress: () => navigation.navigate("Language"),
    },
    {
      id: 4,
      title: "Settings",
      icon: "settings",
      onPress: () => navigation.navigate("AppSettings"),
    },
    {
      id: 5,
      title: "About Us",
      icon: "info",
      onPress: () => navigation.navigate("AboutUs"),
    },
    {
      id: 6,
      title: "FAQs",
      icon: "help-circle",
      onPress: () => navigation.navigate("FAQs"),
    },
    {
      id: 7,
      title: "Delete Account",
      icon: "delete",
      onPress: handleDeleteAccount,
      isDanger: true,
    },
    {
      id: 8,
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
          onPress={() =>
            navigation.navigate("EditProfile", {
              focusImage: true,
              onProfileUpdate: fetchUserData,
            })
          }
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Icon icon="profile" size={80} color="#2196F3" />
          )}
          <View style={styles.editBadge}>
            <Icon icon="edit" size={16} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name || "Manager Name"}</Text>
        <Text style={styles.email}>{user?.email || "manager@example.com"}</Text>
        <Text style={styles.phone}>
          {user?.phone || "No phone number added"}
        </Text>
        <Text style={styles.role}>Manager Account</Text>
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
                    ? "#FF3B30"
                    : item.isDanger
                      ? "#FF3B30"
                      : "#2196F3"
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
              color="#999"
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
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  profileHeader: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#2196F3",
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
    backgroundColor: "#2196F3",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 3,
  },
  phone: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  role: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  menuContainer: {
    backgroundColor: "white",
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
    borderBottomColor: "#f0f0f0",
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  dangerItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    width: 30,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  logoutText: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  dangerText: {
    color: "#FF3B30",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ManagerProfile;
