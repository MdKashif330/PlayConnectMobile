import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import Icon from "../../components/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { refundAPI } from "../../services/api";

const RefundDetails = ({ route, navigation }) => {
  const { refundId } = route.params;
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const styles = createStyles(theme);

  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefundDetails();
  }, []);

  const fetchRefundDetails = async () => {
    try {
      const response = await refundAPI.getRefundById(refundId);
      setRefund(response.data.refund);
    } catch (error) {
      console.error("Error fetching refund details:", error);
      Alert.alert("Error", "Failed to load refund details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status, adminResponse) => {
    triggerVibration();
    setProcessing(true);
    try {
      await refundAPI.updateRefundStatus(refundId, { status, adminResponse });
      Alert.alert("Success", `Refund ${status.toLowerCase()} successfully`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update refund status");
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!refund) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Refund not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refund Request</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(refund.status) },
          ]}
        >
          <Text style={styles.statusText}>{refund.status}</Text>
        </View>
      </View>

      {/* Booking Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Booking ID:</Text>
          <Text style={styles.value}>
            {refund.booking?._id?.substring(0, 8)}...
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{refund.booking?.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{refund.booking?.displaySlot}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Court:</Text>
          <Text style={styles.value}>{refund.booking?.court?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>Rs {refund.amount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Booking Status:</Text>
          <Text style={styles.value}>{refund.bookingStatus}</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{refund.user?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{refund.user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>
            {refund.user?.phone || "Not provided"}
          </Text>
        </View>
      </View>

      {/* Refund Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Refund Request</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Reason:</Text>
          <Text style={styles.reasonText}>{refund.reason}</Text>
        </View>

        {refund.proofImage && (
          <View style={styles.proofSection}>
            <Text style={styles.label}>Payment Proof:</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ImageViewer", {
                  imageUrl: refund.proofImage,
                })
              }
            >
              <Image
                source={{ uri: refund.proofImage }}
                style={styles.proofImage}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* FIXED: Changed View to Text */}
        <Text style={styles.cardTitle}>Account Details for Refund</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Type:</Text>
          <Text style={styles.value}>{refund.accountDetails?.accountType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Number:</Text>
          <Text style={styles.value}>
            {refund.accountDetails?.accountNumber}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Holder:</Text>
          <Text style={styles.value}>
            {refund.accountDetails?.accountHolderName}
          </Text>
        </View>
      </View>

      {/* Admin Response */}
      {refund.adminResponse && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Response</Text>
          <Text style={styles.responseText}>{refund.adminResponse}</Text>
          <Text style={styles.responseDate}>
            Responded on: {new Date(refund.respondedAt).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Action Buttons (only if pending) */}
      {refund.status === "PENDING" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => {
              Alert.alert(
                "Approve Refund",
                "Are you sure you want to approve this refund?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Approve",
                    onPress: () =>
                      handleUpdateStatus(
                        "APPROVED",
                        "Refund approved. Amount will be transferred to your account.",
                      ),
                  },
                ],
              );
            }}
            disabled={processing}
          >
            <Text style={styles.buttonText}>Approve Refund</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => {
              Alert.alert(
                "Reject Refund",
                "Are you sure you want to reject this refund?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reject",
                    onPress: () =>
                      handleUpdateStatus(
                        "REJECTED",
                        "Refund request rejected. Please contact support for more information.",
                      ),
                  },
                ],
              );
            }}
            disabled={processing}
          >
            <Text style={styles.buttonText}>Reject Refund</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 12,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    label: {
      width: 120,
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    value: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    reasonText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },
    proofSection: {
      marginTop: 12,
      marginBottom: 12,
    },
    proofImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      marginTop: 8,
      resizeMode: "contain",
    },
    responseText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    responseDate: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 8,
      marginBottom: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    approveButton: {
      backgroundColor: "#4CAF50",
    },
    rejectButton: {
      backgroundColor: "#F44336",
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    errorText: {
      fontSize: 16,
      color: theme.danger,
    },
  });

export default RefundDetails;
