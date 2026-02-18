import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProfile() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // AuthContext will update isLoggedIn, AppNavigator will auto-switch to Login
    } catch (error) {
      Alert.alert("Logout Failed", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Profile</Text>
      <Text style={styles.subText}>Your profile details will appear here.</Text>
      <View style={styles.logoutContainer}>
        <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  logoutContainer: {
    marginTop: 20,
    width: "60%",
  },
});
