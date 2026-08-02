import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "../../components/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { bookingAPI, refundAPI } from "../../services/api";
import * as ImagePicker from "expo-image-picker";

const RefundScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reason, setReason] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [accountDetails, setAccountDetails] = useState({
    accountType: "easypaisa",
    accountNumber: "",
    accountHolderName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get user's bookings that can be refunded (CANCELLED, REJECTED, or CONFIRMED)
      const bookingsResponse = await bookingAPI.getUserBookings();
      const eligibleBookings = bookingsResponse.data.filter(
        (b) =>
          b.status === "CANCELLED" ||
          b.status === "REJECTED" ||
          b.status === "CONFIRMED",
      );
      setBookings(eligibleBookings);

      // Get existing refund requests
      try {
        const refundsResponse = await refundAPI.getUserRefunds();
        setRefunds(refundsResponse.data.refunds || []);
      } catch (error) {
        console.log("No refunds found or endpoint not ready yet");
        setRefunds([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Don't show alert for 404, just show empty state
      if (error.response?.status !== 404) {
        Alert.alert("Error", "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefund = (booking) => {
    setSelectedBooking(booking);
    setReason("");
    setProofImage(null);
    setAccountDetails({
      accountType: "easypaisa",
      accountNumber: "",
      accountHolderName: user?.name || "",
    });
    setShowModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const submitRefundRequest = async () => {
    console.log("🔵 Submit button clicked - starting refund request");

    console.log("Reason:", reason);
    console.log("Account details:", accountDetails);
    console.log("Selected booking:", selectedBooking);

    if (!reason.trim()) {
      console.log("❌ No reason provided");
      Alert.alert("Error", "Please provide a reason for refund");
      return;
    }

    if (!accountDetails.accountNumber.trim()) {
      console.log("❌ No account number");
      Alert.alert("Error", "Please provide account number");
      return;
    }

    if (!accountDetails.accountHolderName.trim()) {
      Alert.alert("Error", "Please provide account holder name");
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        bookingId: selectedBooking._id,
        reason: reason,
        bookingStatus: selectedBooking.status,
        accountDetails: accountDetails,
      };

      const response = await refundAPI.createRefundRequest(requestData);

      if (response.data.success) {
        triggerVibration();
        Alert.alert("Success", "Refund request submitted successfully");
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit refund request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "#FF9800";
      case "APPROVED":
        return "#4CAF50";
      case "REJECTED":
        return "#F44336";
      case "COMPLETED":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Pending Review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  const renderBookingItem = ({ item }) => {
    const hasRefund = refunds.some((r) => r.booking?._id === item._id);
    const refund = refunds.find((r) => r.booking?._id === item._id);

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingId}>
          Booking #{item._id.substring(0, 6)}
        </Text>
        <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
        <Text style={styles.bookingText}>Date: {item.date}</Text>
        <Text style={styles.bookingText}>Time: {item.displaySlot}</Text>
        <Text style={styles.priceText}>Amount: Rs {item.totalPrice}</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>

        {hasRefund ? (
          <View style={styles.refundStatusContainer}>
            <Text style={styles.refundStatusLabel}>Refund Status:</Text>
            <Text
              style={[
                styles.refundStatus,
                { color: getStatusColor(refund.status) },
              ]}
            >
              {getStatusText(refund.status)}
            </Text>
            {refund.adminResponse && (
              <Text style={styles.adminResponse}>
                Response: {refund.adminResponse}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.refundButton}
            onPress={() => handleRequestRefund(item)}
          >
            <Icon icon="refund" size={16} color="white" />
            <Text style={styles.refundButtonText}>Request Refund</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRefundItem = ({ item }) => (
    <View style={styles.refundCard}>
      <Text style={styles.refundId}>
        Refund Request #{item._id.substring(0, 6)}
      </Text>
      <Text style={styles.refundText}>Booking: {item.booking?.date}</Text>
      <Text style={styles.refundText}>Amount: Rs {item.amount}</Text>
      <Text style={styles.refundText}>Reason: {item.reason}</Text>
      <View
        style={[
          styles.refundStatusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.refundStatusText}>
          {getStatusText(item.status)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Refund Requests</Text>

      <Text style={styles.sectionTitle}>Your Bookings</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon icon="bookings" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>No eligible bookings for refund</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Text style={styles.sectionTitle}>Your Refund Requests</Text>
      {refunds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No refund requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={refunds}
          renderItem={renderRefundItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Refund Request Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Request Refund
            </Text>

            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Booking: {selectedBooking?.date} - {selectedBooking?.displaySlot}
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: theme.textSecondary }]}
            >
              Amount: Rs {selectedBooking?.totalPrice}
            </Text>

            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Reason for Refund *
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  height: 100,
                },
              ]}
              placeholder="Please explain why you need a refund..."
              placeholderTextColor={theme.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Payment Proof (Optional)
            </Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Icon icon="image" size={20} color={theme.primary} />
              <Text style={[styles.imagePickerText, { color: theme.primary }]}>
                {proofImage ? "Change Image" : "Upload Payment Proof"}
              </Text>
            </TouchableOpacity>
            {proofImage && (
              <Image source={{ uri: proofImage }} style={styles.previewImage} />
            )}

            <Text style={[styles.modalLabel, { color: theme.text }]}>
              Account Details for Refund *
            </Text>

            <View style={styles.accountTypeContainer}>
              {["easypaisa", "jazzcash", "bank"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.accountTypeButton,
                    accountDetails.accountType === type &&
                      styles.accountTypeButtonActive,
                  ]}
                  onPress={() =>
                    setAccountDetails({ ...accountDetails, accountType: type })
                  }
                >
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountDetails.accountType === type &&
                        styles.accountTypeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              placeholder="Account Number"
              placeholderTextColor={theme.textSecondary}
              value={accountDetails.accountNumber}
              onChangeText={(text) =>
                setAccountDetails({ ...accountDetails, accountNumber: text })
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              placeholder="Account Holder Name"
              placeholderTextColor={theme.textSecondary}
              value={accountDetails.accountHolderName}
              onChangeText={(text) =>
                setAccountDetails({
                  ...accountDetails,
                  accountHolderName: text,
                })
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={submitRefundRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>
                    Submit Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      padding: 16,
      color: theme.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      color: theme.textSecondary,
    },
    listContainer: {
      padding: 16,
      paddingTop: 0,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    bookingCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
    },
    bookingId: {
      fontWeight: "bold",
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    bookingText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    priceText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.primary,
      marginTop: 4,
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
    refundButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    refundButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "500",
    },
    refundStatusContainer: {
      marginTop: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    refundStatusLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    refundStatus: {
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 2,
    },
    adminResponse: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      fontStyle: "italic",
    },
    refundCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    refundId: {
      fontWeight: "bold",
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },
    refundText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    refundStatusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    refundStatusText: {
      color: "white",
      fontSize: 12,
      fontWeight: "500",
    },
    emptyContainer: {
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
    },
    modalContent: {
      margin: 20,
      borderRadius: 16,
      padding: 20,
      maxHeight: "90%",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 16,
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
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    imagePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary,
      marginBottom: 16,
      gap: 8,
    },
    imagePickerText: {
      fontSize: 14,
      fontWeight: "500",
    },
    previewImage: {
      width: "100%",
      height: 150,
      borderRadius: 10,
      marginBottom: 16,
    },
    accountTypeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 10,
    },
    accountTypeButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    accountTypeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    accountTypeText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    accountTypeTextActive: {
      color: "white",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },
    cancelModalButton: {
      backgroundColor: "#E0E0E0",
    },
    confirmModalButton: {
      backgroundColor: theme.primary,
    },
    cancelModalButtonText: {
      color: "#212121",
      fontWeight: "600",
    },
    confirmModalButtonText: {
      color: "white",
      fontWeight: "600",
    },
  });

export default RefundScreen;
