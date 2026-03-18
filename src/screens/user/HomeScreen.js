import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import LocationPicker from "../../components/user/LocationPicker";
import { venueAPI, eventAPI, bookingAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Configure calendar locale
LocaleConfig.locales["en"] = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};
LocaleConfig.defaultLocale = "en";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Location states
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    name: "All Locations",
    lat: null,
    lng: null,
    radius: 10,
  });

  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Calendar states
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookedDates, setBookedDates] = useState({});
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7));

  useEffect(() => {
    const checkToken = async () => {
      await AsyncStorage.getItem("token");
    };
    checkToken();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [selectedLocation]),
  );

  // Fetch booked dates when month changes
  useEffect(() => {
    if (!loading) {
      fetchBookedDates();
    }
  }, [currentMonth]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchVenues(), fetchEvents()]);
    setLoading(false);
  };

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);

      const params = { limit: 20 };

      if (selectedLocation.lat && selectedLocation.lng) {
        params.lat = selectedLocation.lat;
        params.lng = selectedLocation.lng;
        params.radius = selectedLocation.radius;
      }

      const response = await venueAPI.getAllPublicVenues(params);
      setVenues(response.data);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await eventAPI.getAllEvents({
        params: { limit: 5 },
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchBookedDates = async () => {
    try {
      setLoadingBookedDates(true);

      if (!user) {
        setBookedDates({});
        return;
      }

      const response = await bookingAPI.getBookedDates(currentMonth);
      setBookedDates(response.data || {});
    } catch (error) {
      console.error("Error fetching booked dates:", error);
      setBookedDates({});
    } finally {
      setLoadingBookedDates(false);
    }
  };

  // Generate marked dates for calendar
  const getMarkedDates = () => {
    const marked = {};

    // Mark today's date with a dot
    marked[today] = {
      marked: true,
      dotColor: "#2E7D32",
      selected: false,
    };

    // Mark the selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: "#2E7D32",
      marked: marked[selectedDate]?.marked || false,
    };

    // Add booked dates from API
    Object.keys(bookedDates).forEach((date) => {
      if (date !== today && date !== selectedDate) {
        marked[date] = {
          ...bookedDates[date],
          selected: false,
        };
      } else if (date === today) {
        // Merge today's marking with booked status
        marked[date] = {
          ...marked[date],
          ...bookedDates[date],
          marked: true,
          selected: date === selectedDate,
        };
      } else if (date === selectedDate) {
        // Merge selected date's marking with booked status
        marked[date] = {
          ...marked[date],
          ...bookedDates[date],
          selected: true,
          selectedColor: "#2E7D32",
        };
      }
    });

    return marked;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVenues(), fetchEvents(), fetchBookedDates()]);
    setRefreshing(false);
  };

  const handleLocationPress = () => {
    setLocationPickerVisible(true);
  };

  const handleLocationSelected = (locationData) => {
    setSelectedLocation(locationData);
  };

  const handleSeeAllVenues = () => {
    navigation.navigate("VenuesList", {
      location: selectedLocation,
    });
  };

  const handleSeeAllEvents = () => {
    navigation.navigate("EventsList");
  };

  const handleMonthChange = (month) => {
    const monthStr = `${month.year}-${String(month.month).padStart(2, "0")}`;
    setCurrentMonth(monthStr);
  };

  const handleDatePress = (day) => {
    setSelectedDate(day.dateString);

    Alert.alert(
      "Date Selected",
      `Selected: ${day.dateString}\nWhat would you like to do?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Browse Venues",
          onPress: () =>
            navigation.navigate("CreateBooking", {
              date: day.dateString,
              location: selectedLocation,
            }),
        },
        {
          text: "View Events",
          onPress: () =>
            navigation.navigate("UserEventsList", { date: day.dateString }),
        },
      ],
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const VenueCard = ({ venue }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.venueCard}
        onPress={() =>
          navigation.navigate("VenueDetail", { venueId: venue._id })
        }
        activeOpacity={0.9}
      >
        <View style={styles.venueImageContainer}>
          {venue.images && venue.images.length > 0 && !imageError ? (
            <Image
              source={{ uri: getImageUrl(venue.images[0]) }}
              style={styles.venueImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.venueImagePlaceholder}>
              <Icon icon="venues" size={40} color="#CCCCCC" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.ratingBadge}>
            <Icon icon="star" size={12} color="#FFC107" />
            <Text style={styles.ratingText}>
              {venue.averageRating ? venue.averageRating.toFixed(1) : "4.0"}
            </Text>
          </View>
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation} numberOfLines={1}>
            <Icon icon="location" size={12} color="#757575" />{" "}
            {venue.location?.address || "Location not specified"}
          </Text>
          <View style={styles.venueDetails}>
            <Text style={styles.courtCount}>
              {venue.courtCount || 0} courts
            </Text>
            <Text style={styles.priceFrom}>
              from ₹{venue.priceFrom || 0}/hr
            </Text>
          </View>
          {venue.distance && (
            <Text style={styles.distanceText}>
              {venue.distance.toFixed(1)} km away
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EventCard = ({ event }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("EventDetail", { eventId: event._id })
        }
        activeOpacity={0.9}
      >
        <View style={styles.eventImageContainer}>
          {event.venue?.images &&
          event.venue.images.length > 0 &&
          !imageError ? (
            <Image
              source={{ uri: getImageUrl(event.venue.images[0]) }}
              style={styles.eventImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Icon icon="events" size={30} color="#CCCCCC" />
            </View>
          )}
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.eventDate}>
            <Icon icon="calendar" size={12} color="#757575" />{" "}
            {new Date(event.startDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.eventVenue} numberOfLines={1}>
            <Icon icon="location" size={12} color="#757575" />{" "}
            {event.venue?.name || "TBD"}
          </Text>
          <View style={styles.eventParticipants}>
            <Icon icon="profile" size={12} color="#757575" />
            <Text style={styles.participantText}>
              {event.currentParticipants || 0}/{event.maxParticipants || 0}{" "}
              registered
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader title="PlayConnect" showNotifications showProfile />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="PlayConnect" showNotifications showProfile />

      {/* Location Selector */}
      <TouchableOpacity
        style={styles.locationSelector}
        onPress={handleLocationPress}
      >
        <Icon icon="location" size={20} color="#2E7D32" />
        <Text style={styles.locationText} numberOfLines={1}>
          {selectedLocation.name}{" "}
          {selectedLocation.lat ? `(${selectedLocation.radius} km)` : ""}
        </Text>
        <Icon icon="dropdown" size={20} color="#757575" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Nearby Venues Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedLocation.lat ? "Venues Near You" : "Popular Venues"}
            </Text>
            <TouchableOpacity onPress={handleSeeAllVenues}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingVenues ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color="#2E7D32" />
            </View>
          ) : venues.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={venues}
              renderItem={({ item }) => <VenueCard venue={item} />}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.venuesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon icon="venues" size={40} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                No venues found in this area
              </Text>
              <TouchableOpacity
                style={styles.adjustRadiusButton}
                onPress={handleLocationPress}
              >
                <Text style={styles.adjustRadiusText}>
                  Adjust Location/Radius
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upcoming Events Section */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={handleSeeAllEvents}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {loadingEvents ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color="#2E7D32" />
              </View>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={events}
                renderItem={({ item }) => <EventCard event={item} />}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.eventsList}
              />
            )}
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Your Bookings Calendar</Text>
          <View style={styles.calendarCard}>
            {loadingBookedDates ? (
              <ActivityIndicator
                size="small"
                color="#2E7D32"
                style={{ margin: 20 }}
              />
            ) : (
              <>
                <Calendar
                  current={selectedDate}
                  onDayPress={handleDatePress}
                  onMonthChange={handleMonthChange}
                  markedDates={getMarkedDates()}
                  markingType={"period"}
                  hideExtraDays={false}
                  disableMonthChange={false}
                  firstDay={1}
                  hideDayNames={false}
                  showWeekNumbers={false}
                  disableArrowLeft={false}
                  disableArrowRight={false}
                  disableAllTouchEventsForDisabledDays={true}
                  enableSwipeMonths={true}
                  theme={{
                    backgroundColor: "#FFFFFF",
                    calendarBackground: "#FFFFFF",
                    textSectionTitleColor: "#757575",
                    selectedDayBackgroundColor: "#2E7D32",
                    todayTextColor: "#2E7D32",
                    dayTextColor: "#212121",
                    textDisabledColor: "#E0E0E0",
                    dotColor: "#2E7D32",
                    selectedDotColor: "#FFFFFF",
                    arrowColor: "#2E7D32",
                    monthTextColor: "#212121",
                    indicatorColor: "#2E7D32",
                    textDayFontWeight: "400",
                    textMonthFontWeight: "600",
                    textDayHeaderFontWeight: "500",
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14,
                  }}
                />

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#2E7D32" }]}
                    />
                    <Text style={styles.legendText}>Confirmed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#FFC107" }]}
                    />
                    <Text style={styles.legendText}>Pending</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#2E7D32" }]}
                    />
                    <Text style={styles.legendText}>Today</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onLocationSelected={handleLocationSelected}
        currentLocation={selectedLocation}
      />
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
    backgroundColor: "#F5F5F5",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSection: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    marginLeft: 8,
    marginRight: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  seeAll: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  venuesList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  venueCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  venueImageContainer: {
    height: 150,
    position: "relative",
  },
  venueImage: {
    width: "100%",
    height: "100%",
  },
  venueImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#999999",
    marginTop: 4,
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  venueDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  courtCount: {
    fontSize: 14,
    color: "#757575",
  },
  priceFrom: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  distanceText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  eventsList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  eventCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventImageContainer: {
    height: 100,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  eventInfo: {
    padding: 10,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  eventParticipants: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantText: {
    fontSize: 11,
    color: "#757575",
    marginLeft: 4,
  },
  calendarSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    color: "#757575",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 10,
    marginBottom: 15,
    textAlign: "center",
  },
  adjustRadiusButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  adjustRadiusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default HomeScreen;
