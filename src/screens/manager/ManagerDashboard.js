import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSettings } from "../../hooks/useAppSettings";
import { api, refundAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "../../components/Icon";

export default function ManagerDashboard({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();

  const styles = createStyles(theme);

  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
  });
  const [vacationDates, setVacationDates] = useState({});
  const [bookingsForDate, setBookingsForDate] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  // Refund states
  const [refundRequests, setRefundRequests] = useState([]);
  const [showRefundDropdown, setShowRefundDropdown] = useState(false);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchDashboardData();
        fetchRefundRequests();
      }
    }, [autoRefresh]),
  );

  // Helper function to fetch with auth token
  const fetchWithAuth = async (endpoint) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      throw error;
    }
  };

  // Fetch refund requests
  const fetchRefundRequests = async () => {
    setLoadingRefunds(true);
    try {
      const response = await refundAPI.getManagerRefunds();
      const pendingRefunds = (response.data.refunds || []).filter(
        (r) => r.status === "PENDING",
      );
      setRefundRequests(pendingRefunds);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoadingRefunds(false);
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      try {
        const statsData = await fetchWithAuth("/bookings/manager/stats");
        setStats({
          today: statsData.today || 0,
          week: statsData.week || 0,
        });
      } catch (statsError) {
        console.warn("Could not fetch stats:", statsError.message);
        setStats({ today: 0, week: 0 });
      }

      // Fetch vacations
      try {
        const vacationsData = await fetchWithAuth(`/vacations`);
        const vacationMarkedDates = {};
        if (vacationsData && Array.isArray(vacationsData)) {
          vacationsData.forEach((vacation) => {
            try {
              const start = new Date(vacation.startDate);
              const end = new Date(vacation.endDate);
              for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
              ) {
                const dateStr = d.toISOString().split("T")[0];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (d >= today) {
                  vacationMarkedDates[dateStr] = {
                    marked: true,
                    dotColor: theme.danger,
                    selectedDotColor: theme.danger,
                  };
                }
              }
            } catch (dateError) {
              console.warn("Invalid vacation dates:", vacation);
            }
          });
        }
        setVacationDates(vacationMarkedDates);
      } catch (vacationError) {
        console.warn("Could not fetch vacations:", vacationError.message);
        setVacationDates({});
      }

      // If a date is selected, fetch its bookings
      if (selectedDate) {
        fetchBookingsForDate(selectedDate);
      }
    } catch (error) {
      console.error("Error in fetchDashboardData:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings for a specific date
  const fetchBookingsForDate = async (date) => {
    try {
      const bookingsData = await fetchWithAuth(
        `/bookings/manager/date/${date}`,
      );
      setBookingsForDate(bookingsData || []);
    } catch (error) {
      console.error("Error fetching bookings for date:", error.message);
      setBookingsForDate([]);
    }
  };

  // Handle date selection
  const handleDayPress = (day) => {
    triggerVibration();
    setSelectedDate(day.dateString);
    fetchBookingsForDate(day.dateString);
  };

  // Update marked dates when vacations or selected date change
  useEffect(() => {
    const marked = { ...vacationDates };

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: theme.primary,
        selectedTextColor: "white",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    marked[today] = {
      ...marked[today],
      marked: true,
      dotColor: theme.success,
    };

    setMarkedDates(marked);
  }, [selectedDate, vacationDates]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
    fetchRefundRequests();
  }, []);

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchDashboardData();
    await fetchRefundRequests();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <Text style={styles.title}>Dashboard</Text>

        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.week}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Refund Cases Section */}
        <View style={styles.refundSection}>
          <TouchableOpacity
            style={styles.refundHeader}
            onPress={() => setShowRefundDropdown(!showRefundDropdown)}
          >
            <View style={styles.refundHeaderLeft}>
              <Icon icon="refund" size={22} color={theme.primary} />
              <Text style={styles.refundHeaderTitle}>Refund Cases</Text>
            </View>
            <View style={styles.refundHeaderRight}>
              {refundRequests.length > 0 && (
                <View style={styles.refundBadge}>
                  <Text style={styles.refundBadgeText}>
                    {refundRequests.length}
                  </Text>
                </View>
              )}
              <Icon
                icon={showRefundDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {showRefundDropdown && (
            <View style={styles.refundDropdown}>
              {loadingRefunds ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={styles.refundLoader}
                />
              ) : refundRequests.length === 0 ? (
                <Text style={styles.noRefundsText}>
                  No pending refund requests
                </Text>
              ) : (
                refundRequests.map((refund) => (
                  <TouchableOpacity
                    key={refund._id}
                    style={styles.refundItem}
                    onPress={() =>
                      navigation.navigate("RefundDetails", {
                        refundId: refund._id,
                      })
                    }
                  >
                    <View style={styles.refundItemLeft}>
                      <Icon icon="alert" size={18} color="#FF9800" />
                      <View>
                        <Text style={styles.refundItemTitle}>
                          Refund for Booking #
                          {refund.booking?._id?.substring(0, 6)}
                        </Text>
                        <Text style={styles.refundItemSubtitle}>
                          Amount: Rs {refund.amount} | User: {refund.user?.name}
                        </Text>
                      </View>
                    </View>
                    <Icon
                      icon="chevron-right"
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Calendar with Vacations */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Calendar & Vacations</Text>
          <Calendar
            current={new Date().toISOString().split("T")[0]}
            onDayPress={(day) => {
              const selectedDateObj = new Date(day.dateString);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (selectedDateObj < today) {
                Alert.alert(
                  "Cannot Select Past Date",
                  "Please select today or a future date.",
                  [{ text: "OK" }],
                );
                return;
              }

              handleDayPress(day);
            }}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: theme.primary,
              todayTextColor: theme.primary,
              arrowColor: theme.primary,
              dotColor: theme.danger,
              backgroundColor: theme.card,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.text,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
              textDisabledColor: theme.textSecondary + "50",
            }}
          />

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.success }]}
              />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.primary }]}
              />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.danger }]}
              />
              <Text style={styles.legendText}>Vacation</Text>
            </View>
          </View>
        </View>

        {/* Bookings for selected date */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            {selectedDate ? `Bookings for ${selectedDate}` : "Select a date"}
          </Text>

          {selectedDate ? (
            bookingsForDate.length > 0 ? (
              bookingsForDate.map((booking, index) => (
                <View key={index} style={styles.bookingCard}>
                  <Text style={styles.bookingTime}>
                    {booking.displaySlot ||
                      `${booking.startTime} - ${booking.endTime}`}
                    {booking.slotCount ? ` (${booking.slotCount} slots)` : ""}
                  </Text>
                  <Text style={styles.bookingText}>
                    Court: {booking.court?.name || "N/A"}
                  </Text>
                  <Text style={styles.bookingText}>
                    User: {booking.user?.name || "N/A"}
                  </Text>
                  <Text style={styles.bookingText}>
                    Status: {booking.status}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noBookings}>
                No bookings for this date
                {vacationDates[selectedDate] ? " (Vacation Day)" : ""}
              </Text>
            )
          ) : (
            <Text style={styles.hint}>
              Tap a date on calendar to view bookings
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      padding: 15,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 10,
      color: theme.textSecondary,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: theme.text,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    statItem: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
      flex: 1,
      marginHorizontal: 5,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 5,
    },
    // Refund Section Styles
    refundSection: {
      backgroundColor: theme.card,
      borderRadius: 10,
      marginBottom: 20,
      overflow: "hidden",
      elevation: 2,
    },
    refundHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      backgroundColor: theme.card,
    },
    refundHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    refundHeaderTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    refundHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    refundBadge: {
      backgroundColor: "#FF9800",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    refundBadgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },
    refundDropdown: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingVertical: 8,
    },
    refundLoader: {
      padding: 20,
    },
    noRefundsText: {
      textAlign: "center",
      padding: 20,
      color: theme.textSecondary,
      fontSize: 14,
    },
    refundItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    refundItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    refundItemTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },
    refundItemSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    calendarContainer: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 15,
      color: theme.text,
    },
    legendContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    bookingsSection: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      elevation: 2,
    },
    bookingCard: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    bookingTime: {
      fontWeight: "bold",
      fontSize: 16,
      color: theme.primary,
      marginBottom: 5,
    },
    bookingText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 2,
    },
    noBookings: {
      textAlign: "center",
      color: theme.textSecondary,
      fontStyle: "italic",
      paddingVertical: 20,
    },
    hint: {
      textAlign: "center",
      color: theme.textSecondary + "80",
      paddingVertical: 20,
    },
  });
