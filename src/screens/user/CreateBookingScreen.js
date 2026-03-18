import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { venueAPI, courtAPI, bookingAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { vacationAPI } from "../../services/api";

const ALL_TIME_SLOTS = [
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
];

const CreateBookingScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  const preselectedVenueId = route.params?.venueId;
  const preselectedCourtId = route.params?.courtId;
  const preselectedDate = route.params?.date
    ? new Date(route.params.date)
    : new Date();
  const preselectedSlot = route.params?.slot;
  const preselectedPrice = route.params?.price;

  const [step, setStep] = useState(preselectedVenueId ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(preselectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState(preselectedSlot || null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    specialRequests: "",
    paymentMethod: "cash",
  });

  useEffect(() => {
    fetchVenues();

    if (preselectedVenueId) {
      loadPreselectedData();
    }
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue._id);
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedCourt, selectedDate]);

  const loadPreselectedData = async () => {
    try {
      setLoading(true);
      // Fetch venues first
      const venuesResponse = await venueAPI.getAllPublicVenues();
      const venue = venuesResponse.data.find(
        (v) => v._id === preselectedVenueId,
      );
      if (venue) {
        setSelectedVenue(venue);
        // Then fetch courts for this venue
        const courtsResponse =
          await venueAPI.getPublicVenueCourts(preselectedVenueId);
        const court = courtsResponse.data.find(
          (c) => c._id === preselectedCourtId,
        );
        if (court) {
          setSelectedCourt(court);
        }
      }
    } catch (error) {
      console.error("Error loading preselected data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venueAPI.getAllPublicVenues({ limit: 50 });
      setVenues(response.data);
    } catch (error) {
      console.error("Error fetching venues:", error);
      Alert.alert("Error", "Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourts = async (venueId) => {
    try {
      setLoading(true);
      const response = await venueAPI.getPublicVenueCourts(venueId);
      setCourts(response.data);
    } catch (error) {
      console.error("Error fetching courts:", error);
      Alert.alert("Error", "Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedCourt || !selectedVenue) return;

    try {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split("T")[0];

      console.log(
        "🔍 Checking availability for court:",
        selectedCourt._id,
        "date:",
        dateStr,
      );

      // Check if this date is a vacation for the venue
      let isVacation = false;
      try {
        const vacationResponse = await vacationAPI.checkVacation(
          selectedVenue._id,
          dateStr,
        );
        isVacation = vacationResponse.data.isVacation || false;
      } catch (error) {
        console.log("Vacation check failed, assuming no vacation");
      }

      if (isVacation) {
        // If it's a vacation, ALL slots are unavailable
        setAvailableSlots(new Set()); // Empty set = no slots available
        setSelectedSlot(null);
        Alert.alert(
          "Vacation Day",
          "This venue is closed on this date due to vacation. Please select another date.",
        );
        return;
      }

      let bookedSlots = new Set();
      try {
        const response = await courtAPI.getAvailableSlots(
          selectedCourt._id,
          dateStr,
        );
        const bookedSlotsData = response.data.slots || [];

        bookedSlots = new Set(
          bookedSlotsData.map((slot) => `${slot.startTime} - ${slot.endTime}`),
        );
      } catch (error) {
        console.log("Error fetching booked slots, assuming none are booked");
      }

      const availableSet = new Set(ALL_TIME_SLOTS);

      bookedSlots.forEach((slot) => {
        availableSet.delete(slot);
      });
      setAvailableSlots(availableSet);
    } catch (error) {
      setAvailableSlots(new Set(ALL_TIME_SLOTS));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setStep(2);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    setStep(3);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Check if selected date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);

      if (selectedDay < today) {
        Alert.alert(
          "Invalid Date",
          "Cannot select past dates. Please choose today or a future date.",
        );
        return;
      }

      setSelectedDate(selectedDate);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot) => {
    if (availableSlots.has(slot)) {
      setSelectedSlot(slot);
    } else {
      Alert.alert("Not Available", "This time slot is already booked.");
    }
  };

  const handleProceedToConfirm = () => {
    if (!selectedSlot) {
      Alert.alert("Select Time", "Please select a time slot");
      return;
    }
    setStep(4);
  };

  const handleSubmitBooking = async () => {
    // Validate required fields
    if (!bookingDetails.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!bookingDetails.phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    try {
      setLoading(true);

      // Prepare booking data for your backend API
      const bookingData = {
        courtId: selectedCourt._id,
        date: selectedDate.toISOString().split("T")[0],
        slot: selectedSlot,
        // Alternative: if your API expects slots array
        // slots: [selectedSlot],
      };

      const response = await bookingAPI.createUserBooking(bookingData);

      // If your API requires payment simulation
      if (response.data.booking) {
        // You can optionally call simulatePayment here
        // await bookingAPI.simulatePayment(response.data.booking._id, bookingDetails.paymentMethod);
      }

      Alert.alert(
        "Booking Successful!",
        "Your booking has been confirmed. You can view it in your bookings.",
        [
          {
            text: "View Bookings",
            onPress: () => {
              // Navigate to the UserTabs navigator and activate the 'Bookings' tab
              navigation.navigate("UserTabs", { screen: "Bookings" });
            },
          },
          {
            text: "Done",
            onPress: () => {
              // Navigate to the UserTabs navigator and activate the 'Home' tab
              navigation.navigate("UserTabs", { screen: "Home" });
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error creating booking:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create booking. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderVenueCard = ({ item }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => handleVenueSelect(item)}
    >
      <View style={styles.venueImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: `http://localhost:5000/uploads/${item.images[0]}` }}
            style={styles.venueImage}
          />
        ) : (
          <View style={styles.venueImagePlaceholder}>
            <Icon icon="venues" size={40} color="#CCCCCC" />
          </View>
        )}
      </View>
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueLocation}>
          {item.location?.address || "Location not specified"}
        </Text>
        <View style={styles.venueRating}>
          <Icon icon="star" size={14} color="#FFC107" />
          <Text style={styles.venueRatingText}>
            {item.averageRating?.toFixed(1) || "4.0"}
          </Text>
        </View>
      </View>
      <Icon icon="chevron-right" size={20} color="#757575" />
    </TouchableOpacity>
  );

  const renderCourtCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.courtCard,
        selectedCourt?._id === item._id && styles.selectedCourt,
      ]}
      onPress={() => handleCourtSelect(item)}
    >
      <View style={styles.courtImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: `http://localhost:5000/uploads/${item.images[0]}` }}
            style={styles.courtImage}
          />
        ) : (
          <View style={styles.courtImagePlaceholder}>
            <Icon icon="court" size={30} color="#CCCCCC" />
          </View>
        )}
      </View>
      <View style={styles.courtInfo}>
        <Text style={styles.courtName}>{item.name}</Text>
        <Text style={styles.courtSport}>{item.sportType}</Text>
        <Text style={styles.courtPrice}>PKR {item.pricePerSlot}/hour</Text>
      </View>
      {selectedCourt?._id === item._id && (
        <View style={styles.selectedIndicator}>
          <Icon icon="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTimeSlot = ({ item }) => {
    const isAvailable = availableSlots.has(item);

    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          selectedSlot === item && styles.selectedTimeSlot,
          !isAvailable && styles.unavailableTimeSlot,
        ]}
        onPress={() => isAvailable && handleSlotSelect(item)}
        disabled={!isAvailable}
      >
        <Text
          style={[
            styles.timeSlotTime,
            selectedSlot === item && styles.selectedTimeSlotText,
            !isAvailable && styles.unavailableTimeSlotText,
          ]}
        >
          {item}
        </Text>
        {!isAvailable ? (
          <Text style={styles.unavailableText}>Booked</Text>
        ) : (
          <Text style={styles.priceText}>
            PKR {selectedCourt?.pricePerSlot}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((stepNum) => (
        <React.Fragment key={stepNum}>
          <View
            style={[
              styles.stepCircle,
              step >= stepNum && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepCircleText,
                step >= stepNum && styles.stepCircleTextActive,
              ]}
            >
              {stepNum}
            </Text>
          </View>
          {stepNum < 4 && (
            <View
              style={[styles.stepLine, step > stepNum && styles.stepLineActive]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Select Venue</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#2E7D32" />
            ) : (
              <FlatList
                data={venues}
                renderItem={renderVenueCard}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );

      case 2:
        return (
          <View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Selected Venue:</Text>
              <Text style={styles.selectedValue}>{selectedVenue?.name}</Text>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Select Court</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#2E7D32" />
            ) : (
              <FlatList
                data={courts}
                renderItem={renderCourtCard}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );

      case 3:
        return (
          <View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Selected:</Text>
              <Text style={styles.selectedValue}>
                {selectedVenue?.name} - {selectedCourt?.name}
              </Text>
              <TouchableOpacity onPress={() => setStep(2)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.stepTitle}>Select Date & Time</Text>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon icon="calendar" size={20} color="#2E7D32" />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <Icon icon="chevron-down" size={20} color="#757575" />
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

            <View style={styles.timeSlotsContainer}>
              <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
              {loadingSlots ? (
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : (
                <FlatList
                  data={ALL_TIME_SLOTS}
                  renderItem={renderTimeSlot}
                  keyExtractor={(item) => item}
                  numColumns={2}
                  columnWrapperStyle={styles.timeSlotsGrid}
                  scrollEnabled={false}
                />
              )}
            </View>

            {selectedSlot && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedToConfirm}
              >
                <Text style={styles.proceedButtonText}>Proceed to Confirm</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 4:
        return (
          <View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Booking Summary:</Text>
              <TouchableOpacity onPress={() => setStep(3)}>
                <Text style={styles.changeText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Venue:</Text>
                <Text style={styles.summaryValue}>{selectedVenue?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Court:</Text>
                <Text style={styles.summaryValue}>{selectedCourt?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedSlot}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>1 hour</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>
                  PKR {selectedCourt?.pricePerSlot}
                </Text>
              </View>
            </View>

            <Text style={styles.stepTitle}>Your Details</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={bookingDetails.name}
                  onChangeText={(text) =>
                    setBookingDetails({ ...bookingDetails, name: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  value={bookingDetails.phone}
                  onChangeText={(text) =>
                    setBookingDetails({ ...bookingDetails, phone: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  value={bookingDetails.email}
                  onChangeText={(text) =>
                    setBookingDetails({ ...bookingDetails, email: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Requests</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any special requirements?"
                  multiline
                  numberOfLines={3}
                  value={bookingDetails.specialRequests}
                  onChangeText={(text) =>
                    setBookingDetails({
                      ...bookingDetails,
                      specialRequests: text,
                    })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.paymentOptions}>
                  {["cash", "card", "easypaisa", "jazzcash"].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentOption,
                        bookingDetails.paymentMethod === method &&
                          styles.selectedPayment,
                      ]}
                      onPress={() =>
                        setBookingDetails({
                          ...bookingDetails,
                          paymentMethod: method,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.paymentOptionText,
                          bookingDetails.paymentMethod === method &&
                            styles.selectedPaymentText,
                        ]}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader showBack title="Create Booking" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {renderStepIndicator()}
        {renderStepContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    backgroundColor: "#2E7D32",
  },
  stepCircleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
  },
  stepCircleTextActive: {
    color: "#FFFFFF",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 5,
  },
  stepLineActive: {
    backgroundColor: "#2E7D32",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 16,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedLabel: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  selectedValue: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
    marginLeft: 8,
  },
  changeText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  venueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  venueImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  venueImage: {
    width: "100%",
    height: "100%",
  },
  venueImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  venueLocation: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  venueRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  venueRatingText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  courtCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCourt: {
    borderColor: "#2E7D32",
  },
  courtImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  courtImage: {
    width: "100%",
    height: "100%",
  },
  courtImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  courtSport: {
    fontSize: 14,
    color: "#757575",
  },
  courtPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    marginLeft: 8,
  },
  timeSlotsContainer: {
    marginTop: 8,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  timeSlotsGrid: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeSlot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 6,
    margin: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedTimeSlot: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  unavailableTimeSlot: {
    backgroundColor: "#F5F5F5",
    opacity: 0.5,
  },
  timeSlotTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#212121",
  },
  selectedTimeSlotText: {
    color: "#FFFFFF",
  },
  unavailableTimeSlotText: {
    color: "#999999",
    textDecorationLine: "line-through",
  },
  priceText: {
    fontSize: 10,
    color: "#2E7D32",
    marginTop: 2,
  },
  unavailableText: {
    fontSize: 10,
    color: "#F44336",
    marginTop: 2,
  },
  proceedButton: {
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  proceedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#757575",
  },
  summaryValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  paymentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paymentOption: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPayment: {
    backgroundColor: "#2E7D32",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#757575",
  },
  selectedPaymentText: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateBookingScreen;
