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
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Icon from "../../components/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import
import {
  getManagerFutureBookingsByStatus,
  getManagerBookingHistory,
  getManagerReservations,
  approveBooking,
  rejectBooking,
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

// ========== Unapproved Tab ==========
const UnapprovedBookings = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUnapprovedBookings = async () => {
    setLoading(true);
    const result = await getManagerFutureBookingsByStatus("PENDING");
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
  };

  // Auto-refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchUnapprovedBookings();
      } else {
        fetchUnapprovedBookings();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration(); // Vibration on refresh
    setRefreshing(true);
    await fetchUnapprovedBookings();
    setRefreshing(false);
  };

  const handleApprove = async (bookingId) => {
    triggerVibration(); // Vibration on approve
    const result = await approveBooking(bookingId);
    if (result.success) {
      triggerVibration(); // Success vibration
      Alert.alert("Success", result.message);
      fetchUnapprovedBookings();
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleReject = async (bookingId) => {
    triggerVibration(); // Vibration on reject
    const result = await rejectBooking(bookingId);
    if (result.success) {
      triggerVibration(); // Success vibration
      Alert.alert("Success", result.message);
      fetchUnapprovedBookings();
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingId}>Booking #{item._id.substring(0, 6)}</Text>
      <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
      <Text style={styles.bookingText}>
        Date: {item.date} |{" "}
        {item.displaySlot || `${item.startTime}-${item.endTime}`}
        {item.slotCount ? ` (${item.slotCount} slots)` : ""}
      </Text>
      <Text style={styles.bookingText}>
        User: {item.user?.name} ({item.user?.email})
      </Text>
      <Text style={styles.priceText}>Amount: Rs {item.totalPrice}</Text>
      {isMultiDayBooking(item) && (
        <View style={styles.multiDayBadge}>
          <Text style={styles.multiDayText}>⏳ Multi‑day reservation</Text>
        </View>
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item._id)}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item._id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
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
        Unapproved Bookings (Current + Future)
      </Text>

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
  );
};

// ========== Approved Tab ==========
const ApprovedBookings = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const styles = createStyles(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApprovedBookings = async () => {
    setLoading(true);
    const result = await getManagerFutureBookingsByStatus("CONFIRMED");
    if (result.success) {
      setBookings(result.bookings || []);
    }
    setLoading(false);
  };

  // Auto-refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchApprovedBookings();
      } else {
        fetchApprovedBookings();
      }
    }, [autoRefresh]),
  );

  const onRefresh = async () => {
    triggerVibration(); // Vibration on refresh
    setRefreshing(true);
    await fetchApprovedBookings();
    setRefreshing(false);
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingId}>Booking #{item._id.substring(0, 6)}</Text>
      <Text style={styles.bookingText}>Court: {item.court?.name}</Text>
      <Text style={styles.bookingText}>
        Date: {item.date} |{" "}
        {item.displaySlot || `${item.startTime}-${item.endTime}`}
        {item.slotCount ? ` (${item.slotCount} slots)` : ""}
      </Text>
      <Text style={styles.bookingText}>User: {item.user?.name}</Text>
      <Text style={styles.statusApproved}>Status: CONFIRMED</Text>
      {isMultiDayBooking(item) && (
        <View style={styles.multiDayBadge}>
          <Text style={styles.multiDayText}>⏳ Multi‑day reservation</Text>
        </View>
      )}
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
      <Text style={styles.tabTitle}>Approved Bookings (Current + Future)</Text>

      {bookings.length === 0 ? (
        <TouchableOpacity onPress={onRefresh} style={styles.emptyState}>
          <Text style={styles.emptyText}>No approved bookings</Text>
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

// ========== Reservations Tab ==========
const Reservations = () => {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
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

  // Auto-refresh when tab comes into focus
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
    triggerVibration(); // Vibration on refresh
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
          Date: {item.date} |{" "}
          {item.displaySlot || `${item.startTime}-${item.endTime}`}
          {item.slotCount ? ` (${item.slotCount} slots)` : ""}
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
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
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

  // Auto-refresh when tab comes into focus
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
    triggerVibration(); // Vibration on refresh
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
          Date: {item.date} |{" "}
          {item.displaySlot || `${item.startTime}-${item.endTime}`}
          {item.slotCount ? ` (${item.slotCount} slots)` : ""}
        </Text>
        <Text style={styles.bookingText}>User: {item.user?.name}</Text>
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
  const { triggerVibration } = useAppSettings(); // Add this line
  const styles = createStyles(theme);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "unapproved", title: "Unapproved" },
    { key: "approved", title: "Approved" },
    { key: "reservations", title: "Reservations" },
    { key: "history", title: "History" },
  ]);

  const handleTabChange = (newIndex) => {
    triggerVibration(); // Vibration on tab change
    setIndex(newIndex);
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      onTabPress={() => triggerVibration()} // Vibration on tab press
      indicatorStyle={[styles.indicator, { backgroundColor: theme.primary }]}
      style={styles.tabBar}
      labelStyle={styles.label}
      activeColor={theme.primary}
      inactiveColor={theme.textSecondary}
      scrollEnabled
    />
  );

  const renderScene = SceneMap({
    unapproved: UnapprovedBookings,
    approved: ApprovedBookings,
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
          triggerVibration(); // Vibration on plus button
          navigation.navigate("CreateBooking");
        }}
      >
        <Icon icon="add" size={28} color="white" />
      </TouchableOpacity>
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
    statusApproved: {
      color: theme.success,
      fontWeight: "bold",
      marginTop: 5,
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
    actionButtons: {
      flexDirection: "row",
      marginTop: 10,
      justifyContent: "space-between",
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
      alignItems: "center",
      flex: 1,
      marginHorizontal: 5,
    },
    approveButton: {
      backgroundColor: theme.success,
    },
    rejectButton: {
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
  });
