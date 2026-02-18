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
  Switch,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../services/authService";
import { createVenue, updateVenue } from "../../services/managerService";

export default function AddVenue() {
  const navigation = useNavigation();
  const route = useRoute();
  const { venue } = route.params || {}; // If editing, venue will be passed

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
    // Update header title
    navigation.setOptions({
      title: isEditing ? "Edit Venue" : "Add New Venue",
    });
  }, [isEditing]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const toggleFacility = (facility) => {
    setForm({
      ...form,
      facilities: {
        ...form.facilities,
        [facility]: !form.facilities[facility],
      },
    });
  };

  const handleSubmit = async () => {
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
        Alert.alert(
          "Success",
          isEditing
            ? "Venue updated successfully"
            : "Venue created successfully",
          [
            {
              text: "OK",
              onPress: () => {
                // Call the refresh callback if provided
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
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "create"} venue`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
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
                trackColor={{ false: "#ddd", true: "#2196F3" }}
                thumbColor={form.facilities[facility] ? "#fff" : "#f4f3f4"}
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
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.noteText}>
          {isEditing
            ? "Update venue information as needed."
            : "Venue will be immediately available for adding courts and accepting bookings."}
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles remain the same
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
  formCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
  required: {
    color: "#f44336",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
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
    color: "#666",
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
    borderBottomColor: "#eee",
  },
  facilityText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
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
    backgroundColor: "#E3F2FD",
    marginHorizontal: 15,
    marginBottom: 30,
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
