import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createBooking } from "../../services/bookingService";

export default function NewBookingScreen({ navigation }) {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Available time slots (example)
  const timeSlots = [
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
  ];

  // In real app, fetch courts from backend
  useEffect(() => {
    // TODO: Replace with actual API call
    const mockCourts = [
      { _id: "1", name: "Badminton Court 1", pricePerSlot: 1500 },
      { _id: "2", name: "Tennis Court 1", pricePerSlot: 2000 },
    ];
    setCourts(mockCourts);
  }, []);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleCreateBooking = async () => {
    if (!selectedCourt || !selectedSlot) {
      Alert.alert("Error", "Please select court and time slot");
      return;
    }

    setLoading(true);
    const dateStr = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const result = await createBooking({
      courtId: selectedCourt,
      date: dateStr,
      slot: selectedSlot,
    });

    setLoading(false);
    if (result.success) {
      Alert.alert("Success", result.message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Booking Failed", result.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Booking</Text>

      {/* Court Selection */}
      <Text style={styles.label}>Select Court</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCourt}
          onValueChange={(itemValue) => setSelectedCourt(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select a court" value="" />
          {courts.map((court) => (
            <Picker.Item
              key={court._id}
              label={`${court.name} - Rs ${court.pricePerSlot}`}
              value={court._id}
            />
          ))}
        </Picker>
      </View>

      {/* Date Selection */}
      <Text style={styles.label}>Select Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Slot Selection */}
      <Text style={styles.label}>Select Time Slot</Text>
      <View style={styles.slotsContainer}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotButton,
              selectedSlot === slot && styles.slotButtonSelected,
            ]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[
                styles.slotText,
                selectedSlot === slot && styles.slotTextSelected,
              ]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Booking Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.createButtonText}>Create Booking</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  slotButton: {
    width: "48%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    alignItems: "center",
  },
  slotButtonSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  slotText: {
    fontSize: 14,
    color: "#333",
  },
  slotTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
