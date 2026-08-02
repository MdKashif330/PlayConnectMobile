import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { bookingAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const UserBookings = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, []),
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getUserBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Alert.alert("Error", "Failed to load your bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getFilteredBookings = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Need Payment tab - shows bookings that need payment (status = PAYMENT_SUBMITTED)
    if (activeTab === "need_payment") {
      return bookings.filter(
        (booking) => booking.status === "PAYMENT_SUBMITTED",
      );
    }

    return bookings.filter((booking) => {
      // Skip bookings that need payment action in other tabs
      if (booking.status === "PAYMENT_SUBMITTED") {
        return false;
      }

      const bookingDate = booking.date || booking.startDate;
      const isFuture = bookingDate > today;

      if (bookingDate === today) {
        const lastSlot =
          booking.slots && booking.slots.length > 0
            ? booking.slots[booking.slots.length - 1]
            : null;

        if (lastSlot) {
          const [endHour, endMinute] = lastSlot.endTime.split(":").map(Number);
          const bookingEndTime = endHour * 60 + (endMinute || 0);
          return activeTab === "upcoming"
            ? bookingEndTime > currentTime
            : bookingEndTime <= currentTime;
        }
      }

      return activeTab === "upcoming" ? isFuture : !isFuture;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "#4CAF50";
      case "PENDING":
        return "#FFC107";
      case "PAYMENT_SUBMITTED":
        return "#2196F3";
      case "CANCELLED":
        return "#F44336";
      case "REJECTED":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PAYMENT_SUBMITTED":
        return "Payment Required";
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    const baseURL = api.defaults.baseURL;
    const baseWithoutApi = baseURL.replace("/api", "");

    return `${baseWithoutApi}${imagePath}`;
  };

  const handleMakePayment = (booking) => {
    navigation.navigate("PaymentSubmission", {
      bookingId: booking._id,
      bookingDetails: {
        venueName: booking.venue?.name,
        courtName: booking.court?.name,
        date: formatDate(booking.date || booking.startDate),
        time: booking.displaySlot,
        amount: booking.totalPrice || booking.totalAmount,
      },
    });
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: async () => {
            try {
              await bookingAPI.cancelUserBooking(booking._id);
              fetchBookings();
              Alert.alert("Success", "Booking cancelled successfully");
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert("Error", "Failed to cancel booking");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  // Helper to get rejection/cancellation note
  const getRejectionNote = (booking) => {
    // Check various fields where manager's note might be stored
    if (booking.rejectionReason) return booking.rejectionReason;
    if (booking.cancellationReason) return booking.cancellationReason;
    if (booking.managerNotes) return booking.managerNotes;
    if (booking.paymentRequestNote) return booking.paymentRequestNote;
    return null;
  };

  const renderBookingCard = ({ item }) => {
    const rejectionNote = getRejectionNote(item);
    const isRejectedOrCancelled =
      item.status === "REJECTED" || item.status === "CANCELLED";

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() =>
          navigation.navigate("BookingDetail", { bookingId: item._id })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.venueInfo}>
            <View style={styles.venueImageContainer}>
              {item.venue?.images && item.venue.images.length > 0 ? (
                <Image
                  source={{ uri: getImageUrl(item.venue.images[0]) }}
                  style={styles.venueImage}
                />
              ) : (
                <View style={styles.venueImagePlaceholder}>
                  <Icon icon="venues" size={24} color="#CCCCCC" />
                </View>
              )}
            </View>
            <View style={styles.venueDetails}>
              <Text style={styles.venueName}>
                {item.venue?.name || "Venue"}
              </Text>
              <Text style={styles.courtName}>
                {item.court?.name || "Court"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon icon="calendar" size={16} color="#757575" />
            <Text style={styles.infoText}>
              {formatDate(item.date || item.startDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon icon="time" size={16} color="#757575" />
            <Text style={styles.infoText}>
              {item.displaySlot ||
                `${item.slots?.[0]?.startTime} - ${item.slots?.[item.slots.length - 1]?.endTime}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon icon="price" size={16} color="#757575" />
            <Text style={styles.infoText}>
              PKR {item.totalPrice || item.totalAmount}
            </Text>
          </View>

          {item.paymentMethod && (
            <View style={styles.infoRow}>
              <Icon icon="payment" size={16} color="#757575" />
              <Text style={styles.infoText}>{item.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* Show Manager's Note for Rejected or Cancelled Bookings */}
        {isRejectedOrCancelled && rejectionNote && (
          <View style={styles.rejectionNoteContainer}>
            <View style={styles.rejectionNoteHeader}>
              <Icon icon="alert" size={14} color="#F44336" />
              <Text style={styles.rejectionNoteTitle}>
                {item.status === "REJECTED"
                  ? "Booking Rejected"
                  : "Booking Cancelled"}
              </Text>
            </View>
            <Text style={styles.rejectionNoteText}>{rejectionNote}</Text>
          </View>
        )}

        {/* Need Payment - Show Make Payment Button */}
        {item.status === "PAYMENT_SUBMITTED" && (
          <View style={styles.cardFooter}>
            {item.managerNotes && (
              <Text style={styles.managerNote}>{item.managerNotes}</Text>
            )}
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => handleMakePayment(item)}
            >
              <Icon icon="payment" size={16} color="#FFFFFF" />
              <Text style={styles.payNowButtonText}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending - Show Cancel Button */}
        {item.status === "PENDING" && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader title="My Bookings" showNotifications showProfile />
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="My Bookings" showNotifications showProfile />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "need_payment" && styles.activeTab]}
          onPress={() => setActiveTab("need_payment")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "need_payment" && styles.activeTabText,
            ]}
          >
            Need Payment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon icon="bookings" size={60} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptyText}>
            {activeTab === "upcoming"
              ? "You don't have any upcoming bookings."
              : activeTab === "need_payment"
                ? "No bookings awaiting payment."
                : "No past bookings found."}
          </Text>
          {activeTab === "upcoming" && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() =>
                navigation.navigate("UserTabs", { screen: "Home" })
              }
            >
              <Text style={styles.browseButtonText}>Browse Venues</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#E8F5E9",
  },
  tabText: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2E7D32",
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  venueInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  venueImageContainer: {
    width: 50,
    height: 50,
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
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  courtName: {
    fontSize: 14,
    color: "#757575",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  managerNote: {
    fontSize: 12,
    color: "#FF9800",
    marginBottom: 10,
    fontStyle: "italic",
  },
  payNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    borderRadius: 8,
  },
  payNowButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#FFEBEE",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  // Rejection/Cancellation Note Styles
  rejectionNoteContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F44336",
  },
  rejectionNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  rejectionNoteTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#F44336",
  },
  rejectionNoteText: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 16,
  },
});

export default UserBookings;
