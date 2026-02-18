import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getUserBookings } from "../../services/bookingService";
import { useAuth } from "../../contexts/AuthContext";

export default function UserDashboard({ navigation }) {
  const { userRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const result = await getUserBookings();
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingTitle}>
        Booking #{item._id.substring(0, 6)}
      </Text>
      <Text>Date: {item.date}</Text>
      <Text>
        Time: {item.startTime} - {item.endTime}
      </Text>
      <Text>Price: Rs {item.totalPrice}</Text>
      <Text
        style={[
          styles.status,
          item.status === "CONFIRMED"
            ? styles.statusConfirmed
            : styles.statusPending,
        ]}
      >
        Status: {item.status}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, User!</Text>
      <Text style={styles.sectionTitle}>Your Recent Bookings</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : bookings.length === 0 ? (
        <Text style={styles.noBookings}>
          No bookings yet. Create your first booking!
        </Text>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.newBookingBtn}
        onPress={() => navigation.navigate("NewBooking")}
      >
        <Text style={styles.newBookingText}>+ New Booking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
