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
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { getManagerVenues, deleteVenue } from "../../services/managerService"; // Add deleteVenue import

export default function ManagerVenues({ navigation }) {
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings();

  const styles = createStyles(theme);

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVenues = async () => {
    const result = await getManagerVenues();
    if (result.success) {
      setVenues(result.venues || []);
    } else {
      Alert.alert("Error", result.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchVenues();
      }
    }, [autoRefresh]),
  );

  // Regular focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!autoRefresh) {
        fetchVenues();
      }
    });

    fetchVenues();

    return unsubscribe;
  }, [navigation, autoRefresh]);

  const onRefresh = async () => {
    triggerVibration();
    setRefreshing(true);
    await fetchVenues();
  };

  // Handle delete venue
  const handleDeleteVenue = (venueId, venueName) => {
    triggerVibration();
    Alert.alert(
      "Delete Venue",
      `Are you sure you want to delete "${venueName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            triggerVibration();
            try {
              const result = await deleteVenue(venueId);
              if (result.success) {
                triggerVibration();
                Alert.alert("Success", "Venue deleted successfully");
                fetchVenues(); // Refresh the list
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Delete venue error:", error);
              Alert.alert("Error", "Failed to delete venue");
            }
          },
        },
      ],
    );
  };

  const renderVenueItem = ({ item }) => (
    <View style={styles.venueCard}>
      <TouchableOpacity
        style={styles.venueContent}
        onPress={() => {
          triggerVibration();
          navigation.navigate("VenueDetails", {
            venueId: item._id,
            venue: item,
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.venueHeader}>
          <Icon name="place" size={24} color={theme.primary} />
          <Text style={styles.venueName}>{item.name}</Text>
        </View>
        <Text style={styles.venueAddress}>{item.location?.address}</Text>
        <View style={styles.facilities}>
          {item.facilities?.lights && (
            <Text style={styles.facility}>💡 Lights</Text>
          )}
          {item.facilities?.parking && (
            <Text style={styles.facility}>🅿️ Parking</Text>
          )}
          {item.facilities?.cafeteria && (
            <Text style={styles.facility}>☕ Cafeteria</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons Container */}
      <View style={styles.actionButtons}>
        {/* Edit button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            triggerVibration();
            navigation.navigate("AddVenue", {
              venue: item,
              onVenueUpdated: fetchVenues,
            });
          }}
        >
          <Icon name="edit" size={18} color={theme.primary} />
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVenue(item._id, item.name)}
        >
          <Icon name="delete" size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleAddVenue = () => {
    triggerVibration();
    navigation.navigate("AddVenue", {
      onVenueAdded: fetchVenues,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Venues</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAddVenue}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {venues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" size={60} color={theme.textSecondary} />
          <Text style={styles.emptyText}>No venues yet</Text>
          <Text style={styles.emptySubText}>
            Add your first venue to start accepting bookings
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            onPress={handleAddVenue}
          >
            <Text style={styles.emptyButtonText}>+ Add Venue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={venues}
          renderItem={renderVenueItem}
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

// Updated styles
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
    list: {
      padding: 15,
    },
    venueCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 15,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      position: "relative",
    },
    venueContent: {
      padding: 15,
      paddingRight: 80, // Make space for action buttons
    },
    venueHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    venueName: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 10,
      color: theme.text,
      flex: 1,
    },
    venueAddress: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    facilities: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    facility: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 5,
      fontSize: 12,
      color: theme.primary,
    },
    actionButtons: {
      position: "absolute",
      top: 15,
      right: 15,
      flexDirection: "row",
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    editButton: {
      backgroundColor: theme.primaryLight,
    },
    deleteButton: {
      backgroundColor: theme.danger + "20", // Light red background
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
