import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Icon from "../../components/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import {
  getManagerFutureBookingsByStatus,
  getManagerBookingHistory,
  getManagerReservations,
  updateBookingStatus,
} from "../../services/bookingManagerService";

// Helper: Check if booking spans >=3 days
const isMultiDayBooking = (booking) => {
  if (!booking.startDate || !booking.endDate) return false;
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 3;
};

// Helper: Check if booking is older than 30 minutes
const isBookingExpired = (booking) => {
  if (!booking.createdAt) return false;
  const createdTime = new Date(booking.createdAt);
  const currentTime = new Date();
  const diffMinutes = (currentTime - createdTime) / (1000 * 60);
  return diffMinutes > 30;
};

// Helper function to get payment method icon and display name (shared)
const getPaymentMethodDisplay = (method) => {
  if (!method) {
    return { name: "Not specified", icon: "💵", color: "#757575" };
  }
  const methodLower = String(method).toLowerCase();
  switch (methodLower) {
    case "cash":
      return { name: "Cash", icon: "💰", color: "#4CAF50" };
    case "card":
      return { name: "Card", icon: "💳", color: "#2196F3" };
    case "easypaisa":
      return { name: "Easypaisa", icon: "📱", color: "#9C27B0" };
    case "jazzcash":
      return { name: "JazzCash", icon: "📱", color: "#FF9800" };
    case "bank":
      return { name: "Bank Transfer", icon: "🏦", color: "#3F51B5" };
    default:
      return { name: method, icon: "💵", color: "#757575" };
  }
};

