import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useAuth } from "../../contexts/AuthContext";
import {
  getBookingDetails,
  updateBookingStatus,
} from "../../services/bookingManagerService";
import api from "../../services/authService";

const PaymentVerificationScreen = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get base URL from API configuration (same as your backend)
  const getBaseUrl = () => {
    const baseURL = api.defaults.baseURL;
    return baseURL.replace("/api", "");
  };

  useEffect(() => {
    console.log("🔍 Booking ID from params:", bookingId);
    console.log("🔍 Logged in manager:", user);
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const result = await getBookingDetails(bookingId);
      console.log("🔍 Booking details:", result.booking);
      console.log("🔍 Venue ID in booking:", result.booking?.venue?._id);
      if (result.success) {
        setBooking(result.booking);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = () => {
    triggerVibration();
    Alert.alert(
      "Approve Payment",
      "Are you sure you want to approve this payment? The booking will be confirmed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              console.log("🟢 Approving payment for booking:", bookingId);
              const result = await updateBookingStatus(
                bookingId,
                "verify_payment",
                {
                  isApproved: true,
                },
              );
              if (result.success) {
                triggerVibration();
                Alert.alert("Success", "Payment approved. Booking confirmed!", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Error:", error);
              Alert.alert("Error", "Failed to approve payment");
            }
          },
        },
      ],
    );
  };

  const handleRejectPayment = () => {
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    try {
      const result = await updateBookingStatus(bookingId, "verify_payment", {
        isApproved: false,
        rejectionReason: rejectionReason,
      });

      if (result.success) {
        triggerVibration();
        Alert.alert("Payment Rejected", "The payment has been rejected.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to reject payment");
    } finally {
      setShowRejectModal(false);
      setRejectionReason("");
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = getBaseUrl();
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const fullUrl = `${baseUrl}/${imagePath}?t=${timestamp}`;

    console.log("📷 Image URL:", fullUrl);
    return fullUrl;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Verify Payment" />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <CustomHeader showBack title="Verify Payment" />
        <View style={styles.errorContainer}>
          <Icon icon="alert" size={60} color={theme.danger} />
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const imageUrl = getImageUrl(booking.paymentProof);

  return (
    <View style={styles.container}>
      {/* <CustomHeader showBack title="Verify Payment" /> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>
              #{booking._id?.substring(0, 8)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Venue:</Text>
            <Text style={styles.detailValue}>{booking.venue?.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Court:</Text>
            <Text style={styles.detailValue}>{booking.court?.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{booking.displaySlot}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Slots:</Text>
            <Text style={styles.detailValue}>{booking.totalSlots} hour(s)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              PKR {booking.totalPrice}
            </Text>
          </View>
        </View>

        {/* User Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{booking.user?.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{booking.user?.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>
              {booking.user?.phone || "Not provided"}
            </Text>
          </View>
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {booking.paymentMethod
                ? booking.paymentMethod.toUpperCase()
                : "N/A"}
            </Text>
          </View>

          {booking.transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{booking.transactionId}</Text>
            </View>
          )}

          {booking.paymentProofUploadedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted On:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(booking.paymentProofUploadedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Proof Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Screenshot</Text>

          {booking.paymentProof ? (
            <View style={styles.proofContainer}>
              {imageLoading && (
                <ActivityIndicator
                  style={styles.imageLoader}
                  size="large"
                  color={theme.primary}
                />
              )}
              <Image
                source={{
                  uri: imageUrl,
                  headers: {
                    "Cache-Control": "no-cache",
                    Accept: "image/jpeg",
                  },
                }}
                style={styles.proofImage}
                resizeMode="contain"
                onLoad={() => console.log("Image loaded!")}
                onError={(e) => console.log("Error:", e.nativeEvent.error)}
              />
              {imageError && (
                <View style={styles.imageErrorContainer}>
                  <Icon icon="image" size={40} color={theme.danger} />
                  <Text style={styles.proofErrorText}>
                    Failed to load image
                  </Text>
                  <Text style={styles.imageUrlText}>{imageUrl}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noProofContainer}>
              <Icon icon="image" size={40} color={theme.textSecondary} />
              <Text style={styles.noProofText}>No payment proof uploaded</Text>
            </View>
          )}
        </View>

        {/* Manager Notes (if any) */}
        {booking.managerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manager Notes</Text>
            <Text style={styles.managerNotes}>{booking.managerNotes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleRejectPayment}
        >
          <Icon icon="close" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Reject Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={handleApprovePayment}
        >
          <Icon icon="check" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Approve Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Reject Payment
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Please provide a reason for rejection
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              placeholder="Reason for rejection..."
              placeholderTextColor={theme.textSecondary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={submitRejection}
              >
                <Text style={styles.confirmModalButtonText}>
                  Reject Payment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 16,
      color: theme.danger,
      marginTop: 10,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 8,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    detailLabel: {
      width: 110,
      fontSize: 14,
      color: theme.textSecondary,
    },
    detailValue: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    amountText: {
      fontWeight: "bold",
      color: theme.success,
    },
    proofContainer: {
      alignItems: "center",
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 8,
      minHeight: 200,
      justifyContent: "center",
    },
    proofImage: {
      width: "100%",
      height: 300,
      borderRadius: 8,
    },
    hiddenImage: {
      position: "absolute",
      opacity: 0,
    },
    imageLoader: {
      position: "absolute",
      zIndex: 1,
    },
    imageErrorContainer: {
      alignItems: "center",
      padding: 20,
    },
    proofErrorText: {
      color: theme.danger,
      marginTop: 8,
    },
    imageUrlText: {
      color: theme.textSecondary,
      fontSize: 10,
      marginTop: 8,
      textAlign: "center",
    },
    noProofContainer: {
      alignItems: "center",
      padding: 40,
      backgroundColor: theme.background,
      borderRadius: 8,
    },
    noProofText: {
      color: theme.textSecondary,
      marginTop: 10,
    },
    managerNotes: {
      fontSize: 14,
      color: theme.warning,
      fontStyle: "italic",
      padding: 8,
      backgroundColor: theme.warning + "10",
      borderRadius: 8,
    },
    actionContainer: {
      flexDirection: "row",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.card,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 8,
      marginHorizontal: 8,
    },
    approveButton: {
      backgroundColor: theme.success,
    },
    rejectButton: {
      backgroundColor: theme.danger,
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
      borderRadius: 12,
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 5,
    },
    modalSubtitle: {
      fontSize: 14,
      marginBottom: 15,
    },
    modalInput: {
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      textAlignVertical: "top",
      marginBottom: 20,
      minHeight: 100,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 5,
    },
    cancelModalButton: {
      backgroundColor: "#E0E0E0",
    },
    confirmModalButton: {
      backgroundColor: theme.danger,
    },
    cancelModalButtonText: {
      color: "#212121",
      fontWeight: "500",
    },
    confirmModalButtonText: {
      color: "white",
      fontWeight: "500",
    },
  });

export default PaymentVerificationScreen;
