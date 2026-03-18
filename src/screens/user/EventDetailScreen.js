import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { eventAPI, userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const EventDetailScreen = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEventById(eventId);
      const eventData = response.data;
      setEvent(eventData);

      // Check if current user is registered
      if (user && eventData.registeredParticipants) {
        const registration = eventData.registeredParticipants.find(
          (p) => p.userId && p.userId._id === user.id,
        );
        if (registration) {
          setIsRegistered(true);
          setUserRegistration(registration);
        }
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      Alert.alert("Error", "Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to register for this event.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    if (isRegistered) {
      // Cancel registration
      Alert.alert(
        "Cancel Registration",
        "Are you sure you want to cancel your registration for this event?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            onPress: handleCancelRegistration,
            style: "destructive",
          },
        ],
      );
    } else {
      // Register for event
      Alert.alert(
        "Confirm Registration",
        `Do you want to register for ${event.name}?`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Register",
            onPress: handleRegisterForEvent,
          },
        ],
      );
    }
  };

  const handleRegisterForEvent = async () => {
    try {
      setRegistering(true);
      const response = await eventAPI.registerForEvent(eventId);

      // Refresh event details
      await fetchEventDetails();

      Alert.alert(
        "Success",
        response.data.message || "Successfully registered for the event!",
      );
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error.response?.data?.message ||
          "Failed to register for event. Please try again.",
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setRegistering(true);
      const response = await eventAPI.cancelRegistration(eventId);

      // Refresh event details
      await fetchEventDetails();

      Alert.alert(
        "Success",
        response.data.message || "Registration cancelled successfully",
      );
    } catch (error) {
      console.error("Cancellation error:", error);
      Alert.alert(
        "Cancellation Failed",
        error.response?.data?.message ||
          "Failed to cancel registration. Please try again.",
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleContactPress = (type, value) => {
    if (type === "phone") {
      Linking.openURL(`tel:${value}`);
    } else if (type === "email") {
      Linking.openURL(`mailto:${value}`);
    }
  };

  const handleVenuePress = () => {
    if (event?.venue?._id) {
      navigation.navigate("VenueDetail", { venueId: event.venue._id });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCourtCard = ({ item }) => (
    <TouchableOpacity
      style={styles.courtCard}
      onPress={() =>
        navigation.navigate("VenueDetail", {
          venueId: item.venue?._id || event.venue?._id,
        })
      }
    >
      <View style={styles.courtImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: getImageUrl(item.images[0]) }}
            style={styles.courtImage}
          />
        ) : (
          <View style={styles.courtImagePlaceholder}>
            <Icon icon="court" size={24} color="#CCCCCC" />
          </View>
        )}
      </View>
      <Text style={styles.courtName}>{item.name}</Text>
      <Text style={styles.courtSport}>{item.sportType || "Sport"}</Text>
    </TouchableOpacity>
  );

  const renderPrizeItem = ({ item, index }) => (
    <View style={styles.prizeItem}>
      <View
        style={[styles.prizeIcon, { backgroundColor: getPrizeColor(index) }]}
      >
        <Icon icon="trophy" size={16} color="#FFFFFF" />
      </View>
      <View style={styles.prizeInfo}>
        <Text style={styles.prizePosition}>
          {index === 0 ? "1st Place" : index === 1 ? "2nd Place" : "3rd Place"}
        </Text>
        <Text style={styles.prizeAmount}>{item}</Text>
      </View>
    </View>
  );

  const getPrizeColor = (index) => {
    switch (index) {
      case 0:
        return "#FFD700";
      case 1:
        return "#C0C0C0";
      case 2:
        return "#CD7F32";
      default:
        return "#2E7D32";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Event Details" />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <CustomHeader showBack title="Event Details" />
        <View style={styles.errorContainer}>
          <Icon icon="events" size={60} color="#CCCCCC" />
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </View>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const currentParticipants = event.registeredParticipants?.length || 0;
  const spotsLeft = event.maxParticipants - currentParticipants;
  const progressPercentage =
    (currentParticipants / event.maxParticipants) * 100;
  const isFull = currentParticipants >= event.maxParticipants;

  return (
    <View style={styles.container}>
      {/* <CustomHeader showBack title="Event Details" /> */}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {event.venue?.images && event.venue.images.length > 0 ? (
            <Image
              source={{ uri: getImageUrl(event.venue.images[0]) }}
              style={styles.eventImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon icon="events" size={60} color="#CCCCCC" />
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(event.status) },
            ]}
          >
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>

        {/* Event Title & Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.eventName}>{event.name}</Text>

          <View style={styles.organizerRow}>
            <Icon icon="profile" size={16} color="#757575" />
            <Text style={styles.organizerText}>
              Organized by {event.createdBy?.name || "Organizer"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon icon="calendar" size={20} color="#2E7D32" />
              <Text style={styles.statLabel}>Date</Text>
              <Text style={styles.statValue}>{formatDate(startDate)}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon icon="time" size={20} color="#2E7D32" />
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>
                {formatTime(startDate)} - {formatTime(endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Registration Progress */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Registration</Text>
            <Text style={styles.registrationCount}>
              {currentParticipants}/{event.maxParticipants} spots filled
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${progressPercentage}%` }]}
            />
          </View>
          <View style={styles.spotsLeftContainer}>
            <Text style={styles.spotsLeftText}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Event is full"}
            </Text>
          </View>
        </View>

        {/* Venue Info */}
        {event.venue && (
          <TouchableOpacity
            style={styles.venueSection}
            onPress={handleVenuePress}
          >
            <View style={styles.venueHeader}>
              <Icon icon="location" size={20} color="#2E7D32" />
              <Text style={styles.venueName}>{event.venue.name}</Text>
              <Icon icon="chevron-right" size={20} color="#757575" />
            </View>
            <Text style={styles.venueAddress}>
              {event.venue.location?.address || "Venue address not available"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Courts */}
        {event.courts && event.courts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Courts/Fields</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={event.courts}
              renderItem={renderCourtCard}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.courtsList}
            />
          </View>
        )}

        {/* Prizes */}
        {event.prize && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prizes</Text>
            <View style={styles.prizeContainer}>
              {event.prize.split("\n").map((prize, index) => (
                <View key={index} style={styles.prizeItem}>
                  <View
                    style={[
                      styles.prizeIcon,
                      { backgroundColor: getPrizeColor(index) },
                    ]}
                  >
                    <Icon icon="trophy" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.prizeText}>{prize}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Entry Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Fee</Text>
          <View style={styles.feeContainer}>
            <Text style={styles.feeAmount}>
              {event.entryFee === 0 ? "FREE" : `₹${event.entryFee}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Register Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Status</Text>
          <Text
            style={[
              styles.priceValue,
              {
                color: isRegistered
                  ? "#2E7D32"
                  : isFull
                    ? "#F44336"
                    : "#212121",
              },
            ]}
          >
            {isRegistered ? "Registered" : isFull ? "Full" : "Available"}
          </Text>
        </View>
        {/* <TouchableOpacity
          style={[
            styles.registerButton,
            isRegistered && styles.registeredButton,
            isFull && !isRegistered && styles.fullButton,
          ]}
          onPress={handleRegister}
          disabled={registering || (isFull && !isRegistered)}
        >
          {registering ? (
            <ActivityIndicator color={isRegistered ? "#2E7D32" : "#FFFFFF"} />
          ) : (
            <Text
              style={[
                styles.registerButtonText,
                isRegistered && styles.registeredButtonText,
              ]}
            >
              {isRegistered
                ? "✓ Registered"
                : isFull
                  ? "Event Full"
                  : "Register Now"}
            </Text>
          )}
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "upcoming":
      return "#2E7D32";
    case "ongoing":
      return "#2196F3";
    case "completed":
      return "#757575";
    case "cancelled":
      return "#F44336";
    default:
      return "#2E7D32";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 10,
  },
  imageContainer: {
    height: 200,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  eventName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  organizerText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginTop: 2,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  registrationCount: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2E7D32",
  },
  spotsLeftContainer: {
    marginTop: 8,
  },
  spotsLeftText: {
    fontSize: 14,
    color: "#757575",
  },
  venueSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  venueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  venueName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginLeft: 8,
  },
  venueAddress: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 28,
  },
  courtsList: {
    paddingRight: 16,
  },
  courtCard: {
    alignItems: "center",
    marginRight: 12,
    width: 90,
  },
  courtImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  courtImage: {
    width: "100%",
    height: "100%",
  },
  courtImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  courtName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#212121",
    textAlign: "center",
  },
  courtSport: {
    fontSize: 10,
    color: "#757575",
    textAlign: "center",
  },
  prizeContainer: {
    marginTop: 4,
  },
  prizeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  prizeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prizeInfo: {
    flex: 1,
  },
  prizePosition: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: 14,
    color: "#2E7D32",
  },
  prizeText: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
  },
  description: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  feeContainer: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: "#757575",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  registerButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  registeredButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  fullButton: {
    backgroundColor: "#CCCCCC",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  registeredButtonText: {
    color: "#2E7D32",
  },
});

export default EventDetailScreen;