// ========== Pending Tab (Request Payment) ==========
const PendingBookings = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");

  const fetchPendingBookings = async () => {
    setLoading(true);
    const result = await getManagerFutureBookingsByStatus("PENDING");
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchPendingBookings();
      } else {
        fetchPendingBookings();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchPendingBookings();
    setRefreshing(false);
  };

  const handleRequestPayment = (booking) => {
    setSelectedBooking(booking);
    setPaymentNote("");
    setShowPaymentModal(true);
  };

  const submitPaymentRequest = async () => {
    try {
      const result = await updateBookingStatus(
        selectedBooking._id,
        "request_payment",
        {
          paymentRequestNote: paymentNote,
        },
      );

      if (result.success) {
        triggerVibration();
        Alert.alert("Success", "Payment requested successfully");
        setShowPaymentModal(false);
        fetchPendingBookings();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to request payment");
    }
  };

  const handleRejectBooking = (booking) => {
    Alert.alert(
      "Reject Booking",
      "Are you sure you want to reject this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            const result = await updateBookingStatus(booking._id, "reject");
            if (result.success) {
              triggerVibration();
              Alert.alert("Success", "Booking rejected");
              fetchPendingBookings();
            } else {
              Alert.alert("Error", result.message);
            }
          },
        },
      ],
    );
  };

  const renderBookingItem = ({ item }) => {
    const paymentMethod = getPaymentMethodDisplay(item.paymentMethod);

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingId}>
          Booking #{item._id.substring(0, 6)}
        </Text>
        <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
        <Text style={styles.bookingText}>
          Date: {item.date} |{" "}
          {item.displaySlot || `${item.startTime}-${item.endTime}`}
          {item.slotCount ? ` (${item.slotCount} slots)` : ""}
        </Text>
        <Text style={styles.bookingText}>
          User: {item.user?.name} ({item.user?.email})
        </Text>

        {/* Payment Method Section */}
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
          <View
            style={[
              styles.paymentMethodBadge,
              { backgroundColor: paymentMethod.color + "20" },
            ]}
          >
            <Text style={styles.paymentMethodIcon}>{paymentMethod.icon}</Text>
            <Text
              style={[styles.paymentMethodText, { color: paymentMethod.color }]}
            >
              {paymentMethod.name}
            </Text>
          </View>
        </View>

        <Text style={styles.priceText}>Amount: Rs {item.totalPrice}</Text>

        {isMultiDayBooking(item) && (
          <View style={styles.multiDayBadge}>
            <Text style={styles.multiDayText}>⏳ Multi‑day reservation</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.requestPaymentButton]}
            onPress={() => handleRequestPayment(item)}
          >
            <Text style={styles.buttonText}>Request Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleRejectBooking(item)}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={
          bookings.length === 0 ? styles.emptyContainer : null
        }
      >
        <Text style={styles.tabTitle}>Pending Bookings (Request Payment)</Text>

        {bookings.length === 0 ? (
          <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending bookings</Text>
            <Text style={styles.refreshHint}>Pull down or tap to refresh</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Payment Request Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Request Payment
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Booking: {selectedBooking?._id?.substring(0, 6)}
            </Text>

            {/* Show selected payment method in modal */}
            {selectedBooking?.paymentMethod && (
              <View style={styles.modalPaymentInfo}>
                <Text style={styles.modalPaymentLabel}>
                  User's Selected Payment Method:
                </Text>
                <View style={styles.modalPaymentBadge}>
                  <Text style={styles.modalPaymentIcon}>
                    {
                      getPaymentMethodDisplay(selectedBooking.paymentMethod)
                        .icon
                    }
                  </Text>
                  <Text style={styles.modalPaymentText}>
                    {
                      getPaymentMethodDisplay(selectedBooking.paymentMethod)
                        .name
                    }
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Note to User (Optional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              placeholder="Add payment instructions..."
              placeholderTextColor={theme.textSecondary}
              value={paymentNote}
              onChangeText={setPaymentNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={submitPaymentRequest}
              >
                <Text style={styles.confirmModalButtonText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ========== Payment Submitted Tab (Verify Payment or Cancel with Reason) ==========
const PaymentSubmittedBookings = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchPaymentSubmittedBookings = async () => {
    setLoading(true);
    const result = await getManagerFutureBookingsByStatus("PAYMENT_SUBMITTED");
    if (result.success) {
      setBookings(result.bookings || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchPaymentSubmittedBookings();
      } else {
        fetchPaymentSubmittedBookings();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchPaymentSubmittedBookings();
    setRefreshing(false);
  };

  const handleVerifyPayment = (booking) => {
    navigation.navigate("PaymentVerification", { bookingId: booking._id });
  };

  const handleCancelBooking = (booking) => {
    setSelectedCancelBooking(booking);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation");
      return;
    }

    try {
      const result = await updateBookingStatus(
        selectedCancelBooking._id,
        "reject",
        {
          rejectionReason: cancelReason,
          managerNotes: cancelReason,
          cancelledBy: "manager",
          cancelledAt: new Date().toISOString(),
        },
      );

      if (result.success) {
        triggerVibration();
        Alert.alert(
          "Booking Cancelled",
          "The booking has been cancelled. User has been notified with the reason.",
          [{ text: "OK" }],
        );
        setShowCancelModal(false);
        setSelectedCancelBooking(null);
        setCancelReason("");
        fetchPaymentSubmittedBookings();
      } else {
        Alert.alert("Error", result.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to cancel booking",
      );
    }
  };

  const renderBookingItem = ({ item }) => {
    const paymentMethod = getPaymentMethodDisplay(item.paymentMethod);

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingId}>
          Booking #{item._id.substring(0, 6)}
        </Text>
        <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
        <Text style={styles.bookingText}>
          Date: {item.date} |{" "}
          {item.displaySlot || `${item.startTime}-${item.endTime}`}
          {item.slotCount ? ` (${item.slotCount} slots)` : ""}
        </Text>
        <Text style={styles.bookingText}>
          User: {item.user?.name} ({item.user?.email})
        </Text>

        {/* Payment Method Section */}
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
          <View
            style={[
              styles.paymentMethodBadge,
              { backgroundColor: paymentMethod.color + "20" },
            ]}
          >
            <Text style={styles.paymentMethodIcon}>{paymentMethod.icon}</Text>
            <Text
              style={[styles.paymentMethodText, { color: paymentMethod.color }]}
            >
              {paymentMethod.name}
            </Text>
          </View>
        </View>

        <Text style={styles.priceText}>Amount: Rs {item.totalPrice}</Text>

        {isMultiDayBooking(item) && (
          <View style={styles.multiDayBadge}>
            <Text style={styles.multiDayText}>⏳ Multi‑day reservation</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.verifyButton]}
            onPress={() => handleVerifyPayment(item)}
          >
            <Text style={styles.buttonText}>Verify Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => handleCancelBooking(item)}
          >
            <Text style={styles.buttonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={
          bookings.length === 0 ? styles.emptyContainer : null
        }
      >
        <Text style={styles.tabTitle}>
          Payment Submitted - Verify or Cancel (30 min limit)
        </Text>

        {bookings.length === 0 ? (
          <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
            <Text style={styles.emptyText}>No payment submissions</Text>
            <Text style={styles.refreshHint}>Pull down or tap to refresh</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Cancel Booking Modal with Reason */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Icon icon="alert" size={24} color={theme.danger} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Cancel Booking
              </Text>
            </View>

            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Booking: {selectedCancelBooking?._id?.substring(0, 8)}...
            </Text>

            {/* Booking Info Box */}
            <View style={styles.bookingInfoBox}>
              <Text style={styles.bookingInfoText}>
                📍 Court: {selectedCancelBooking?.court?.name}
              </Text>
              <Text style={styles.bookingInfoText}>
                📅 Date: {selectedCancelBooking?.date}
              </Text>
              <Text style={styles.bookingInfoText}>
                ⏰ Time: {selectedCancelBooking?.displaySlot}
              </Text>
              <Text style={styles.bookingInfoText}>
                💰 Amount: Rs {selectedCancelBooking?.totalPrice}
              </Text>
            </View>

            {/* Reason Input */}
            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Reason for Cancellation{" "}
              <Text style={{ color: theme.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  height: 100,
                  textAlignVertical: "top",
                },
              ]}
              placeholder="Please explain why this booking is being cancelled..."
              placeholderTextColor={theme.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />

            {/* Note */}
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              📱 The user will see this reason in their booking details
            </Text>

            {/* Buttons - Centered */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setSelectedCancelBooking(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={submitCancelBooking}
              >
                <Text style={styles.confirmModalButtonText}>
                  Confirm Cancellation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ========== Confirmed Tab (with Cancel/Reject option) ==========
const ConfirmedBookings = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchConfirmedBookings = async () => {
    setLoading(true);
    const result = await getManagerFutureBookingsByStatus("CONFIRMED");
    if (result.success) {
      setBookings(result.bookings || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchConfirmedBookings();
      } else {
        fetchConfirmedBookings();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchConfirmedBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = (booking) => {
    setSelectedCancelBooking(booking);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation");
      return;
    }

    try {
      const result = await updateBookingStatus(
        selectedCancelBooking._id,
        "reject",
        {
          rejectionReason: cancelReason,
          managerNotes: cancelReason,
          cancelledBy: "manager",
          cancelledAt: new Date().toISOString(),
          previousStatus: selectedCancelBooking.status,
        },
      );

      if (result.success) {
        triggerVibration();
        Alert.alert(
          "Booking Cancelled",
          "The confirmed booking has been cancelled. User has been notified with the reason.",
          [{ text: "OK" }],
        );
        setShowCancelModal(false);
        setSelectedCancelBooking(null);
        setCancelReason("");
        fetchConfirmedBookings();
      } else {
        Alert.alert("Error", result.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to cancel booking",
      );
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingId}>Booking #{item._id.substring(0, 6)}</Text>
      <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
      <Text style={styles.bookingText}>
        Date: {item.date} | {item.displaySlot}
      </Text>
      <Text style={styles.bookingText}>User: {item.user?.name}</Text>
      <Text style={styles.bookingText}>
        Phone: {item.user?.phone || "Not provided"}
      </Text>
      <Text style={styles.priceText}>Amount: Rs {item.totalPrice}</Text>

      <View style={styles.statusConfirmedBadge}>
        <Text style={styles.statusConfirmedText}>Confirmed</Text>
      </View>

      {/* Cancel Button for Confirmed Bookings */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => handleCancelBooking(item)}
        >
          <Text style={styles.buttonText}>Cancel Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={
          bookings.length === 0 ? styles.emptyContainer : null
        }
      >
        <Text style={styles.tabTitle}>Confirmed Bookings</Text>

        {bookings.length === 0 ? (
          <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
            <Text style={styles.emptyText}>No confirmed bookings</Text>
            <Text style={styles.refreshHint}>Pull down or tap to refresh</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Cancel Confirmed Booking Modal with Reason */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Icon icon="alert" size={24} color={theme.danger} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Cancel Confirmed Booking
              </Text>
            </View>

            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Booking: {selectedCancelBooking?._id?.substring(0, 8)}...
            </Text>

            {/* Warning Message */}
            <View style={styles.warningBox}>
              <Icon icon="alert" size={16} color="#FF9800" />
              <Text style={styles.warningText}>
                This booking is already confirmed. Cancelling it may affect
                customer trust.
              </Text>
            </View>

            {/* Booking Info Box */}
            <View style={styles.bookingInfoBox}>
              <Text style={styles.bookingInfoText}>
                📍 Court: {selectedCancelBooking?.court?.name}
              </Text>
              <Text style={styles.bookingInfoText}>
                📅 Date: {selectedCancelBooking?.date}
              </Text>
              <Text style={styles.bookingInfoText}>
                ⏰ Time: {selectedCancelBooking?.displaySlot}
              </Text>
              <Text style={styles.bookingInfoText}>
                👤 User: {selectedCancelBooking?.user?.name}
              </Text>
              <Text style={styles.bookingInfoText}>
                💰 Amount: Rs {selectedCancelBooking?.totalPrice}
              </Text>
            </View>

            {/* Reason Input */}
            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Reason for Cancellation{" "}
              <Text style={{ color: theme.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  height: 100,
                  textAlignVertical: "top",
                },
              ]}
              placeholder="Please explain why this confirmed booking is being cancelled..."
              placeholderTextColor={theme.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />

            {/* Note */}
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              📱 The user will see this reason in their booking details and will
              receive a notification.
            </Text>

            {/* Buttons - Centered */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setSelectedCancelBooking(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={submitCancelBooking}
              >
                <Text style={styles.confirmModalButtonText}>
                  Confirm Cancellation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ========== Reservations Tab ==========
const Reservations = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    const result = await getManagerReservations();
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchReservations();
      } else {
        fetchReservations();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const renderBookingItem = ({ item }) => {
    const statusColor =
      item.status === "CONFIRMED"
        ? theme.success
        : item.status === "PENDING"
          ? theme.warning
          : theme.danger;

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingId}>
          Reservation #{item._id.substring(0, 6)}
        </Text>
        <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
        <Text style={styles.bookingText}>
          Date: {item.date} | {item.displaySlot}
        </Text>
        <Text style={styles.bookingText}>User: {item.user?.name}</Text>
        <Text style={styles.bookingText}>Days: ≥3</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      contentContainerStyle={
        bookings.length === 0 ? styles.emptyContainer : null
      }
    >
      <Text style={styles.tabTitle}>Reservations (≥3 days, any status)</Text>

      {bookings.length === 0 ? (
        <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
          <Text style={styles.emptyText}>No multi‑day reservations</Text>
          <Text style={styles.refreshHint}>Pull down or tap to refresh</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
};

// ========== History Tab ==========
const BookingHistory = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    const result = await getManagerBookingHistory();
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchHistory();
      } else {
        fetchHistory();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const renderBookingItem = ({ item }) => {
    const statusColor =
      item.status === "CONFIRMED"
        ? theme.success
        : item.status === "PENDING"
          ? theme.warning
          : item.status === "CANCELLED" || item.status === "REJECTED"
            ? theme.danger
            : theme.textSecondary;

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingId}>#{item._id.substring(0, 6)}</Text>
        <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
        <Text style={styles.bookingText}>
          Date: {item.date} | {item.displaySlot}
        </Text>
        <Text style={styles.bookingText}>User: {item.user?.name}</Text>
        {item.cancellationReason && (
          <View style={styles.cancelledReasonContainer}>
            <Text style={styles.cancelledReasonLabel}>
              Cancellation Reason:
            </Text>
            <Text style={styles.cancelledReasonText}>
              {item.cancellationReason}
            </Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      contentContainerStyle={
        bookings.length === 0 ? styles.emptyContainer : null
      }
    >
      <Text style={styles.tabTitle}>History (Last 30 days + All Future)</Text>

      {bookings.length === 0 ? (
        <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
          <Text style={styles.emptyText}>No bookings in history</Text>
          <Text style={styles.refreshHint}>Pull down or tap to refresh</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
};

// ========== Main Component ==========
export default function ManagerBookings() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const styles = createStyles(theme);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: "Pending" },
    { key: "payment_submitted", title: "Payment Submitted" },
    { key: "confirmed", title: "Confirmed" },
    { key: "reservations", title: "Reservations" },
    { key: "history", title: "History" },
  ]);

  const handleTabChange = (newIndex) => {
    triggerVibration();
    setIndex(newIndex);
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      onTabPress={() => triggerVibration()}
      indicatorStyle={[styles.indicator, { backgroundColor: theme.primary }]}
      style={styles.tabBar}
      labelStyle={styles.label}
      activeColor={theme.primary}
      inactiveColor={theme.textSecondary}
      scrollEnabled
    />
  );

  const renderScene = SceneMap({
    pending: PendingBookings,
    payment_submitted: PaymentSubmittedBookings,
    confirmed: ConfirmedBookings,
    reservations: Reservations,
    history: BookingHistory,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Manager Bookings</Text>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleTabChange}
        initialLayout={{ width: 100 }}
        renderTabBar={renderTabBar}
      />
      <TouchableOpacity
        style={[styles.plusButton, { backgroundColor: theme.primary }]}
        onPress={() => {
          triggerVibration();
          navigation.navigate("CreateBooking");
        }}
      >
        <Icon icon="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Styles (unchanged, same as original)
const createStyles = (theme) =>
  StyleSheet.create({
    // ... (keep all existing styles exactly as they were)
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "bold",
      padding: 15,
      backgroundColor: theme.card,
      color: theme.text,
    },
    tabBar: {
      backgroundColor: theme.card,
      elevation: 2,
    },
    indicator: {
      height: 3,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "none",
    },
    tabContent: {
      flex: 1,
      backgroundColor: theme.background,
    },
    tabTitle: {
      fontSize: 16,
      fontWeight: "600",
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 10,
      color: theme.textSecondary,
      backgroundColor: theme.background,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    bookingCard: {
      backgroundColor: theme.card,
      padding: 15,
      marginHorizontal: 15,
      marginBottom: 10,
      borderRadius: 10,
      elevation: 2,
    },
    bookingId: {
      fontWeight: "bold",
      fontSize: 16,
      color: theme.text,
      marginBottom: 5,
    },
    bookingText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 2,
    },
    priceText: {
      color: theme.primary,
      fontWeight: "600",
      marginTop: 5,
    },
    managerNotes: {
      color: theme.warning,
      fontSize: 12,
      marginTop: 8,
      fontStyle: "italic",
    },
    multiDayBadge: {
      backgroundColor: theme.warning + "20",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginTop: 8,
    },
    multiDayText: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: "500",
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: {
      color: "white",
      fontSize: 12,
      fontWeight: "500",
    },
    statusSubmittedBadge: {
      backgroundColor: "#2196F3",
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusSubmittedText: {
      color: "white",
      fontSize: 12,
      fontWeight: "500",
    },
    statusConfirmedBadge: {
      backgroundColor: theme.success,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusConfirmedText: {
      color: "white",
      fontSize: 12,
      fontWeight: "500",
    },
    actionButtons: {
      flexDirection: "row",
      marginTop: 10,
      justifyContent: "space-between",
      gap: 10,
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
      alignItems: "center",
      flex: 1,
    },
    requestPaymentButton: {
      backgroundColor: theme.primary,
    },
    rejectButton: {
      backgroundColor: theme.danger,
    },
    verifyButton: {
      backgroundColor: theme.success,
    },
    cancelButton: {
      backgroundColor: theme.danger,
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 300,
    },
    emptyState: {
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      textAlign: "center",
      color: theme.textSecondary,
      paddingVertical: 10,
      fontSize: 16,
    },
    refreshHint: {
      fontSize: 14,
      color: theme.primary,
      marginTop: 5,
    },
    plusButton: {
      position: "absolute",
      bottom: 80,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxWidth: 400,
      borderRadius: 16,
      padding: 20,
      backgroundColor: theme.card,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
      gap: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
    },
    modalSubtitle: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 15,
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },
    modalInput: {
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelModalButton: {
      backgroundColor: "#E0E0E0",
    },
    confirmModalButton: {
      backgroundColor: theme.danger,
    },
    cancelModalButtonText: {
      color: "#212121",
      fontWeight: "600",
      fontSize: 14,
    },
    confirmModalButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 14,
    },
    bookingInfoBox: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bookingInfoText: {
      color: theme.textSecondary,
      fontSize: 13,
      marginBottom: 6,
    },
    noteText: {
      fontSize: 12,
      marginBottom: 15,
      fontStyle: "italic",
      textAlign: "center",
    },
    expiredWarning: {
      backgroundColor: "#FFF3E0",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: "#FF9800",
    },
    expiredWarningText: {
      color: "#FF9800",
      fontSize: 11,
      fontWeight: "500",
      textAlign: "center",
    },
    cancelledReasonContainer: {
      backgroundColor: theme.danger + "10",
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.danger,
    },
    cancelledReasonLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.danger,
      marginBottom: 4,
    },
    paymentMethodContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 4,
      flexWrap: "wrap",
    },
    paymentMethodLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      marginRight: 8,
      fontWeight: "500",
    },
    paymentMethodBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 6,
    },
    paymentMethodIcon: {
      fontSize: 14,
    },
    paymentMethodText: {
      fontSize: 12,
      fontWeight: "600",
    },
    cancelledReasonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
  });
