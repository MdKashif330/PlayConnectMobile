import api from "../../services/authService";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { updateCourt } from "../../services/managerService"; // You'll need to create this

export default function AddCourt() {
  const route = useRoute();
  const navigation = useNavigation();
  const { venueId, court } = route.params || {}; // If editing, court will be passed

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
    // Update header title
    navigation.setOptions({
      title: isEditing ? "Edit Court" : "Add New Court",
    });
  }, [isEditing]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const calculateArea = () => {
    const length = parseFloat(form.length) || 0;
    const width = parseFloat(form.width) || 0;
    return length * width;
  };

  const handleSubmit = async () => {
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
        // Update existing court
        response = await api.put(`/manager/courts/${court._id}`, courtData);
      } else {
        // Create new court
        response = await api.post("/manager/courts", courtData);
      }

      setLoading(false);
      Alert.alert(
        "Success",
        isEditing ? "Court updated successfully" : "Court added successfully",
        [
          {
            text: "OK",
            onPress: () => {
              // Pass refresh callback via navigation params
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
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
              onValueChange={(value) => handleChange("sportType", value)}
              style={styles.picker}
            >
              {sportTypes.map((sport) => (
                <Picker.Item
                  key={sport}
                  label={sport.charAt(0).toUpperCase() + sport.slice(1)}
                  value={sport}
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
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.noteText}>
          {isEditing
            ? "Update court information as needed."
            : "Court will be immediately available for bookings after creation."}
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles remain exactly the same as your original
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
    fontSize: 20,
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  picker: {
    height: 50,
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
    color: "#666",
    marginBottom: 5,
  },
  areaDisplay: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f0f8ff",
    color: "#2196F3",
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
    color: "#555",
    marginRight: 10,
  },
  priceInput: {
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
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
