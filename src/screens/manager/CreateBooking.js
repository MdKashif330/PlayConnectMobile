import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import CalendarPicker from "react-native-calendar-picker";

export default function CreateBooking() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Create styles FIRST - before any conditional returns
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMultiStartPicker, setShowMultiStartPicker] = useState(false);
  const [showMultiEndPicker, setShowMultiEndPicker] = useState(false);

  // Form state
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMultiDay, setIsMultiDay] = useState(false);

  // Available time slots
  const timeSlots = [
    "00:00 - 01:00",
    "01:00 - 02:00",
    "02:00 - 03:00",
    "03:00 - 04:00",
    "04:00 - 05:00",
    "05:00 - 06:00",
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
    "22:00 - 23:00",
    "23:00 - 24:00",
  ];

  // Fetch manager's venues
  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get("/manager/venues", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVenues(response.data || []);
      if (response.data.length > 0) {
        setSelectedVenue(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      Alert.alert("Error", "Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courts when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue);
    }
  }, [selectedVenue]);

  const fetchCourts = async (venueId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get(`/courts/venue/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourts(response.data || []);
      if (response.data.length > 0) {
        setSelectedCourt(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
    }
  };

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setDate(dateStr);
    setStartDate(dateStr);
    setEndDate(dateStr);
  }, []);

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) {
      setShowDatePicker(false);
      setShowMultiStartPicker(false);
      setShowMultiEndPicker(false);
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    if (showDatePicker) {
      setDate(formattedDate);
      setShowDatePicker(false);
    } else if (showMultiStartPicker) {
      setStartDate(formattedDate);
      setShowMultiStartPicker(false);
    } else if (showMultiEndPicker) {
      setEndDate(formattedDate);
      setShowMultiEndPicker(false);
    }
  };

  const toggleTimeSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const groupConsecutiveSlots = (slots) => {
    if (!slots || slots.length === 0) return [];

    const sortedSlots = [...slots].sort((a, b) => {
      const getStartTime = (slot) => parseInt(slot.split("-")[0]);
      return getStartTime(a) - getStartTime(b);
    });

    const areConsecutive = (slot1, slot2) => {
      const getEndTime = (slot) => parseInt(slot.split("-")[1].split(":")[0]);
      const getStartTime = (slot) => parseInt(slot.split("-")[0].split(":")[0]);
      return getEndTime(slot1) === getStartTime(slot2);
    };

    const groups = [];
    let currentGroup = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      if (areConsecutive(sortedSlots[i - 1], sortedSlots[i])) {
        currentGroup.push(sortedSlots[i]);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [sortedSlots[i]];
      }
    }

    groups.push(currentGroup);
    return groups;
  };

  const handleCreateBooking = async () => {
    if (!selectedVenue || !selectedCourt || selectedSlots.length === 0) {
      Alert.alert(
        "Error",
        "Please select venue, court and at least one time slot",
      );
      return;
    }

    if (!isMultiDay && !date) {
      Alert.alert("Error", "Please select a date");
      return;
    }

    if (isMultiDay && (!startDate || !endDate)) {
      Alert.alert(
        "Error",
        "Please select start and end dates for multi-day booking",
      );
      return;
    }

    setCreating(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const checkDate = isMultiDay ? startDate : date;

      const vacationsResponse = await api.get(
        `/vacations/venue/${selectedVenue}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const vacations = vacationsResponse.data || [];

      if (isMultiDay) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          dates.push(dateStr);
        }

        const hasVacation = dates.some((date) => {
          return vacations.some((vacation) => {
            const vacStart = new Date(vacation.startDate)
              .toISOString()
              .split("T")[0];
            const vacEnd = new Date(vacation.endDate)
              .toISOString()
              .split("T")[0];
            return date >= vacStart && date <= vacEnd;
          });
        });

        if (hasVacation) {
          Alert.alert("Error", "Selected date range includes a vacation day");
          setCreating(false);
          return;
        }
      } else {
        const isVacation = vacations.some((vacation) => {
          const vacStart = new Date(vacation.startDate)
            .toISOString()
            .split("T")[0];
          const vacEnd = new Date(vacation.endDate).toISOString().split("T")[0];
          return date >= vacStart && date <= vacEnd;
        });

        if (isVacation) {
          Alert.alert("Error", "Cannot book on a vacation date");
          setCreating(false);
          return;
        }
      }

      const slotGroups = groupConsecutiveSlots(selectedSlots);
      console.log("📊 Slot groups:", slotGroups);

      const bookingPromises = slotGroups.map((slotGroup) => {
        const bookingData = {
          courtId: selectedCourt,
          slots: slotGroup,
        };

        if (isMultiDay) {
          bookingData.startDate = startDate;
          bookingData.endDate = endDate;
        } else {
          bookingData.date = date;
        }

        return api.post("/bookings", bookingData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      await Promise.all(bookingPromises);

      Alert.alert(
        "Success",
        `${slotGroups.length} booking(s) created with ${selectedSlots.length} total slot(s).`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error creating booking(s):", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create booking(s)",
      );
    } finally {
      setCreating(false);
    }
  };

  const renderTimeSlot = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.timeSlot,
        selectedSlots.includes(item) && styles.selectedTimeSlot,
      ]}
      onPress={() => toggleTimeSlot(item)}
    >
      <Text
        style={[
          styles.timeSlotText,
          selectedSlots.includes(item) && styles.selectedTimeSlotText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const slotGroups = groupConsecutiveSlots(selectedSlots);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading venues...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Booking</Text>
        <Text style={styles.subtitle}>Create booking as manager</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Venue Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Venue *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVenue}
              onValueChange={(itemValue) => setSelectedVenue(itemValue)}
              style={styles.picker}
              dropdownIconColor={theme.textSecondary}
            >
              {venues.map((venue) => (
                <Picker.Item
                  key={venue._id}
                  label={venue.name}
                  value={venue._id}
                  color={theme.text}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Court Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Court *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCourt}
              onValueChange={(itemValue) => setSelectedCourt(itemValue)}
              style={styles.picker}
              dropdownIconColor={theme.textSecondary}
            >
              {courts.map((court) => (
                <Picker.Item
                  key={court._id}
                  label={`${court.name} (${court.sportType}) - Rs ${court.pricePerSlot}`}
                  value={court._id}
                  color={theme.text}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Multi-day toggle */}
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => setIsMultiDay(!isMultiDay)}
        >
          <View style={[styles.toggle, isMultiDay && styles.toggleActive]}>
            <View
              style={[
                styles.toggleCircle,
                isMultiDay && styles.toggleCircleActive,
              ]}
            />
          </View>
          <Text style={styles.toggleLabel}>Multi-day booking</Text>
        </TouchableOpacity>

        {/* Date Selection */}
        {!isMultiDay ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{date || "Select Date"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowMultiStartPicker(true)}
              >
                <Text style={styles.dateText}>
                  {startDate || "Select Start Date"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowMultiEndPicker(true)}
              >
                <Text style={styles.dateText}>
                  {endDate || "Select End Date"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Time Slots Selection */}
        <View style={styles.inputGroup}>
          <View style={styles.slotsHeader}>
            <Text style={styles.label}>Select Time Slot(s) *</Text>
            <Text style={styles.selectedCount}>
              Selected: {selectedSlots.length}
            </Text>
          </View>
          <FlatList
            data={timeSlots}
            renderItem={renderTimeSlot}
            keyExtractor={(item) => item}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.slotsContainer}
          />
          <Text style={styles.hint}>Tap to select multiple time slots</Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={creating || selectedSlots.length === 0}
        >
          {creating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>
              Create {slotGroups.length} Booking
              {slotGroups.length !== 1 ? "s" : ""}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar Modals */}
      <Modal
        visible={showDatePicker || showMultiStartPicker || showMultiEndPicker}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <CalendarPicker
              onDateChange={handleDateSelect}
              minDate={new Date()}
              selectedDayColor={theme.primary}
              selectedDayTextColor="#FFFFFF"
              todayBackgroundColor={theme.primaryLight}
              todayTextColor={theme.primary}
            />
            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={() => {
                setShowDatePicker(false);
                setShowMultiStartPicker(false);
                setShowMultiEndPicker(false);
              }}
            >
              <Text style={styles.calendarCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 10,
      color: theme.textSecondary,
    },
    header: {
      backgroundColor: theme.card,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 5,
    },
    formContainer: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.text,
    },
    pickerContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    picker: {
      height: 50,
      color: theme.text,
    },
    dateInput: {
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 15,
      justifyContent: "center",
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
    },
    hint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    toggle: {
      width: 50,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.border,
      padding: 3,
      marginRight: 12,
    },
    toggleActive: {
      backgroundColor: theme.primary,
    },
    toggleCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.card,
      transform: [{ translateX: 0 }],
    },
    toggleCircleActive: {
      transform: [{ translateX: 24 }],
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text,
    },
    slotsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    selectedCount: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    slotsContainer: {
      paddingBottom: 5,
    },
    timeSlot: {
      flex: 1,
      margin: 4,
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      minWidth: "48%",
    },
    selectedTimeSlot: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    timeSlotText: {
      fontSize: 14,
      color: theme.text,
      textAlign: "center",
    },
    selectedTimeSlotText: {
      color: "white",
      fontWeight: "600",
    },
    createButton: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    createButtonDisabled: {
      backgroundColor: theme.primary + "80",
    },
    createButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    calendarContainer: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 20,
      width: "90%",
      maxWidth: 400,
    },
    calendarCloseButton: {
      marginTop: 15,
      padding: 12,
      backgroundColor: theme.primary,
      borderRadius: 8,
      alignItems: "center",
    },
    calendarCloseText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
  });
