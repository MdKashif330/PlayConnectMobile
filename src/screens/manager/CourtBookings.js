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
import { useTheme } from "../../contexts/ThemeContext"; // Add this import

export default function CourtBookings() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme(); // Add this line
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

  // Create styles with theme
  const styles = createStyles(theme);

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
        <Icon name="person" size={16} color={theme.textSecondary} />
        <Text style={styles.userText}> {item.user?.name}</Text>
        <Text style={styles.emailText}> ({item.user?.email})</Text>
      </View>

      <Text style={styles.priceText}>Rs {item.totalPrice}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courtName} - Approved Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={60} color={theme.textSecondary} />
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

// Move styles to a function that accepts theme
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      flex: 1,
      marginHorizontal: 10,
    },
    list: {
      padding: 15,
    },
    bookingCard: {
      backgroundColor: theme.card,
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
      color: theme.text,
    },
    timeText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      backgroundColor: theme.success + "20", // Add transparency (20 = 12% opacity)
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.success,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    userText: {
      fontSize: 14,
      color: theme.text,
    },
    emailText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    priceText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.primary,
      marginTop: 5,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 50,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 10,
    },
    emptySubText: {
      fontSize: 14,
      color: theme.textSecondary + "80",
      marginTop: 5,
      textAlign: "center",
    },
  });
