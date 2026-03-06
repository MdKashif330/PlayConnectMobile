import React, { useState, useEffect, useCallback } from "react";
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
} from "@react-navigation/native";
import api from "../../services/authService";
import { createVenue, updateVenue } from "../../services/managerService";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import LocationPicker from "../../components/LocationPicker";

export default function AddVenue() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const { venue } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [form, setForm] = useState({
    name: venue?.name || "",
    description: venue?.description || "",
    address: venue?.address || "", // Address field - shown in venue list
    selectedLocation: venue?.selectedLocation || "", // Location name from map
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

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        if (venue) {
          setForm({
            name: venue?.name || "",
            description: venue?.description || "",
            address: venue?.address || "",
            selectedLocation: venue?.selectedLocation || "",
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
    triggerVibration();
    setForm({ ...form, [field]: value });
  };

  const toggleFacility = (facility) => {
    triggerVibration();
    setForm({
      ...form,
      facilities: {
        ...form.facilities,
        [facility]: !form.facilities[facility],
      },
    });
  };

  const handleLocationSelect = (location) => {
    triggerVibration();
    setForm({
      ...form,
      selectedLocation: location.address, // Show the selected location name
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      // Do NOT update address field - keep it separate
    });
  };

  const handleSubmit = async () => {
    triggerVibration();

    const {
      name,
      description,
      address,
      selectedLocation,
      latitude,
      longitude,
    } = form;

    if (!name || !address || !latitude || !longitude) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

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
        description: description || "",
        address: address, // Address field at top level
        selectedLocation: selectedLocation, // Store the selected location name
        location: {
          address: address,
          latitude: lat,
          longitude: lng,
        },
        facilities: form.facilities,
      };

      console.log("Sending venue data:", venueData);
      let result;
      if (isEditing) {
        result = await updateVenue(venue._id, venueData);
      } else {
        result = await createVenue(venueData);
      }

      if (result.success) {
        setLoading(false);
        triggerVibration();
        Alert.alert(
          "Success",
          isEditing
            ? "Venue updated successfully"
            : "Venue created successfully",
          [
            {
              text: "OK",
              onPress: () => {
                triggerVibration();
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
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              triggerVibration();
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

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your venue (facilities, environment, etc.)"
              placeholderTextColor={theme.placeholder}
              value={form.description}
              onChangeText={(text) => handleChange("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Address Field - For display in venue list */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.addressContainer}>
              <Icon
                name="location-on"
                size={20}
                color={theme.primary}
                style={styles.addressIcon}
              />
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={form.address}
                onChangeText={(text) => handleChange("address", text)}
                placeholder="Enter venue address (shown in venue list)"
                placeholderTextColor={theme.placeholder}
                multiline
              />
            </View>
          </View>

          {/* Location Picker - Shows selected place from map */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Map Location</Text>

            {/* Selected location display */}
            <View style={styles.selectedLocationContainer}>
              <Icon name="place" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, styles.selectedLocationInput]}
                value={form.selectedLocation}
                placeholder="No location selected from map"
                placeholderTextColor={theme.placeholder}
                editable={false}
                multiline
              />
            </View>

            {/* Map picker button */}
            <TouchableOpacity
              style={styles.locationPickerButton}
              onPress={() => {
                triggerVibration();
                setShowLocationPicker(true);
              }}
            >
              <Icon name="map" size={20} color={theme.primary} />
              <Text style={styles.locationPickerText}>
                {form.selectedLocation
                  ? "Change location on map"
                  : "Pick location on map"}
              </Text>
              <Icon
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Hidden coordinates fields */}
            <View style={styles.hiddenFields}>
              <TextInput
                value={form.latitude}
                onChangeText={(text) => handleChange("latitude", text)}
                style={{ display: "none" }}
              />
              <TextInput
                value={form.longitude}
                onChangeText={(text) => handleChange("longitude", text)}
                style={{ display: "none" }}
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

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => {
          triggerVibration();
          setShowLocationPicker(false);
        }}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          form.latitude && form.longitude
            ? {
                latitude: parseFloat(form.latitude),
                longitude: parseFloat(form.longitude),
                address: form.selectedLocation,
              }
            : null
        }
      />
    </>
  );
}

// Updated styles
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
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    addressContainer: {
      position: "relative",
    },
    addressIcon: {
      position: "absolute",
      left: 12,
      top: 12,
      zIndex: 1,
    },
    addressInput: {
      paddingLeft: 40,
    },
    selectedLocationContainer: {
      position: "relative",
      marginBottom: 10,
    },
    selectedLocationInput: {
      paddingLeft: 40,
      backgroundColor: theme.background + "80", // Slightly transparent to show it's read-only
    },
    locationPickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.primaryLight,
      marginTop: 5,
    },
    locationPickerText: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      color: theme.primary,
      fontWeight: "500",
      textAlign: "center",
    },
    hiddenFields: {
      display: "none",
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
