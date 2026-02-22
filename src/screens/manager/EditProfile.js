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
  Image,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Add useFocusEffect
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export default function EditProfile({ route }) {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const { focusImage, onProfileUpdate } = route.params || {};

  // Create styles FIRST
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        // Refresh form data with latest user info
        setForm({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
        });
        setProfileImage(user?.profileImage || null);
      }
    }, [autoRefresh, user]),
  );

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to change your profile picture.",
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (focusImage) {
      handleImagePicker();
    }
  }, [focusImage]);

  const handleImagePicker = async () => {
    triggerVibration(); // Vibration on image picker
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant permissions.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);

        const formData = new FormData();
        formData.append("image", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        });

        try {
          const token = await AsyncStorage.getItem("token");
          const response = await api.post(
            "/auth/upload-profile-image",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

          if (response.data.imageUrl) {
            setProfileImage(response.data.imageUrl);
            const updatedUser = {
              ...user,
              profileImage: response.data.imageUrl,
            };
            updateUser(updatedUser);
            triggerVibration(); // Success vibration
            Alert.alert("Success", "Profile picture updated");
          }
        } catch (error) {
          console.error("Upload error:", error);
          Alert.alert("Error", "Failed to upload image");
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
      setImageLoading(false);
    }
  };

  const handleChange = (field, value) => {
    triggerVibration(); // Vibration on input change
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    triggerVibration(); // Vibration on submit

    if (!form.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!form.email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.put(
        "/auth/update-profile",
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data) {
        updateUser(response.data.user || response.data);
        setLoading(false);
        triggerVibration(); // Success vibration
        Alert.alert("Success", "Profile updated successfully", [
          {
            text: "OK",
            onPress: () => {
              triggerVibration(); // Vibration on OK press
              if (onProfileUpdate) onProfileUpdate();
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      setLoading(false);
      console.error("Save error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile",
      );
    }
  };

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Icon icon="save" size={24} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Image Section */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePicker}
          disabled={imageLoading}
        >
          {imageLoading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon icon="profile" size={60} color={theme.primary} />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Icon icon="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.imageHint}>Tap to change profile picture</Text>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Enter your full name"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Enter your email"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Enter your phone number"
              placeholderTextColor={theme.placeholder}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Text style={styles.note}>
          Note: Your email is used for login and notifications.
        </Text>
      </View>
    </ScrollView>
  );
}

// Move styles to a function that accepts theme
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
    imageContainer: {
      alignItems: "center",
      marginBottom: 10,
      position: "relative",
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: theme.primary,
    },
    imagePlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: theme.primary,
    },
    cameraIcon: {
      position: "absolute",
      bottom: 0,
      right: "35%",
      backgroundColor: theme.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "white",
    },
    imageHint: {
      textAlign: "center",
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 30,
    },
    form: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
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
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.card,
      color: theme.text,
    },
    note: {
      marginTop: 20,
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
    },
  });
