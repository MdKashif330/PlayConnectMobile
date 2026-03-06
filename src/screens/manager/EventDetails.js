import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { getEventDetails } from "../../services/eventService";

export default function EventDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { triggerVibration } = useAppSettings();
  const { eventId } = route.params;
  const styles = createStyles(theme);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEventDetails = async () => {
    const result = await getEventDetails(eventId);
    if (result.success) {
      setEvent(result.event);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchEventDetails();
    }, [eventId]),
  );

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchEventDetails();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return theme.success;
      case "ongoing":
        return theme.warning;
      case "completed":
        return theme.textSecondary;
      case "cancelled":
        return theme.danger;
      default:
        return theme.textSecondary;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EventForm", { event })}
        >
          <Icon name="edit" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.eventName}>{event.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(event.status) },
            ]}
          >
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>

        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Event Details</Text>

          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {new Date(event.startDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {new Date(event.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {event.prize ? (
            <View style={styles.infoRow}>
              <Icon name="emoji-events" size={20} color="#FFD700" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Prize</Text>
                <Text style={styles.infoValue}>{event.prize}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Icon name="attach-money" size={20} color="#4CAF50" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Entry Fee</Text>
              <Text style={styles.infoValue}>
                {event.entryFee > 0 ? `Rs ${event.entryFee}` : "Free"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="people" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Participants</Text>
              <Text style={styles.infoValue}>
                {event.registeredParticipants?.length || 0} /{" "}
                {event.maxParticipants || "∞"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Courts</Text>
          {event.courts?.map((court) => (
            <View key={court._id} style={styles.courtItem}>
              <Icon name="sports-tennis" size={16} color={theme.primary} />
              <Text style={styles.courtName}>{court.name}</Text>
              <Text style={styles.courtSport}>{court.sportType}</Text>
            </View>
          ))}
        </View>

        {event.registeredParticipants?.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Registered Participants</Text>
            {event.registeredParticipants.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <Icon name="person" size={16} color={theme.textSecondary} />
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.userId?.name || "Unknown"}
                  </Text>
                  <Text style={styles.participantEmail}>
                    {participant.userId?.email}
                  </Text>
                </View>
                <View
                  style={[
                    styles.paymentStatus,
                    {
                      backgroundColor:
                        participant.paymentStatus === "completed"
                          ? theme.success
                          : theme.warning,
                    },
                  ]}
                >
                  <Text style={styles.paymentStatusText}>
                    {participant.paymentStatus}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
    errorText: {
      color: theme.text,
      fontSize: 16,
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
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    content: {
      padding: 15,
    },
    titleSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    eventName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginLeft: 10,
    },
    statusText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },
    description: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 24,
      marginBottom: 20,
    },
    infoCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      elevation: 2,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 15,
    },
    infoRow: {
      flexDirection: "row",
      marginBottom: 15,
    },
    infoContent: {
      marginLeft: 15,
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    courtItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    courtName: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 10,
      flex: 1,
    },
    courtSport: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    participantItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    participantInfo: {
      flex: 1,
      marginLeft: 10,
    },
    participantName: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    participantEmail: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    paymentStatus: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    paymentStatusText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
    },
  });
