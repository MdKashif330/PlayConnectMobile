import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  getCourtBookings,
  approveBooking,
  rejectBooking,
} from "../../services/bookingManagerService";

export default function CourtBookings() {
  const route = useRoute();
  const navigation = useNavigation();
  const { courtId, courtName } = route.params;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    const result = await getCourtBookings(courtId, "CONFIRMED"); // Only confirmed
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [courtId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View>
          <Text style={styles.bookingDate}>{formatDate(item.date)}</Text>
          <Text style={styles.timeText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Icon name="person" size={16} color="#666" />
        <Text style={styles.userText}> {item.user?.name}</Text>
        <Text style={styles.emailText}> ({item.user?.email})</Text>
      </View>

      <Text style={styles.priceText}>Rs {item.totalPrice}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courtName} - Approved Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No approved bookings yet</Text>
            <Text style={styles.emptySubText}>
              Approved bookings for this court will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  list: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
    color: "#555",
  },
  emailText: {
    fontSize: 13,
    color: "#888",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 5,
    textAlign: "center",
  },
});
