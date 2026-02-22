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
  Switch,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native"; // Add useFocusEffect
import api from "../../services/authService";
import { createVenue, updateVenue } from "../../services/managerService";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import

export default function AddVenue() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const { venue } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: venue?.name || "",
    address: venue?.location?.address || "",
    latitude: venue?.location?.latitude?.toString() || "",
    longitude: venue?.location?.longitude?.toString() || "",
    facilities: {
      lights: venue?.facilities?.lights || false,
      parking: venue?.facilities?.parking || false,
      cafeteria: venue?.facilities?.cafeteria || false,
      coaching: venue?.facilities?.coaching || false,
      sportsGoods: venue?.facilities?.sportsGoods || false,
    },
  });

  const isEditing = !!venue;

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Venue" : "Add New Venue",
    });
  }, [isEditing, navigation]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        // Refresh form data if editing
        if (venue) {
          setForm({
            name: venue?.name || "",
            address: venue?.location?.address || "",
            latitude: venue?.location?.latitude?.toString() || "",
            longitude: venue?.location?.longitude?.toString() || "",
            facilities: {
              lights: venue?.facilities?.lights || false,
              parking: venue?.facilities?.parking || false,
              cafeteria: venue?.facilities?.cafeteria || false,
              coaching: venue?.facilities?.coaching || false,
              sportsGoods: venue?.facilities?.sportsGoods || false,
            },
          });
        }
      }
    }, [autoRefresh, venue]),
  );

  const handleChange = (field, value) => {
    triggerVibration(); // Vibration on input change
    setForm({ ...form, [field]: value });
  };

  const toggleFacility = (facility) => {
    triggerVibration(); // Vibration on facility toggle
    setForm({
      ...form,
      facilities: {
        ...form.facilities,
        [facility]: !form.facilities[facility],
      },
    });
  };

  const handleSubmit = async () => {
    triggerVibration(); // Vibration on submit

    const { name, address, latitude, longitude } = form;

    if (!name || !address || !latitude || !longitude) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Error", "Invalid latitude/longitude");
      return;
    }

    setLoading(true);
    try {
      const venueData = {
        name,
        location: {
          address,
          latitude: lat,
          longitude: lng,
        },
        facilities: form.facilities,
      };

      let result;
      if (isEditing) {
        // Update existing venue
        result = await updateVenue(venue._id, venueData);
      } else {
        // Create new venue
        result = await createVenue(venueData);
      }

      if (result.success) {
        setLoading(false);
        triggerVibration(); // Success vibration
        Alert.alert(
          "Success",
          isEditing
            ? "Venue updated successfully"
            : "Venue created successfully",
          [
            {
              text: "OK",
              onPress: () => {
                triggerVibration(); // Vibration on OK press
                if (route.params?.onVenueUpdated) {
                  route.params.onVenueUpdated();
                }
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      setLoading(false);
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "create"} venue`,
      );
    } finally {
      setLoading(false);
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
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Venue" : "Add New Venue"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Venue Information</Text>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Venue Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., PlayConnect Arena"
            placeholderTextColor={theme.placeholder}
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Address <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Full address"
            placeholderTextColor={theme.placeholder}
            value={form.address}
            onChangeText={(text) => handleChange("address", text)}
          />
        </View>

        {/* Coordinates */}
        <Text style={styles.label}>
          Coordinates <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateInput}>
            <Text style={styles.coordinateLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              placeholder="31.4697"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={form.latitude}
              onChangeText={(text) => handleChange("latitude", text)}
            />
          </View>
          <View style={styles.coordinateInput}>
            <Text style={styles.coordinateLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              placeholder="74.2728"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={form.longitude}
              onChangeText={(text) => handleChange("longitude", text)}
            />
          </View>
        </View>

        {/* Facilities */}
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.facilitiesContainer}>
          {Object.keys(form.facilities).map((facility) => (
            <View key={facility} style={styles.facilityRow}>
              <Text style={styles.facilityText}>
                {facility.charAt(0).toUpperCase() + facility.slice(1)}
              </Text>
              <Switch
                value={form.facilities[facility]}
                onValueChange={() => toggleFacility(facility)}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={form.facilities[facility] ? "#fff" : theme.card}
              />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon
                name={isEditing ? "save" : "add-location"}
                size={20}
                color="white"
              />
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Venue" : "Create Venue"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.noteCard}>
        <Icon name="info" size={20} color={theme.primary} />
        <Text style={styles.noteText}>
          {isEditing
            ? "Update venue information as needed."
            : "Venue will be immediately available for adding courts and accepting bookings."}
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
    formCard: {
      backgroundColor: theme.card,
      margin: 15,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
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
    required: {
      color: theme.danger,
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
    coordinatesRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    coordinateInput: {
      flex: 1,
      marginHorizontal: 5,
    },
    coordinateLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 5,
    },
    facilitiesContainer: {
      marginBottom: 30,
    },
    facilityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    facilityText: {
      fontSize: 16,
      color: theme.text,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
    },
    submitButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
      marginLeft: 10,
    },
    noteCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      marginHorizontal: 15,
      marginBottom: 30,
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
