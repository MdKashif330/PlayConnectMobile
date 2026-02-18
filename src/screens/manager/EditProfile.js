import React, { useState, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export default function EditProfile({ route }) {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { focusImage, onProfileUpdate } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

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

  const handleSave = async () => {
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

        Alert.alert("Success", "Profile updated successfully", [
          {
            text: "OK",
            onPress: () => {
              if (onProfileUpdate) onProfileUpdate();
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile",
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <Icon icon="save" size={24} color="#2196F3" />
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
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon icon="profile" size={60} color="#2196F3" />
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
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              placeholder="Enter your phone number"
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
    borderColor: "#2196F3",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2196F3",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#2196F3",
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
    color: "#666",
    fontSize: 14,
    marginBottom: 30,
  },
  form: {
    backgroundColor: "white",
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
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
  },
});
