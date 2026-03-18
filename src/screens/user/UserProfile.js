import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function UserProfile() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Small delay to ensure auth state is loaded
    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      Alert.alert("Success", "Logged out successfully");
    } catch (error) {
      Alert.alert("Logout Failed", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClearToken = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      Alert.alert("Success", "Token cleared. Please restart the app.");
    } catch (error) {
      Alert.alert("Error", "Failed to clear token");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // User is logged in - show profile info
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || "User"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || "user"}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>User ID</Text>
        <Text style={styles.infoValue}>{user?.id || user?._id}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() =>
            Alert.alert("Coming Soon", "Edit profile coming soon!")
          }
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearTokenLink}
          onPress={handleClearToken}
          disabled={loading}
        >
          <Text style={styles.clearTokenLinkText}>Clear Token (Debug)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  editButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clearTokenLink: {
    marginTop: 10,
    alignItems: "center",
  },
  clearTokenLinkText: {
    color: "#757575",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
