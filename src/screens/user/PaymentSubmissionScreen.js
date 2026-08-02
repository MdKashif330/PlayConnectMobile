import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const PaymentSubmissionScreen = ({ navigation, route }) => {
  const { bookingId, bookingDetails } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [accountDetails, setAccountDetails] = useState({});
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}/payment-methods`);
      setPaymentMethods(response.data.paymentMethods || ["cash"]);
      setAccountDetails(response.data.accountDetails || {});
      setSelectedMethod(response.data.paymentMethods?.[0] || "cash");
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      Alert.alert("Error", "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant permission to access your gallery",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
      setPaymentProof(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant permission to access your camera",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
      setPaymentProof(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!paymentProof) {
      Alert.alert("Error", "Please upload payment screenshot");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("paymentMethod", selectedMethod);
      formData.append("paymentProof", {
        uri: paymentProof.uri,
        type: "image/jpeg",
        name: `payment_${Date.now()}.jpg`,
      });

      await api.post(`/bookings/${bookingId}/submit-payment`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert(
        "Payment Submitted",
        "Your payment proof has been submitted. The manager will verify it and confirm your booking.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("UserTabs", { screen: "Bookings" }),
          },
        ],
      );
    } catch (error) {
      console.error("Error submitting payment:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit payment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentMethodDetails = (method) => {
    switch (method) {
      case "easypaisa":
        return {
          icon: "phone-android",
          label: "EasyPaisa",
          number: accountDetails.easypaisaNumber,
          details: "Send payment to this EasyPaisa number",
          color: "#E91E63",
        };
      case "jazzcash":
        return {
          icon: "phone-android",
          label: "JazzCash",
          number: accountDetails.jazzcashNumber,
          details: "Send payment to this JazzCash number",
          color: "#FF9800",
        };
      case "bank":
        return {
          icon: "account-balance",
          label: "Bank Transfer",
          details: `${accountDetails.bankName || "Bank"} - ${accountDetails.accountTitle || "Account Title"} (${accountDetails.accountNumber || "Account Number"})`,
          color: "#2196F3",
        };
      default:
        return {
          icon: "money",
          label: "Cash",
          details: "Pay at the venue on the day of booking",
          color: "#4CAF50",
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Make Payment" />
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader showBack title="Make Payment" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <Text style={styles.summaryText}>
            Venue: {bookingDetails?.venueName}
          </Text>
          <Text style={styles.summaryText}>
            Court: {bookingDetails?.courtName}
          </Text>
          <Text style={styles.summaryText}>Date: {bookingDetails?.date}</Text>
          <Text style={styles.summaryText}>Time: {bookingDetails?.time}</Text>
          <Text style={styles.summaryAmount}>
            Amount: PKR {bookingDetails?.amount}
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map((method) => {
            const details = getPaymentMethodDetails(method);
            return (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodCard,
                  selectedMethod === method && styles.selectedPaymentMethod,
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                <View style={styles.paymentMethodHeader}>
                  <Icon icon={details.icon} size={24} color={details.color} />
                  <Text style={styles.paymentMethodName}>{details.label}</Text>
                  {selectedMethod === method && (
                    <Icon icon="check" size={20} color="#2E7D32" />
                  )}
                </View>
                {details.number && (
                  <Text style={styles.paymentMethodNumber}>
                    {details.details}: {details.number}
                  </Text>
                )}
                {details.details && !details.number && (
                  <Text style={styles.paymentMethodDetails}>
                    {details.details}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Proof Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Screenshot *</Text>
          <Text style={styles.sectionSubtitle}>
            Upload a screenshot of your payment confirmation
          </Text>

          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Icon icon="camera" size={20} color="#2E7D32" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Icon icon="gallery" size={20} color="#2E7D32" />
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          {proofImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: proofImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => {
                  setProofImage(null);
                  setPaymentProof(null);
                }}
              >
                <Icon icon="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!paymentProof || submitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!paymentProof || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment Proof</Text>
          )}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 8,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 12,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginLeft: 8,
  },
  paymentMethodNumber: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    marginLeft: 32,
  },
  paymentMethodDetails: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    marginLeft: 32,
  },
  uploadButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#2E7D32",
    marginLeft: 8,
  },
  previewContainer: {
    marginTop: 16,
    position: "relative",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentSubmissionScreen;
