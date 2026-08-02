import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "../../components/Icon";
import { venueAPI, courtAPI, bookingAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { vacationAPI } from "../../services/api";

const ALL_TIME_SLOTS = [
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

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;

  const baseURL = api.defaults.baseURL;
  const baseWithoutApi = baseURL.replace("/api", "");

  return `${baseWithoutApi}${imagePath}`;
};

const getSlotStartHour = (slot) => {
  const [startTime] = slot.split(" - ");
  return parseInt(startTime.split(":")[0]);
};

const getSlotEndHour = (slot) => {
  const [, endTime] = slot.split(" - ");
  return parseInt(endTime.split(":")[0]);
};

const sortSlots = (slots) => {
  return [...slots].sort((a, b) => getSlotStartHour(a) - getSlotStartHour(b));
};

const areConsecutiveSlots = (slot1, slot2) => {
  const endHour1 = getSlotEndHour(slot1);
  const startHour2 = getSlotStartHour(slot2);
  return endHour1 === startHour2;
};

const groupConsecutiveSlots = (slots) => {
  if (!slots.length) return [];
  const sortedSlots = sortSlots(slots);
  const groups = [];
  let currentGroup = [sortedSlots[0]];
  for (let i = 1; i < sortedSlots.length; i++) {
    if (areConsecutiveSlots(sortedSlots[i - 1], sortedSlots[i])) {
      currentGroup.push(sortedSlots[i]);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [sortedSlots[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
};

const formatSlotGroup = (group) => {
  if (group.length === 0) return "";
  if (group.length === 1) return group[0];
  const firstSlot = group[0];
  const lastSlot = group[group.length - 1];
  const startTime = firstSlot.split(" - ")[0];
  const endTime = lastSlot.split(" - ")[1];
  return `${startTime} - ${endTime}`;
};

const calculateGroupPrice = (group, pricePerSlot) => {
  return group.length * pricePerSlot;
};

const CreateBookingScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  const preselectedVenueId = route.params?.venueId;
  const preselectedCourtId = route.params?.courtId;
  const preselectedDate = route.params?.date
    ? new Date(route.params.date)
    : new Date();
  const preselectedSlot = route.params?.slot;

  const [step, setStep] = useState(preselectedVenueId ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(preselectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slotStatus, setSlotStatus] = useState({
    available: new Set(ALL_TIME_SLOTS),
    past: new Set(),
    booked: new Set(),
  });
  const [selectedSlots, setSelectedSlots] = useState(
    preselectedSlot ? [preselectedSlot] : [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [vacationInfo, setVacationInfo] = useState(null);
  const [timeSlotsKey, setTimeSlotsKey] = useState(0); // Add this key for forcing re-render
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
    if (selectedCourt && selectedDate && !vacationInfo) {
      fetchAvailableSlots();
    }
  }, [selectedCourt, selectedDate]);

  const loadPreselectedData = async () => {
    try {
      setLoading(true);
      const venuesResponse = await venueAPI.getAllPublicVenues();
      const venue = venuesResponse.data.find(
        (v) => v._id === preselectedVenueId,
      );
      if (venue) {
        setSelectedVenue(venue);
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
      Alert.alert("Error", "Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedCourt || !selectedVenue) return;
    if (vacationInfo) return;

    try {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      const isToday = dateStr === todayStr;

      // Check vacation
      try {
        const vacationResponse = await vacationAPI.checkVacation(
          selectedVenue._id,
          dateStr,
        );
        if (vacationResponse.data.isVacation) {
          setSlotStatus({
            available: new Set(),
            past: new Set(),
            booked: new Set(),
          });
          setSelectedSlots([]);
          setTimeSlotsKey((prev) => prev + 1); // Force re-render
          return;
        }
      } catch (error) {
        // Continue if vacation check fails
      }

      // Get booked slots
      let bookedSlotsSet = new Set();
      try {
        const response = await courtAPI.getAvailableSlots(
          selectedCourt._id,
          dateStr,
        );
        const bookedSlotsData = response.data.slots || [];
        bookedSlotsSet = new Set(
          bookedSlotsData.map((slot) => `${slot.startTime} - ${slot.endTime}`),
        );
      } catch (error) {
        // Continue if booking fetch fails
      }

      // Calculate current time for today only
      let currentTimeInMinutes = 0;
      if (isToday) {
        const now = new Date();
        currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      }

      const availableSet = new Set();
      const pastSlotsSet = new Set();
      const bookedSlotsSetResult = new Set();

      ALL_TIME_SLOTS.forEach((slot) => {
        const [startTime] = slot.split(" - ");
        const [hour, minute] = startTime.split(":").map(Number);
        const slotStartTimeInMinutes = hour * 60 + minute;

        if (bookedSlotsSet.has(slot)) {
          bookedSlotsSetResult.add(slot);
        } else if (isToday && slotStartTimeInMinutes < currentTimeInMinutes) {
          pastSlotsSet.add(slot);
        } else {
          availableSet.add(slot);
        }
      });

      setSlotStatus({
        available: availableSet,
        past: pastSlotsSet,
        booked: bookedSlotsSetResult,
      });

      // Force re-render of time slots
      setTimeSlotsKey((prev) => prev + 1);

      // Clear selected slots that are no longer available
      const stillAvailable = selectedSlots.filter((slot) =>
        availableSet.has(slot),
      );
      if (stillAvailable.length !== selectedSlots.length) {
        setSelectedSlots(stillAvailable);
      }
    } catch (error) {
      console.error("Error in fetchAvailableSlots:", error);
      setSlotStatus({
        available: new Set(ALL_TIME_SLOTS),
        past: new Set(),
        booked: new Set(),
      });
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

  const handleDateChange = async (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
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

      // Reset all states before setting new date
      setSelectedSlots([]);
      setVacationInfo(null);
      setSlotStatus({
        available: new Set(),
        past: new Set(),
        booked: new Set(),
      });

      // Set the new date
      setSelectedDate(selectedDate);

      if (selectedVenue) {
        try {
          const dateStr = selectedDate.toISOString().split("T")[0];
          const vacationResponse = await vacationAPI.checkVacation(
            selectedVenue._id,
            dateStr,
          );

          if (vacationResponse.data.isVacation) {
            const vacation = vacationResponse.data.vacation;
            setVacationInfo(vacation);
            setSlotStatus({
              available: new Set(),
              past: new Set(),
              booked: new Set(),
            });
            setTimeSlotsKey((prev) => prev + 1);
            Alert.alert(
              "🏖️ Vacation Day",
              `This venue is closed on ${selectedDate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}.\n\nReason: ${vacation?.reason || "Vacation/Closed"}\n\nPlease select another date.`,
              [{ text: "OK" }],
            );
          } else {
            setVacationInfo(null);
            // Fetch slots after date is set
            await fetchAvailableSlots();
          }
        } catch (error) {
          setVacationInfo(null);
          await fetchAvailableSlots();
        }
      }
    }
  };

  const handleSlotSelect = (slot) => {
    if (slotStatus.available.has(slot)) {
      setSelectedSlots((prev) => {
        if (prev.includes(slot)) {
          return prev.filter((s) => s !== slot);
        } else {
          return [...prev, slot];
        }
      });
    } else if (slotStatus.booked.has(slot)) {
      Alert.alert(
        "Not Available",
        "This time slot is already booked by someone else.",
      );
    } else if (slotStatus.past.has(slot)) {
      Alert.alert("Not Available", "This time slot has already passed.");
    }
  };

  const handleProceedToConfirm = () => {
    if (selectedSlots.length === 0) {
      Alert.alert("Select Time", "Please select at least one time slot");
      return;
    }
    setStep(4);
  };

  const handleSubmitBooking = async () => {
    if (!bookingDetails.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!bookingDetails.phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (vacationInfo) {
      Alert.alert(
        "Cannot Book",
        "This date is a vacation day. Please select another date.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      setLoading(true);

      const slotGroups = groupConsecutiveSlots(selectedSlots);
      const bookingPromises = slotGroups.map((group) => {
        const totalPrice = calculateGroupPrice(
          group,
          selectedCourt.pricePerSlot,
        );
        const bookingData = {
          courtId: selectedCourt._id,
          date: selectedDate.toISOString().split("T")[0],
          slots: group,
          totalPrice: totalPrice,
          paymentMethod: bookingDetails.paymentMethod,
        };
        return bookingAPI.createUserBooking(bookingData);
      });

      await Promise.all(bookingPromises);

      const bookingCount = slotGroups.length;
      const totalSlots = selectedSlots.length;

      Alert.alert(
        "Booking Successful!",
        `${bookingCount} booking(s) created for ${totalSlots} total slot(s).\n\nConsecutive slots are combined into single bookings.`,
        [
          {
            text: "View Bookings",
            onPress: () =>
              navigation.navigate("UserTabs", { screen: "Bookings" }),
          },
          {
            text: "Done",
            onPress: () => navigation.navigate("UserTabs", { screen: "Home" }),
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

  const VenueCard = ({ item }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.venueCard}
        onPress={() => handleVenueSelect(item)}
      >
        <View style={styles.venueImageContainer}>
          {item.images && item.images.length > 0 && !imageError ? (
            <Image
              source={{ uri: getImageUrl(item.images[0]) }}
              style={styles.venueImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.venueImagePlaceholder}>
              <Icon icon="venues" size={40} color="#CCCCCC" />
              <Text style={styles.placeholderText}>No Image</Text>
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
  };

  const CourtCard = ({ item }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={[
          styles.courtCard,
          selectedCourt?._id === item._id && styles.selectedCourt,
        ]}
        onPress={() => handleCourtSelect(item)}
      >
        <View style={styles.courtImageContainer}>
          {item.images && item.images.length > 0 && !imageError ? (
            <Image
              source={{ uri: getImageUrl(item.images[0]) }}
              style={styles.courtImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.courtImagePlaceholder}>
              <Icon icon="court" size={30} color="#CCCCCC" />
              <Text style={styles.placeholderText}>No Image</Text>
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
  };

  const TimeSlot = ({ item }) => {
    const isAvailable = slotStatus.available?.has(item) || false;
    const isPast = slotStatus.past?.has(item) || false;
    const isBooked = slotStatus.booked?.has(item) || false;
    const isSelected = selectedSlots.includes(item);

    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
          isPast && styles.pastTimeSlot,
          isBooked && styles.bookedTimeSlot,
        ]}
        onPress={() => handleSlotSelect(item)}
        disabled={!isAvailable}
      >
        <Text
          style={[
            styles.timeSlotTime,
            isSelected && styles.selectedTimeSlotText,
            isPast && styles.pastTimeSlotText,
            isBooked && styles.bookedTimeSlotText,
          ]}
        >
          {item}
        </Text>
        {isBooked && (
          <View style={styles.bookedBadge}>
            <Text style={styles.bookedBadgeText}>BOOKED</Text>
          </View>
        )}
        {isPast && !isBooked && <Text style={styles.pastText}>Passed</Text>}
        {isAvailable && (
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
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Venue</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : (
              <FlatList
                data={venues}
                renderItem={({ item }) => <VenueCard item={item} />}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.listContent}
                style={styles.flatList}
              />
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Selected Venue:</Text>
              <Text style={styles.selectedValue}>{selectedVenue?.name}</Text>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Select Court</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : (
              <FlatList
                data={courts}
                renderItem={({ item }) => <CourtCard item={item} />}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.listContent}
                style={styles.flatList}
              />
            )}
          </View>
        );

      case 3:
        return (
          <ScrollView
            style={styles.stepContainer}
            showsVerticalScrollIndicator={true}
            key={`time-slots-${timeSlotsKey}`} // Add key to force re-render
          >
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

            {vacationInfo && (
              <View style={styles.vacationNotice}>
                <Icon icon="umbrella" size={20} color="#FF9800" />
                <View style={styles.vacationNoticeContent}>
                  <Text style={styles.vacationNoticeTitle}>Vacation Day</Text>
                  <Text style={styles.vacationNoticeText}>
                    {vacationInfo.reason || "Venue closed for vacation"}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#E0E0E0",
                    },
                  ]}
                />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#2E7D32" }]}
                />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: "#EEEEEE",
                      borderWidth: 1,
                      borderColor: "#E0E0E0",
                    },
                  ]}
                />
                <Text style={styles.legendText}>Passed</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: "#FFEBEE",
                      borderWidth: 1,
                      borderColor: "#F44336",
                    },
                  ]}
                />
                <Text style={styles.legendText}>Booked</Text>
              </View>
            </View>

            <View style={styles.multiSelectInfo}>
              <Icon icon="info" size={14} color="#2E7D32" />
              <Text style={styles.multiSelectInfoText}>
                Tap multiple consecutive slots to book them together
              </Text>
            </View>

            <View style={styles.timeSlotsContainer}>
              <Text style={styles.timeSlotsTitle}>Time Slots</Text>
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                </View>
              ) : (
                <View style={styles.timeSlotsGrid}>
                  {ALL_TIME_SLOTS.map((slot) => (
                    <TimeSlot key={`${slot}-${timeSlotsKey}`} item={slot} />
                  ))}
                </View>
              )}
            </View>

            {selectedSlots.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryTitle}>
                  Selected: {selectedSlots.length} slot(s)
                </Text>
                <Text style={styles.selectedSummaryText}>
                  {groupConsecutiveSlots(selectedSlots).map((group, idx) => (
                    <Text key={idx}>
                      {formatSlotGroup(group)} ({group.length} hour
                      {group.length > 1 ? "s" : ""})
                      {idx < groupConsecutiveSlots(selectedSlots).length - 1
                        ? "\n"
                        : ""}
                    </Text>
                  ))}
                </Text>
                <Text style={styles.selectedSummaryTotal}>
                  Total: PKR{" "}
                  {selectedSlots.length * (selectedCourt?.pricePerSlot || 0)}
                </Text>
              </View>
            )}

            {selectedSlots.length > 0 && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedToConfirm}
              >
                <Text style={styles.proceedButtonText}>Proceed to Confirm</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        );

      case 4:
        const slotGroups = groupConsecutiveSlots(selectedSlots);
        return (
          <ScrollView
            style={styles.stepContainer}
            showsVerticalScrollIndicator={true}
          >
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
                <View style={styles.summaryValueContainer}>
                  {slotGroups.map((group, index) => (
                    <Text key={index} style={styles.summaryValue}>
                      {formatSlotGroup(group)} ({group.length} hour
                      {group.length > 1 ? "s" : ""})
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Slots:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSlots.length} hour(s)
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>
                  PKR{" "}
                  {selectedSlots.length * (selectedCourt?.pricePerSlot || 0)}
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
            <View style={{ height: 20 }} />
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderStepIndicator()}
        {renderStepContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  placeholderText: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
    textAlign: "center",
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
  vacationNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  vacationNoticeContent: {
    flex: 1,
    marginLeft: 8,
  },
  vacationNoticeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF9800",
  },
  vacationNoticeText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#757575",
  },
  multiSelectInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  multiSelectInfoText: {
    fontSize: 12,
    color: "#2E7D32",
    marginLeft: 6,
    flex: 1,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlot: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedTimeSlot: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  pastTimeSlot: {
    backgroundColor: "#EEEEEE",
    borderColor: "#E0E0E0",
  },
  bookedTimeSlot: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  timeSlotTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#212121",
  },
  selectedTimeSlotText: {
    color: "#FFFFFF",
  },
  pastTimeSlotText: {
    color: "#999999",
    textDecorationLine: "line-through",
  },
  bookedTimeSlotText: {
    color: "#F44336",
    textDecorationLine: "line-through",
  },
  priceText: {
    fontSize: 10,
    color: "#2E7D32",
    marginTop: 2,
  },
  pastText: {
    fontSize: 10,
    color: "#999999",
    marginTop: 2,
  },
  bookedBadge: {
    backgroundColor: "#F44336",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  bookedBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  selectedSummary: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  selectedSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 6,
  },
  selectedSummaryText: {
    fontSize: 12,
    color: "#212121",
    marginBottom: 4,
  },
  selectedSummaryTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 6,
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
  summaryValueContainer: {
    flex: 1,
    alignItems: "flex-end",
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
