import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Icon from "../../components/Icon";
import { Calendar } from "react-native-calendars";
import { vacationAPI, venueAPI } from "../../services/api";
import { getUser, getToken } from "../../services/authService";

const ManagerVacations = () => {
  // State variables
  const [selectedDates, setSelectedDates] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");
  const [vacations, setVacations] = useState([]);
  const [editingVacation, setEditingVacation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load user data and venues
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Debug: Check token and user
      const user = await getUser();
      const token = await getToken();

      setUserData(user);

      // Try to fetch venues
      const venuesResponse = await venueAPI.getVenues();

      setVenues(venuesResponse.data);

      if (venuesResponse.data.length > 0) {
        setSelectedVenueId(venuesResponse.data[0]._id);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers,
      });

      Alert.alert("Auth Error", "Please login again to continue.");

      // Optionally redirect to login
      // navigation.navigate("Login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vacations when venue is selected
  useEffect(() => {
    if (selectedVenueId) {
      fetchVacations();
    }
  }, [selectedVenueId]);

  const fetchVacations = async () => {
    if (!selectedVenueId) return;

    try {
      setLoading(true);
      const response = await vacationAPI.getVenueVacations(selectedVenueId);
      setVacations(response.data);
    } catch (error) {
      console.error("Error fetching vacations:", error);
      if (error.response?.status === 404) {
        // No vacations yet, set empty array
        setVacations([]);
      } else {
        Alert.alert("Error", "Failed to load vacations");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to get all dates between two dates
  const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    const endDateObj = new Date(end);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Check for overlapping vacations
  const checkOverlap = (newStart, newEnd, excludeId = null) => {
    const newStartDate = new Date(newStart);
    const newEndDate = new Date(newEnd);

    for (const vacation of vacations) {
      // Skip the vacation being edited
      if (excludeId && vacation._id === excludeId) continue;

      const existingStart = new Date(vacation.startDate);
      const existingEnd = new Date(vacation.endDate);

      // Check for overlap
      if (
        (newStartDate >= existingStart && newStartDate <= existingEnd) ||
        (newEndDate >= existingStart && newEndDate <= existingEnd) ||
        (newStartDate <= existingStart && newEndDate >= existingEnd)
      ) {
        return true; // Overlap found
      }
    }

    return false; // No overlap
  };

  // Handle day press on calendar
  const handleDayPress = (day) => {
    const today = new Date().toISOString().split("T")[0];
    if (day.dateString < today) {
      Alert.alert("Invalid Date", "Cannot select past dates");
      return;
    }

    if (!startDate) {
      // First date selection
      setStartDate(day.dateString);
      setSelectedDates({
        [day.dateString]: {
          selected: true,
          startingDay: true,
          color: "#2196F3",
        },
      });
    } else if (!endDate) {
      // Second date selection
      const newEndDate = day.dateString;

      // Validate end date is after start date
      if (newEndDate < startDate) {
        Alert.alert("Invalid Selection", "End date must be after start date");
        return;
      }

      // Check for overlap
      if (checkOverlap(startDate, newEndDate, editingVacation?._id)) {
        Alert.alert(
          "Overlap Detected",
          "This vacation period overlaps with an existing vacation. Please choose different dates.",
          [{ text: "OK" }],
        );
        return;
      }

      setEndDate(newEndDate);

      // Generate all dates between start and end
      const datesInRange = getDatesBetween(startDate, newEndDate);
      const newSelectedDates = {};

      datesInRange.forEach((date, index) => {
        newSelectedDates[date] = {
          selected: true,
          color: isEditing ? "#4CAF50" : "#2196F3",
          startingDay: index === 0,
          endingDay: index === datesInRange.length - 1,
        };
      });

      setSelectedDates(newSelectedDates);
    } else {
      // Reset selection
      setStartDate(day.dateString);
      setEndDate(null);
      setSelectedDates({
        [day.dateString]: {
          selected: true,
          startingDay: true,
          color: isEditing ? "#4CAF50" : "#2196F3",
        },
      });
    }
  };

  // Get all marked dates
  const getAllMarkedDates = () => {
    const allMarkedDates = { ...selectedDates };

    // Add saved vacations (excluding the one being edited)
    vacations.forEach((vacation) => {
      if (editingVacation && vacation._id === editingVacation._id) {
        return; // Skip the one being edited
      }

      const datesInRange = getDatesBetween(
        vacation.startDate,
        vacation.endDate,
      );
      datesInRange.forEach((date, index) => {
        allMarkedDates[date] = {
          selected: true,
          disabled: true,
          color: "#FF9800", // Orange for existing vacations
          startingDay: index === 0,
          endingDay: index === datesInRange.length - 1,
        };
      });
    });

    return allMarkedDates;
  };

  // Reset form
  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedDates({});
    setReason("");
    setEditingVacation(null);
    setIsEditing(false);
  };

  // Edit a vacation
  const editVacation = (vacation) => {
    // Convert dates to YYYY-MM-DD format
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    };

    setStartDate(formatDate(vacation.startDate));
    setEndDate(formatDate(vacation.endDate));
    setReason(vacation.reason);
    setIsEditing(true);
    setEditingVacation(vacation);

    // Mark dates on calendar
    const datesInRange = getDatesBetween(vacation.startDate, vacation.endDate);
    const newSelectedDates = {};

    datesInRange.forEach((date, index) => {
      newSelectedDates[date] = {
        selected: true,
        color: "#4CAF50", // Green for editing
        startingDay: index === 0,
        endingDay: index === datesInRange.length - 1,
      };
    });

    setSelectedDates(newSelectedDates);

    Alert.alert(
      "Edit Mode",
      "You are now editing this vacation period. Make changes and save.",
    );
  };

  // Save vacation
  const saveVacation = async () => {
    if (!selectedVenueId) {
      Alert.alert("Error", "Please select a venue first");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select a start and end date");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Error", "Please enter a reason for the vacation");
      return;
    }

    setSaving(true);

    try {
      const vacationData = {
        venueId: selectedVenueId,
        startDate,
        endDate,
        reason,
      };

      let savedVacation;

      if (isEditing && editingVacation) {
        // Update existing vacation
        savedVacation = await vacationAPI.updateVacation(
          editingVacation._id,
          vacationData,
        );

        // Update locally
        const updatedVacations = vacations.map((v) =>
          v._id === editingVacation._id ? savedVacation.data : v,
        );
        setVacations(updatedVacations);
        Alert.alert("Success", "Vacation period updated successfully");
      } else {
        // Create new vacation
        savedVacation = await vacationAPI.createVacation(vacationData);

        // Add new locally
        setVacations([...vacations, savedVacation.data]);
        Alert.alert("Success", "Vacation period saved successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving vacation:", error);

      // Handle backend errors
      let errorMessage = "Failed to save vacation. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      if (error.response?.status === 400) {
        // Validation error
        Alert.alert("Validation Error", errorMessage);
      } else if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        // You might want to redirect to login here
      } else if (error.response?.status === 500) {
        Alert.alert("Server Error", "Please try again later");
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete vacation
  const deleteVacation = (id) => {
    Alert.alert(
      "Delete Vacation",
      "Are you sure you want to delete this vacation period? Users will be able to book during these dates.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await vacationAPI.deleteVacation(id);
              setVacations(vacations.filter((v) => v._id !== id));
              if (editingVacation?._id === id) {
                resetForm();
              }
            } catch (error) {
              console.error("Error deleting vacation:", error);
              Alert.alert("Error", "Failed to delete vacation");
            }
          },
        },
      ],
    );
  };

  // Cancel edit
  const cancelEdit = () => {
    Alert.alert(
      "Cancel Edit",
      "Are you sure you want to cancel editing? Changes will be lost.",
      [
        { text: "Continue Editing", style: "cancel" },
        {
          text: "Cancel",
          onPress: resetForm,
        },
      ],
    );
  };

  // Loading state
  if (loading && vacations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Vacations</Text>
        <Text style={styles.subtitle}>
          Mark dates when your venue will be closed
        </Text>
      </View>

      {/* Venue Selector */}
      {venues.length > 0 ? (
        <View style={styles.venueSelector}>
          <Text style={styles.venueLabel}>Select Venue:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.venueScroll}
          >
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue._id}
                style={[
                  styles.venueButton,
                  selectedVenueId === venue._id && styles.venueButtonActive,
                ]}
                onPress={() => setSelectedVenueId(venue._id)}
              >
                <Text
                  style={[
                    styles.venueButtonText,
                    selectedVenueId === venue._id &&
                      styles.venueButtonTextActive,
                  ]}
                >
                  {venue.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noVenues}>
          <Icon icon="info" size={24} color="#FF9800" />
          <Text style={styles.noVenuesText}>
            No venues found. Please create a venue first.
          </Text>
        </View>
      )}

      {/* Calendar (only show if venue is selected) */}
      {selectedVenueId && (
        <>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={getAllMarkedDates()}
              markingType="period"
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                selectedDayBackgroundColor: "#2196F3",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#2196F3",
                arrowColor: "#2196F3",
                monthTextColor: "#2196F3",
                textMonthFontWeight: "bold",
                textDisabledColor: "#ccc",
              }}
            />
          </View>

          {/* Date Summary */}
          <View style={styles.dateSummary}>
            <Icon icon="calendar" size={20} color="#2196F3" />
            <Text style={styles.dateSummaryText}>
              {startDate && endDate
                ? `Selected: ${startDate} to ${endDate}`
                : startDate
                  ? `Start date: ${startDate} (Select end date)`
                  : "Select start date"}
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>
              Reason for Closure {isEditing && "(Editing)"}
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="E.g., Maintenance, Holidays, Renovation"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelEdit}
                disabled={saving}
              >
                <Icon icon="close" size={20} color="#FF3B30" />
                <Text style={styles.cancelButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveVacation}
              disabled={saving || !startDate || !endDate || !reason.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon icon="save" size={20} color="white" />
              )}
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Vacation"
                    : "Save Vacation"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Saved Vacations List */}
          <View style={styles.vacationsList}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Saved Vacation Periods</Text>
              <Text style={styles.listCount}>({vacations.length})</Text>
            </View>

            {vacations.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon icon="calendar" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No vacation periods saved
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Select dates above to mark when your venue will be closed
                </Text>
              </View>
            ) : (
              vacations.map((vacation) => (
                <View
                  key={vacation._id}
                  style={[
                    styles.vacationItem,
                    editingVacation?._id === vacation._id && styles.editingItem,
                  ]}
                >
                  <View style={styles.vacationInfo}>
                    <View style={styles.vacationHeader}>
                      <Text style={styles.vacationDates}>
                        {new Date(vacation.startDate).toLocaleDateString()} to{" "}
                        {new Date(vacation.endDate).toLocaleDateString()}
                      </Text>
                      <View style={styles.vacationActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => editVacation(vacation)}
                          disabled={saving}
                        >
                          <Icon icon="edit" size={18} color="#2196F3" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteVacation(vacation._id)}
                          disabled={saving}
                        >
                          <Icon icon="delete" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.vacationReason}>{vacation.reason}</Text>
                    <View style={styles.vacationMeta}>
                      <Text style={styles.vacationDate}>
                        Created:{" "}
                        {new Date(vacation.createdAt).toLocaleDateString()}
                      </Text>
                      {vacation.updatedAt &&
                        vacation.updatedAt !== vacation.createdAt && (
                          <Text style={styles.vacationUpdated}>
                            Updated:{" "}
                            {new Date(vacation.updatedAt).toLocaleDateString()}
                          </Text>
                        )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

// ... Keep all the styles from the previous ManagerVacations.js ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  venueSelector: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  venueLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  venueScroll: {
    flexDirection: "row",
  },
  venueButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  venueButtonActive: {
    backgroundColor: "#2196F3",
  },
  venueButtonText: {
    fontSize: 14,
    color: "#666",
  },
  venueButtonTextActive: {
    color: "white",
    fontWeight: "500",
  },
  noVenues: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  noVenuesText: {
    marginLeft: 10,
    color: "#FF9800",
    fontSize: 14,
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  dateSummary: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
  },
  dateSummaryText: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
  reasonContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  buttonContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#FFEBEE",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#2196F3",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  vacationsList: {
    marginTop: 30,
    marginHorizontal: 15,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  listCount: {
    fontSize: 16,
    color: "#666",
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  vacationItem: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  editingItem: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  vacationInfo: {
    flex: 1,
  },
  vacationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vacationDates: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  vacationActions: {
    flexDirection: "row",
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  vacationReason: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  vacationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vacationDate: {
    fontSize: 12,
    color: "#999",
  },
  vacationUpdated: {
    fontSize: 12,
    color: "#4CAF50",
    fontStyle: "italic",
  },
});

export default ManagerVacations;
