import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { bookingAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const BookingDetailScreen = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingById(bookingId);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "No, Keep It", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: async () => {
            try {
              setCancelling(true);
              await bookingAPI.cancelUserBooking(bookingId);

              // Update local booking status
              setBooking({ ...booking, status: "CANCELLED" });
              Alert.alert("Success", "Booking cancelled successfully");
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to cancel booking. Please try again.",
              );
            } finally {
              setCancelling(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleContactVenue = () => {
    const phone = booking?.venue?.phone || booking?.venue?.manager?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Info", "No phone number available for this venue");
    }
  };

  const handleGetDirections = () => {
    const address =
      booking?.venue?.location?.address || booking?.venue?.address;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      );
    } else {
      Alert.alert("Info", "No address available for this venue");
    }
  };

  const handleAddToCalendar = () => {
    Alert.alert("Coming Soon", "Calendar integration will be available soon!");
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "#4CAF50";
      case "PENDING":
        return "#FFC107";
      case "COMPLETED":
        return "#2196F3";
      case "CANCELLED":
        return "#F44336";
      case "REJECTED":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "checkmark-circle";
      case "PENDING":
        return "time";
      case "COMPLETED":
        return "checkmark-done";
      case "CANCELLED":
        return "close-circle";
      case "REJECTED":
        return "close-circle";
      default:
        return "information-circle";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const getDisplayTime = () => {
    if (!booking) return "N/A";

    if (booking.displaySlot) {
      return booking.displaySlot;
    }

    if (booking.slots && booking.slots.length > 0) {
      const firstSlot = booking.slots[0];
      const lastSlot = booking.slots[booking.slots.length - 1];
      return `${firstSlot.startTime} - ${lastSlot.endTime}`;
    }

    return "N/A";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Booking Details" />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <CustomHeader showBack title="Booking Details" />
        <View style={styles.errorContainer}>
          <Icon icon="bookings" size={60} color="#CCCCCC" />
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const isUpcoming =
    booking.status === "CONFIRMED" || booking.status === "PENDING";
  const venue = booking.venue || {};
  const court = booking.court || {};

  return (
    <View style={styles.container}>
      {/* <CustomHeader showBack title="Booking Details" /> */}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Icon
            icon={getStatusIcon(booking.status)}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
          <Text style={styles.bookingId}>ID: {booking._id?.slice(-6)}</Text>
        </View>

        {/* Venue Info Card */}
        <TouchableOpacity
          style={styles.venueCard}
          onPress={() =>
            navigation.navigate("VenueDetail", { venueId: venue._id })
          }
        >
          <View style={styles.venueImageContainer}>
            {venue.images && venue.images.length > 0 ? (
              <Image
                source={{ uri: getImageUrl(venue.images[0]) }}
                style={styles.venueImage}
              />
            ) : (
              <View style={styles.venueImagePlaceholder}>
                <Icon icon="venues" size={40} color="#CCCCCC" />
              </View>
            )}
          </View>
          <View style={styles.venueInfo}>
            <Text style={styles.venueName}>{venue.name || "Venue"}</Text>
            <Text style={styles.courtName}>{court.name || "Court"}</Text>
            <View style={styles.venueRating}>
              <Icon icon="star" size={14} color="#FFC107" />
              <Text style={styles.ratingText}>
                {venue.averageRating?.toFixed(1) || "4.0"}
              </Text>
            </View>
          </View>
          <Icon icon="chevron-right" size={20} color="#757575" />
        </TouchableOpacity>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="calendar" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(booking.date || booking.startDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="time" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{getDisplayTime()}</Text>
            </View>
          </View>

          {booking.slots && booking.slots.length > 1 && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon icon="time" size={18} color="#2E7D32" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Total Slots</Text>
                <Text style={styles.detailValue}>
                  {booking.slots.length} hours
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="price" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                PKR {booking.totalPrice || booking.totalAmount}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="payment" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {booking.paymentMethod || "Not specified"}
              </Text>
            </View>
          </View>

          {booking.specialRequests && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon icon="note" size={18} color="#2E7D32" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Special Requests</Text>
                <Text style={styles.detailValue}>
                  {booking.specialRequests}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="calendar" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booked On</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(booking.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Customer Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="profile" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{user?.name || "You"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="phone" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>
                {user?.phone || "Not provided"}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon icon="email" size={18} color="#2E7D32" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleContactVenue}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                <Icon icon="phone" size={20} color="#2196F3" />
              </View>
              <Text style={styles.actionText}>Call Venue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGetDirections}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Icon icon="location" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToCalendar}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
                <Icon icon="calendar" size={20} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policyCard}>
          <Text style={styles.cardTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            • Free cancellation up to 24 hours before booking{"\n"}• 50% refund
            for cancellation within 24 hours{"\n"}• No refund for no-show or
            last minute cancellation
          </Text>
        </View>

        {/* Cancel Button (only for upcoming bookings) */}
        {isUpcoming && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#F44336" />
            ) : (
              <>
                <Icon icon="close" size={20} color="#F44336" />
                <Text style={styles.cancelButtonText}>Cancel This Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Need Help? */}
        <TouchableOpacity style={styles.helpLink}>
          <Text style={styles.helpText}>Need help with this booking?</Text>
          <Icon icon="chevron-right" size={16} color="#2E7D32" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
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
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
    textTransform: "capitalize",
  },
  bookingId: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
  venueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 8,
  },
  venueImageContainer: {
    width: 70,
    height: 70,
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
    marginBottom: 4,
  },
  courtName: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  venueRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailIcon: {
    width: 30,
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#757575",
  },
  policyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 22,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 8,
    marginHorizontal: 16,
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 20,
  },
  helpText: {
    fontSize: 14,
    color: "#2E7D32",
    marginRight: 4,
  },
});

export default BookingDetailScreen;
