import React, { useState, useEffect, useCallback } from "react"; // Add useCallback
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Add useFocusEffect
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import

export default function ChangePassword() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        // Reset form when screen focuses with auto-refresh
        setForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    }, [autoRefresh]),
  );

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return regex.test(password);
  };

  const handleChangePassword = async () => {
    triggerVibration(); // Vibration on submit

    const { currentPassword, newPassword, confirmPassword } = form;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number",
      );
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setLoading(false);
      triggerVibration(); // Success vibration
      Alert.alert("Success", "Password changed successfully", [
        {
          text: "OK",
          onPress: () => {
            triggerVibration(); // Vibration on OK press
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password",
      );
    }
  };

  // Create styles with theme
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerVibration(); // Vibration on back
            navigation.goBack();
          }}
        >
          <Icon icon="back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Update Your Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password that you don't use elsewhere
          </Text>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={form.currentPassword}
                onChangeText={(text) => {
                  triggerVibration(); // Vibration on input change
                  setForm({ ...form, currentPassword: text });
                }}
                placeholder="Enter current password"
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  triggerVibration(); // Vibration on eye icon press
                  setShowCurrentPassword(!showCurrentPassword);
                }}
              >
                <Icon
                  icon={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={form.newPassword}
                onChangeText={(text) => {
                  triggerVibration(); // Vibration on input change
                  setForm({ ...form, newPassword: text });
                }}
                placeholder="Enter new password"
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  triggerVibration(); // Vibration on eye icon press
                  setShowNewPassword(!showNewPassword);
                }}
              >
                <Icon
                  icon={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={form.confirmPassword}
                onChangeText={(text) => {
                  triggerVibration(); // Vibration on input change
                  setForm({ ...form, confirmPassword: text });
                }}
                placeholder="Confirm new password"
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  triggerVibration(); // Vibration on eye icon press
                  setShowConfirmPassword(!showConfirmPassword);
                }}
              >
                <Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must:</Text>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={
                  form.newPassword.length >= 8
                    ? theme.success
                    : theme.textSecondary
                }
              />
              <Text style={styles.requirementText}>
                Be at least 8 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={
                  /[A-Z]/.test(form.newPassword)
                    ? theme.success
                    : theme.textSecondary
                }
              />
              <Text style={styles.requirementText}>
                Contain at least 1 uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={
                  /[a-z]/.test(form.newPassword)
                    ? theme.success
                    : theme.textSecondary
                }
              />
              <Text style={styles.requirementText}>
                Contain at least 1 lowercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={
                  /\d/.test(form.newPassword)
                    ? theme.success
                    : theme.textSecondary
                }
              />
              <Text style={styles.requirementText}>
                Contain at least 1 number
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Note Card */}
        <View style={styles.noteCard}>
          <Icon icon="info" size={20} color={theme.primary} />
          <Text style={styles.noteText}>
            After changing your password, you'll need to use the new password
            next time you log in.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Styles remain the same
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    content: {
      padding: 20,
    },
    formCard: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.card,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    eyeIcon: {
      padding: 12,
    },
    requirementsContainer: {
      backgroundColor: theme.primaryLight,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 10,
    },
    requirementItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    requirementText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: 8,
    },
    submitButton: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    submitButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    noteCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      marginTop: 20,
      padding: 15,
      borderRadius: 8,
    },
    noteText: {
      flex: 1,
      marginLeft: 10,
      color: theme.primary,
      fontSize: 14,
    },
  });
