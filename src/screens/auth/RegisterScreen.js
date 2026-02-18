import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { register } from "../../services/authService";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    const result = await register({ name, email, password, role });
    setLoading(false);
    if (result.success) {
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
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.roleContainer}>
        <Text style={styles.roleLabel}>Register as:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "user" && styles.roleBtnActive]}
            onPress={() => setRole("user")}
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
            onPress={() => setRole("manager")}
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
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Registering..." : "Register"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#2196F3",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  roleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "#2196F3",
  },
  roleBtnText: {
    color: "#2196F3",
  },
  roleBtnTextActive: {
    color: "white",
  },
  button: {
    backgroundColor: "#2196F3",
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
    color: "#4CAF50",
  },
});
