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
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { api } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EventForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const { event, venueId: passedVenueId } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(passedVenueId || "");
  const [courts, setCourts] = useState([]);
  const [selectedCourts, setSelectedCourts] = useState([]);

  // Date and time states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Set minimum date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState(
    event?.startDate ? new Date(event.startDate) : new Date(),
  );
  const [startTime, setStartTime] = useState(
    event?.startDate ? new Date(event.startDate) : new Date(),
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? new Date(event.endDate) : new Date(),
  );
  const [endTime, setEndTime] = useState(
    event?.endDate ? new Date(event.endDate) : new Date(),
  );

  const [form, setForm] = useState({
    name: event?.name || "",
    description: event?.description || "",
    prize: event?.prize || "",
    entryFee: event?.entryFee?.toString() || "0",
    maxParticipants: event?.maxParticipants?.toString() || "0",
  });

  const isEditing = !!event;

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue);
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (event?.courts) {
      setSelectedCourts(event.courts.map((c) => c._id));
    }
  }, [event]);

  const fetchVenues = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get("/manager/venues", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVenues(response.data || []);
      if (!selectedVenue && response.data.length > 0) {
        setSelectedVenue(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      Alert.alert("Error", "Failed to load venues");
    }
  };

  const fetchCourts = async (venueId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get(`/courts/venue/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourts(response.data || []);
    } catch (error) {
      console.error("Error fetching courts:", error);
    }
  };

  const toggleCourt = (courtId) => {
    triggerVibration();
    if (selectedCourts.includes(courtId)) {
      setSelectedCourts(selectedCourts.filter((id) => id !== courtId));
    } else {
      setSelectedCourts([...selectedCourts, courtId]);
    }
  };

  // Handle start date change
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      // Check if selected date is in the past
      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);

      if (selectedDay < today) {
        Alert.alert("Invalid Date", "Start date cannot be in the past");
        return;
      }
      setStartDate(selectedDate);
    }
  };

  // Handle start time change
  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  // Handle end date change
  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Check if selected date is in the past
      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);

      if (selectedDay < today) {
        Alert.alert("Invalid Date", "End date cannot be in the past");
        return;
      }
      setEndDate(selectedDate);
    }
  };

  // Handle end time change
  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  // Combine date and time
  const combineDateAndTime = (date, time) => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes());
    return combined;
  };

  const handleSubmit = async () => {
    triggerVibration();

    if (!form.name || !form.description) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (selectedCourts.length === 0) {
      Alert.alert("Error", "Please select at least one court");
      return;
    }

    const startDateTime = combineDateAndTime(startDate, startTime);
    const endDateTime = combineDateAndTime(endDate, endTime);

    // Check if start date is in the past
    if (startDateTime < new Date()) {
      Alert.alert("Error", "Start date/time cannot be in the past");
      return;
    }

    // Check if end date/time is after start date/time
    if (endDateTime <= startDateTime) {
      Alert.alert("Error", "End date/time must be after start date/time");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const eventData = {
        name: form.name,
        description: form.description,
        prize: form.prize,
        entryFee: parseFloat(form.entryFee) || 0,
        maxParticipants: parseInt(form.maxParticipants) || 0,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        courtIds: selectedCourts,
      };

      console.log("Sending event data:", eventData);

      let response;
      if (isEditing) {
        response = await api.put(`/events/${event._id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await api.post("/events", eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Alert.alert(
        "Success",
        isEditing ? "Event updated successfully" : "Event created successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("Event error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save event",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Event" : "Create Event"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formCard}>
        {/* Venue Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Venue *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVenue}
              onValueChange={(value) => {
                triggerVibration();
                setSelectedVenue(value);
              }}
              style={styles.picker}
            >
              {venues.map((venue) => (
                <Picker.Item
                  key={venue._id}
                  label={venue.name}
                  value={venue._id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Court Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Courts *</Text>
          <View style={styles.courtsContainer}>
            {courts.map((court) => (
              <TouchableOpacity
                key={court._id}
                style={[
                  styles.courtChip,
                  selectedCourts.includes(court._id) &&
                    styles.courtChipSelected,
                ]}
                onPress={() => toggleCourt(court._id)}
              >
                <Text
                  style={[
                    styles.courtChipText,
                    selectedCourts.includes(court._id) &&
                      styles.courtChipTextSelected,
                  ]}
                >
                  {court.name} ({court.sportType})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Event Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Summer Sports Festival"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event..."
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Prize */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prize Details</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Trophy + Rs 10,000"
            value={form.prize}
            onChangeText={(text) => setForm({ ...form, prize: text })}
          />
        </View>

        {/* Entry Fee */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Entry Fee (PKR)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={form.entryFee}
            onChangeText={(text) => setForm({ ...form, entryFee: text })}
          />
        </View>

        {/* Max Participants */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Max Participants (0 = unlimited)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={form.maxParticipants}
            onChangeText={(text) => setForm({ ...form, maxParticipants: text })}
          />
        </View>

        {/* Start Date and Time */}
        <View style={styles.dateTimeRow}>
          <View style={[styles.inputGroup, styles.dateTimeInput]}>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color={theme.primary} />
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartDateChange}
                minimumDate={today}
              />
            )}
          </View>

          <View style={[styles.inputGroup, styles.dateTimeInput]}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Icon name="access-time" size={20} color={theme.primary} />
              <Text style={styles.dateText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartTimeChange}
              />
            )}
          </View>
        </View>

        {/* End Date and Time */}
        <View style={styles.dateTimeRow}>
          <View style={[styles.inputGroup, styles.dateTimeInput]}>
            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color={theme.primary} />
              <Text style={styles.dateText}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onEndDateChange}
                minimumDate={startDate < today ? today : startDate}
              />
            )}
          </View>

          <View style={[styles.inputGroup, styles.dateTimeInput]}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Icon name="access-time" size={20} color={theme.primary} />
              <Text style={styles.dateText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onEndTimeChange}
              />
            )}
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
            <Text style={styles.submitButtonText}>
              {isEditing ? "Update Event" : "Create Event"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
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
    courtsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    courtChip: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
      marginBottom: 10,
    },
    courtChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    courtChipText: {
      fontSize: 14,
      color: theme.text,
    },
    courtChipTextSelected: {
      color: "white",
    },
    dateTimeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    dateTimeInput: {
      flex: 1,
      marginHorizontal: 5,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.card,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 10,
    },
    submitButton: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    submitButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
  });
