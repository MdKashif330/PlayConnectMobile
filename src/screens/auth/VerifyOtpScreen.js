import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  completeRegistration,
  resendRegistrationOtp,
} from "../../services/authService";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";

export default function VerifyOtpScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const styles = createStyles(theme);

  const handleCompleteRegistration = async () => {
    triggerVibration();

    if (!otp || otp.trim().length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP from your email");
      return;
    }

    setLoading(true);
    const result = await completeRegistration({
      email,
      otp: otp.trim(),
    });
    setLoading(false);

    if (result.success) {
      triggerVibration();
      Alert.alert("Success", result.message, [
        {
          text: "Login",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } else {
      Alert.alert("Wrong OTP", result.message);
    }
  };

  const handleResendOtp = async () => {
    triggerVibration();
    setResending(true);
    const result = await resendRegistrationOtp(email);
    setResending(false);

    Alert.alert(
      result.success ? "OTP Sent" : "Resend Failed",
      result.message,
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit OTP sent to{"\n"}
        <Text style={styles.email}>{email}</Text>
      </Text>
      <Text style={styles.hint}>
        If you don't see the email in your inbox, please check your spam folder.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>OTP</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={theme.placeholder}
            textAlign="center"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCompleteRegistration}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Complete Registration</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
        <Text style={styles.link}>
          {resending ? "Sending OTP..." : "Resend OTP"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 12,
      color: theme.primary,
    },
    subtitle: {
      fontSize: 15,
      textAlign: "center",
      color: theme.textSecondary,
      marginBottom: 32,
      lineHeight: 22,
    },
    email: {
      color: theme.text,
      fontWeight: "600",
    },
    hint: {
      fontSize: 13,
      textAlign: "center",
      color: theme.textSecondary,
      marginBottom: 28,
      marginTop: -16,
      lineHeight: 18,
      paddingHorizontal: 8,
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
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
    },
    input: {
      padding: 16,
      fontSize: 24,
      letterSpacing: 8,
      color: theme.text,
      fontWeight: "600",
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
