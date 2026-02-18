import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";

export default function ChangePassword() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return regex.test(password);
  };

  const handleChangePassword = async () => {
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

      Alert.alert("Success", "Password changed successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color="#333" />
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
                onChangeText={(text) =>
                  setForm({ ...form, currentPassword: text })
                }
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon
                  icon={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
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
                onChangeText={(text) => setForm({ ...form, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Icon
                  icon={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
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
                onChangeText={(text) =>
                  setForm({ ...form, confirmPassword: text })
                }
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
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
                color={form.newPassword.length >= 8 ? "#4CAF50" : "#999"}
              />
              <Text style={styles.requirementText}>
                Be at least 8 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={/[A-Z]/.test(form.newPassword) ? "#4CAF50" : "#999"}
              />
              <Text style={styles.requirementText}>
                Contain at least 1 uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={/[a-z]/.test(form.newPassword) ? "#4CAF50" : "#999"}
              />
              <Text style={styles.requirementText}>
                Contain at least 1 lowercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon
                icon="checkmark-circle"
                size={16}
                color={/\d/.test(form.newPassword) ? "#4CAF50" : "#999"}
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

        <View style={styles.noteCard}>
          <Icon icon="info" size={20} color="#2196F3" />
          <Text style={styles.noteText}>
            After changing your password, you'll need to use the new password
            next time you log in.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    padding: 20,
  },
  formCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  requirementsContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: "#2196F3",
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
    backgroundColor: "#E3F2FD",
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    color: "#1565C0",
    fontSize: 14,
  },
});
