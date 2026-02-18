import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ManagerDashboard() {
  const { user } = useAuth();
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

      // Fetch vacations - endpoint is /vacations (uses auth token)
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

                // Check if this vacation date is today or in the future
                if (d >= today) {
                  vacationMarkedDates[dateStr] = {
                    marked: true,
                    dotColor: "#FF6B6B",
                    selectedDotColor: "#FF6B6B",
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
    setSelectedDate(day.dateString);
    fetchBookingsForDate(day.dateString);
  };

  // Update marked dates when vacations or selected date change
  useEffect(() => {
    const marked = { ...vacationDates };

    // Add selected date highlight
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#2196F3",
        selectedTextColor: "white",
      };
    }

    // Add today marker
    const today = new Date().toISOString().split("T")[0];
    marked[today] = {
      ...marked[today],
      marked: true,
      dotColor: "#4CAF50",
    };

    setMarkedDates(marked);
  }, [selectedDate, vacationDates]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

        {/* Calendar with Vacations */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Calendar & Vacations</Text>
          <Calendar
            current={new Date().toISOString().split("T")[0]}
            // No minDate - all dates look normal
            onDayPress={(day) => {
              const selectedDate = new Date(day.dateString);
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Start of today

              // Prevent selection of past dates
              if (selectedDate < today) {
                Alert.alert(
                  "Cannot Select Past Date",
                  "Please select today or a future date.",
                  [{ text: "OK" }],
                );
                return; // Don't proceed
              }

              // If date is today or future, process normally
              handleDayPress(day);
            }}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: "#2196F3",
              todayTextColor: "#2196F3",
              arrowColor: "#2196F3",
              dotColor: "#FF6B6B",
              // No textDisabledColor
            }}
          />

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#2196F3" }]}
              />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]}
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
                  <Text>Court: {booking.court?.name || "N/A"}</Text>
                  <Text>User: {booking.user?.name || "N/A"}</Text>
                  <Text>Status: {booking.status}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: "white",
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
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
    color: "#666",
  },
  bookingsSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  bookingCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  bookingTime: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2196F3",
  },
  noBookings: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  hint: {
    textAlign: "center",
    color: "#aaa",
    paddingVertical: 20,
  },
});
