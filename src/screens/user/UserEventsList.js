import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { eventAPI } from "../../services/api";

const UserEventsList = ({ route }) => {
  const navigation = useNavigation();
  const { date: selectedDate } = route.params || {};

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("upcoming"); // upcoming, all, date

  const filters = [
    { id: "upcoming", label: "Upcoming" },
    { id: "all", label: "All Events" },
    { id: "date", label: "Selected Date" },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, []),
  );

  useEffect(() => {
    if (events.length > 0) {
      filterEvents();
    }
  }, [selectedFilter, selectedDate, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAllEvents({ limit: 50 });
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert(
        "Error",
        "Failed to load events. Please pull down to refresh.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterEvents = () => {
    let filtered = [];

    switch (selectedFilter) {
      case "upcoming":
        filtered = events.filter(
          (event) => new Date(event.startDate) >= new Date(),
        );
        break;
      case "date":
        if (selectedDate) {
          filtered = events.filter(
            (event) =>
              event.startDate?.startsWith(selectedDate) ||
              event.endDate?.startsWith(selectedDate),
          );
        } else {
          filtered = events;
        }
        break;
      case "all":
      default:
        filtered = events;
        break;
    }

    // Sort by date (soonest first)
    filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    setFilteredEvents(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "#2E7D32";
      case "ongoing":
        return "#2196F3";
      case "completed":
        return "#757575";
      case "cancelled":
        return "#F44336";
      default:
        return "#2E7D32";
    }
  };

  const EventCard = ({ event }) => {
    const [imageError, setImageError] = useState(false);
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const isSameDay = startDate.toDateString() === endDate.toDateString();

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
              <Icon icon="events" size={40} color="#CCCCCC" />
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(event.status) },
            ]}
          >
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventName}>{event.name}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Icon icon="calendar" size={14} color="#757575" />
              <Text style={styles.detailText}>
                {startDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {!isSameDay &&
                  ` - ${endDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon icon="location" size={14} color="#757575" />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.venue?.name || "TBD"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon icon="profile" size={14} color="#757575" />
              <Text style={styles.detailText}>
                {event.currentParticipants || 0}/{event.maxParticipants || 0}{" "}
                registered
              </Text>
            </View>

            {event.entryFee > 0 && (
              <View style={styles.detailRow}>
                <Icon icon="money" size={14} color="#757575" />
                <Text style={styles.detailText}>
                  Entry Fee: ₹{event.entryFee}
                </Text>
              </View>
            )}
          </View>

          {event.prize && (
            <View style={styles.prizeContainer}>
              <Icon icon="trophy" size={14} color="#FFC107" />
              <Text style={styles.prizeText} numberOfLines={1}>
                Prize: {event.prize}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter.id)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter.id && styles.filterButtonTextActive,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Events" />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <CustomHeader showBack title="Events" /> */}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          renderItem={({ item }) => <FilterButton filter={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Selected Date Indicator */}
      {selectedFilter === "date" && selectedDate && (
        <View style={styles.dateIndicator}>
          <Icon icon="calendar" size={16} color="#2E7D32" />
          <Text style={styles.dateIndicatorText}>
            Showing events for:{" "}
            {new Date(selectedDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon icon="events" size={60} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === "date" && selectedDate
                ? `No events scheduled for ${new Date(selectedDate).toLocaleDateString()}`
                : "There are no events available at the moment."}
            </Text>
            {selectedFilter === "date" && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => setSelectedFilter("upcoming")}
              >
                <Text style={styles.browseButtonText}>
                  View Upcoming Events
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
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
  filterBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: "#2E7D32",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  dateIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  dateIndicatorText: {
    fontSize: 14,
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventImageContainer: {
    height: 150,
    position: "relative",
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
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  eventContent: {
    padding: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 10,
  },
  eventDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
    flex: 1,
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  prizeText: {
    fontSize: 13,
    color: "#B76E00",
    marginLeft: 6,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UserEventsList;
