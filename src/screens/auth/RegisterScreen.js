import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "../../components/Icon";
import { register } from "../../services/authService";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();

  const styles = createStyles(theme);

  const handleRegister = async () => {
    triggerVibration();

    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password, role });
    setLoading(false);

    if (result.success) {
      triggerVibration();
      Alert.alert("Success", result.message, [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } else {
      Alert.alert("Registration Failed", result.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.placeholder}
          />
        </View>
      </View>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>📧</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.placeholder}
          />
        </View>
      </View>

      {/* Password Input with Eye Icon */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={theme.placeholder}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              icon={showPassword ? "eye" : "eye-off"}
              size={20}
              color={theme.placeholder}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <Text style={styles.roleLabel}>Register as:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "user" && styles.roleBtnActive]}
            onPress={() => {
              triggerVibration();
              setRole("user");
            }}
          >
            <Text
              style={
                role === "user" ? styles.roleBtnTextActive : styles.roleBtnText
              }
            >
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === "manager" && styles.roleBtnActive]}
            onPress={() => {
              triggerVibration();
              setRole("manager");
            }}
          >
            <Text
              style={
                role === "manager"
                  ? styles.roleBtnTextActive
                  : styles.roleBtnText
              }
            >
              Manager
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 40,
      color: theme.primary,
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
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    roleContainer: {
      marginBottom: 20,
    },
    roleLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 10,
    },
    roleButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 15,
    },
    roleBtn: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: "transparent",
    },
    roleBtnActive: {
      backgroundColor: theme.primary,
    },
    roleBtnText: {
      color: theme.primary,
      fontWeight: "500",
    },
    roleBtnTextActive: {
      color: "white",
      fontWeight: "500",
    },
    button: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    link: {
      marginTop: 20,
      textAlign: "center",
      color: theme.primary,
    },
  });
