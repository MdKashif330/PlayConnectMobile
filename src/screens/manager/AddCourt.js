import api from "../../services/authService";
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
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native"; // Add useFocusEffect
import { updateCourt } from "../../services/managerService";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import

export default function AddCourt() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const { venueId, court } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: court?.name || "",
    sportType: court?.sportType || "badminton",
    length: court?.dimensions?.length?.toString() || "",
    width: court?.dimensions?.width?.toString() || "",
    pricePerSlot: court?.pricePerSlot?.toString() || "",
  });

  const isEditing = !!court;

  const sportTypes = [
    "badminton",
    "tennis",
    "football",
    "cricket",
    "basketball",
    "squash",
  ];

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Court" : "Add New Court",
    });
  }, [isEditing, navigation]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        // Refresh form data if editing
        if (court) {
          setForm({
            name: court?.name || "",
            sportType: court?.sportType || "badminton",
            length: court?.dimensions?.length?.toString() || "",
            width: court?.dimensions?.width?.toString() || "",
            pricePerSlot: court?.pricePerSlot?.toString() || "",
          });
        }
      }
    }, [autoRefresh, court]),
  );

  const handleChange = (field, value) => {
    triggerVibration(); // Vibration on input change
    setForm({ ...form, [field]: value });
  };

  const calculateArea = () => {
    const length = parseFloat(form.length) || 0;
    const width = parseFloat(form.width) || 0;
    return length * width;
  };

  const handleSubmit = async () => {
    triggerVibration(); // Vibration on submit

    const { name, sportType, length, width, pricePerSlot } = form;

    if (!name || !length || !width || !pricePerSlot) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const courtData = {
        venueId,
        name,
        sportType,
        dimensions: {
          length: parseFloat(length),
          width: parseFloat(width),
          totalArea: calculateArea(),
        },
        pricePerSlot: parseFloat(pricePerSlot),
      };

      let response;
      if (isEditing) {
        response = await api.put(`/manager/courts/${court._id}`, courtData);
      } else {
        response = await api.post("/manager/courts", courtData);
      }

      setLoading(false);
      triggerVibration(); // Success vibration
      Alert.alert(
        "Success",
        isEditing ? "Court updated successfully" : "Court added successfully",
        [
          {
            text: "OK",
            onPress: () => {
              triggerVibration(); // Vibration on OK press
              if (route.params?.onCourtAdded) {
                route.params.onCourtAdded();
              }
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      setLoading(false);
      console.error("Court error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "add"} court`,
      );
    }
  };

  const totalArea = calculateArea();
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
          {isEditing ? "Edit Court" : "Add New Court"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Court Information</Text>

        {/* Court Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Court Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Badminton Court 1"
            placeholderTextColor={theme.placeholder}
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>

        {/* Sport Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sport Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.sportType}
              onValueChange={(value) => {
                triggerVibration(); // Vibration on picker change
                handleChange("sportType", value);
              }}
              style={styles.picker}
              dropdownIconColor={theme.textSecondary}
            >
              {sportTypes.map((sport) => (
                <Picker.Item
                  key={sport}
                  label={sport.charAt(0).toUpperCase() + sport.slice(1)}
                  value={sport}
                  color={theme.text}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Dimensions */}
        <Text style={styles.label}>Dimensions (in feet) *</Text>
        <View style={styles.dimensionsRow}>
          <View style={styles.dimensionInput}>
            <Text style={styles.dimensionLabel}>Length</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={form.length}
              onChangeText={(text) => handleChange("length", text)}
            />
          </View>
          <View style={styles.dimensionInput}>
            <Text style={styles.dimensionLabel}>Width</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={form.width}
              onChangeText={(text) => handleChange("width", text)}
            />
          </View>
          <View style={styles.dimensionInput}>
            <Text style={styles.dimensionLabel}>Total Area</Text>
            <Text style={styles.areaDisplay}>{totalArea} sq ft</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price Per Slot (PKR) *</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>Rs</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="1500"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={form.pricePerSlot}
              onChangeText={(text) => handleChange("pricePerSlot", text)}
            />
          </View>
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
                name={isEditing ? "save" : "add-circle"}
                size={20}
                color="white"
              />
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Court" : "Add Court"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.noteCard}>
        <Icon name="info" size={20} color={theme.primary} />
        <Text style={styles.noteText}>
          {isEditing
            ? "Update court information as needed."
            : "Court will be immediately available for bookings after creation."}
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
      fontSize: 20,
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
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.card,
      color: theme.text,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.card,
    },
    picker: {
      height: 50,
      color: theme.text,
    },
    dimensionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    dimensionInput: {
      flex: 1,
      marginHorizontal: 5,
    },
    dimensionLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 5,
    },
    areaDisplay: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.primaryLight,
      color: theme.primary,
      textAlign: "center",
      fontWeight: "600",
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    currencySymbol: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.textSecondary,
      marginRight: 10,
    },
    priceInput: {
      flex: 1,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
      marginTop: 10,
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
