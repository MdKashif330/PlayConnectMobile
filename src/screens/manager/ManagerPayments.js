import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // Add this import
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import

export default function ManagerPayments() {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line

  const styles = createStyles(theme);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        // You can add any refresh logic here when payments screen is implemented
        console.log("Payments screen auto-refreshed");
      }
    }, [autoRefresh]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Payment Methods</Text>
      <Text style={styles.subText}>Manage your payment methods here.</Text>

      {/* Add a placeholder for future payment methods */}
      <TouchableOpacity
        style={styles.placeholderButton}
        onPress={() => {
          triggerVibration(); // Vibration on button press
          Alert.alert(
            "Coming Soon",
            "Payment methods will be available in the next update!",
          );
        }}
      >
        <Text style={styles.buttonText}>Coming Soon</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
      padding: 20,
    },
    text: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 10,
    },
    subText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 30,
    },
    placeholderButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
      elevation: 3,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
  });
