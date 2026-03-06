import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { getManagerEvents, deleteEvent } from "../../services/eventService";

export default function EventsList() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const styles = createStyles(theme);

  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' or 'ongoing'

  const fetchEvents = async () => {
    const result = await getManagerEvents();
    if (result.success) {
      setAllEvents(result.events || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Filter events based on current date
  useEffect(() => {
    const now = new Date();

    const filtered = allEvents.filter((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      if (activeTab === "upcoming") {
        // Upcoming: events that haven't started yet
        return startDate > now;
      } else {
        // Ongoing: events that are currently happening (started but not ended)
        return startDate <= now && endDate >= now;
      }
    });

    setFilteredEvents(filtered);
  }, [allEvents, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, []),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchEvents();
  };

  const handleDeleteEvent = (eventId, eventName) => {
    triggerVibration();
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            triggerVibration();
            const result = await deleteEvent(eventId);
            if (result.success) {
              Alert.alert("Success", "Event deleted successfully");
              fetchEvents();
            } else {
              Alert.alert("Error", result.message);
            }
          },
        },
      ],
    );
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (startDate > now) {
      return { text: "Upcoming", color: theme.success };
    } else if (startDate <= now && endDate >= now) {
      return { text: "Ongoing", color: theme.warning };
    } else {
      return { text: "Completed", color: theme.textSecondary };
    }
  };

  const renderEventItem = ({ item }) => {
    const status = getEventStatus(item);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("EventDetails", { eventId: item._id })
        }
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar-today" size={16} color={theme.primary} />
            <Text style={styles.detailText}>
              {new Date(item.startDate).toLocaleDateString()} -{" "}
              {new Date(item.endDate).toLocaleDateString()}
            </Text>
          </View>

          {item.prize ? (
            <View style={styles.detailRow}>
              <Icon name="emoji-events" size={16} color="#FFD700" />
              <Text style={styles.detailText}>{item.prize}</Text>
            </View>
          ) : null}

          {item.entryFee > 0 ? (
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>
                Entry Fee: Rs {item.entryFee}
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>Free Entry</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Icon name="people" size={16} color={theme.primary} />
            <Text style={styles.detailText}>
              {item.registeredParticipants?.length || 0} /{" "}
              {item.maxParticipants > 0 ? item.maxParticipants : "∞"}{" "}
              Participants
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              triggerVibration();
              navigation.navigate("EventForm", { event: item });
            }}
          >
            <Icon name="edit" size={18} color={theme.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteEvent(item._id, item.name)}
          >
            <Icon name="delete" size={18} color={theme.danger} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            triggerVibration();
            navigation.navigate("EventForm");
          }}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ongoing" && styles.activeTab]}
          onPress={() => setActiveTab("ongoing")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ongoing" && styles.activeTabText,
            ]}
          >
            Ongoing
          </Text>
        </TouchableOpacity>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={60} color={theme.textSecondary} />
          <Text style={styles.emptyText}>No {activeTab} events</Text>
          <Text style={styles.emptySubText}>
            {activeTab === "upcoming"
              ? "Create an event to get started"
              : "No events are currently running"}
          </Text>
          {activeTab === "upcoming" && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("EventForm")}
            >
              <Text style={styles.emptyButtonText}>+ Create Event</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
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
        />
      )}
    </View>
  );
}

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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    // Tab styles
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.card,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 20,
      marginHorizontal: 5,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    activeTabText: {
      color: "white",
    },
    list: {
      padding: 15,
    },
    eventCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      elevation: 2,
    },
    eventHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    eventName: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 10,
    },
    statusText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },
    eventDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    eventDetails: {
      marginBottom: 15,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    detailText: {
      fontSize: 14,
      color: theme.text,
      marginLeft: 8,
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 15,
    },
    editButtonText: {
      color: theme.primary,
      marginLeft: 5,
      fontSize: 14,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    deleteButtonText: {
      color: theme.danger,
      marginLeft: 5,
      fontSize: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.textSecondary,
      marginTop: 15,
      marginBottom: 5,
    },
    emptySubText: {
      fontSize: 14,
      color: theme.textSecondary + "80",
      textAlign: "center",
      marginBottom: 25,
    },
    emptyButton: {
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
  });
