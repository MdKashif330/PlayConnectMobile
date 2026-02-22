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
import Icon from "../../components/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { getVenueDetails, getVenueCourts } from "../../services/managerService";
import { deleteCourt } from "../../services/bookingManagerService";

export default function VenueDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line
  const { venueId } = route.params;

  // Create styles FIRST
  const styles = createStyles(theme);

  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const [venueResult, courtsResult] = await Promise.all([
        getVenueDetails(venueId),
        getVenueCourts(venueId),
      ]);

      if (venueResult.success) {
        setVenue(venueResult.venue);
      } else {
        Alert.alert("Error", venueResult.message);
      }

      if (courtsResult.success) {
        setCourts(courtsResult.courts);
      } else {
        Alert.alert("Error", courtsResult.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load venue details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        fetchVenueDetails();
      }
    }, [autoRefresh, venueId]),
  );

  const onRefresh = () => {
    triggerVibration(); // Vibration on refresh
    setRefreshing(true);
    fetchVenueDetails();
  };

  useEffect(() => {
    fetchVenueDetails();
  }, [venueId]);

  // Regular focus listener (always runs regardless of autoRefresh setting)
  useFocusEffect(
    useCallback(() => {
      if (!autoRefresh) {
        fetchVenueDetails();
      }
    }, [venueId, autoRefresh]),
  );

  const handleAddCourt = () => {
    triggerVibration(); // Vibration on add court
    navigation.navigate("AddCourt", {
      venueId,
      onCourtAdded: fetchVenueDetails,
    });
  };

  const handleEditVenue = () => {
    triggerVibration(); // Vibration on edit venue
    navigation.navigate("EditVenue", { venue });
  };

  const handleDeleteCourt = (courtId, courtName) => {
    triggerVibration(); // Vibration on delete button press
    Alert.alert(
      "Delete Court",
      `Are you sure you want to delete "${courtName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            triggerVibration(); // Vibration on confirm
            const result = await deleteCourt(courtId);
            if (result.success) {
              triggerVibration(); // Success vibration
              Alert.alert("Success", result.message);
              setCourts((prev) => prev.filter((c) => c._id !== courtId));
            } else {
              Alert.alert("Error", result.message);
            }
          },
        },
      ],
    );
  };

  const handleViewBookings = (courtId, courtName) => {
    triggerVibration(); // Vibration on view bookings
    navigation.navigate("CourtBookings", {
      courtId,
      courtName,
    });
  };

  const handleBackPress = () => {
    triggerVibration(); // Vibration on back
    navigation.goBack();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Venue not found</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Icon icon="back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Venue Details</Text>
        <TouchableOpacity onPress={handleEditVenue}>
          <Icon icon="edit" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Venue Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <View style={styles.infoRow}>
          <Icon icon="location" size={18} color={theme.textSecondary} />
          <Text style={styles.address}>
            {venue.location?.address || "No address provided"}
          </Text>
        </View>
        {venue.location?.latitude && venue.location?.longitude && (
          <View style={styles.coordinates}>
            <Text style={styles.coordText}>
              📍 Lat: {venue.location.latitude.toFixed(4)}
            </Text>
            <Text style={styles.coordText}>
              📍 Long: {venue.location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Facilities */}
      {venue.facilities && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilitiesGrid}>
            {venue.facilities.lights && (
              <View style={styles.facilityItem}>
                <Icon icon="lights" size={22} color="#FFC107" />
                <Text style={styles.facilityText}>Lights</Text>
              </View>
            )}
            {venue.facilities.parking && (
              <View style={styles.facilityItem}>
                <Icon icon="parking" size={22} color="#4CAF50" />
                <Text style={styles.facilityText}>Parking</Text>
              </View>
            )}
            {venue.facilities.cafeteria && (
              <View style={styles.facilityItem}>
                <Icon icon="cafeteria" size={22} color="#FF5722" />
                <Text style={styles.facilityText}>Cafeteria</Text>
              </View>
            )}
            {venue.facilities.coaching && (
              <View style={styles.facilityItem}>
                <Icon icon="coaching" size={22} color={theme.primary} />
                <Text style={styles.facilityText}>Coaching</Text>
              </View>
            )}
            {venue.facilities.sportsGoods && (
              <View style={styles.facilityItem}>
                <Icon icon="sportsGoods" size={22} color="#9C27B0" />
                <Text style={styles.facilityText}>Sports Goods</Text>
              </View>
            )}
            {Object.keys(venue.facilities).length === 0 && (
              <Text style={styles.noFacilities}>No facilities added</Text>
            )}
          </View>
        </View>
      )}

      {/* Courts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courts ({courts.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCourt}>
            <Icon icon="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Court</Text>
          </TouchableOpacity>
        </View>

        {courts.length === 0 ? (
          <View style={styles.emptyCourts}>
            <Icon icon="sports" size={50} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No courts yet</Text>
            <Text style={styles.emptySubText}>
              Add courts to start accepting bookings
            </Text>
          </View>
        ) : (
          courts.map((court) => (
            <View key={court._id} style={styles.courtCard}>
              <View style={styles.courtHeader}>
                <Icon
                  icon={
                    court.sportType === "badminton"
                      ? "badminton"
                      : court.sportType === "tennis"
                        ? "tennis"
                        : court.sportType === "cricket"
                          ? "cricket"
                          : court.sportType === "football"
                            ? "football"
                            : court.sportType === "basketball"
                              ? "basketball"
                              : "sports"
                  }
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.courtName}>{court.name}</Text>
                <View
                  style={[
                    styles.activeBadge,
                    court.isActive
                      ? styles.activeBadgeActive
                      : styles.activeBadgeInactive,
                  ]}
                >
                  <Text style={styles.activeText}>
                    {court.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editCourtButton}
                  onPress={() => {
                    triggerVibration(); // Vibration on edit court
                    navigation.navigate("AddCourt", {
                      venueId: venue._id,
                      court: court,
                      onCourtAdded: fetchVenueDetails,
                    });
                  }}
                >
                  <Icon icon="edit" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCourt(court._id, court.name)}
                >
                  <Icon icon="delete" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.courtDetails}>
                <Text style={styles.sportType}>
                  {court.sportType?.toUpperCase() || "UNKNOWN"}
                </Text>
                <Text style={styles.price}>Rs {court.pricePerSlot}/slot</Text>
              </View>
              <View style={styles.courtActions}>
                <TouchableOpacity
                  style={styles.viewBookingsButton}
                  onPress={() => handleViewBookings(court._id, court.name)}
                >
                  <Text style={styles.viewBookingsText}>View Bookings</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Venue Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{courts.length}</Text>
            <Text style={styles.statLabel}>Total Courts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {courts.filter((c) => c.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {courts.filter((c) => !c.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    infoCard: {
      backgroundColor: theme.card,
      margin: 15,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
    },
    venueName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 10,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    address: {
      fontSize: 15,
      color: theme.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    coordinates: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    coordText: {
      fontSize: 13,
      color: theme.textSecondary + "80", // 50% opacity
    },
    section: {
      backgroundColor: theme.card,
      marginHorizontal: 15,
      marginBottom: 15,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 15,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    facilitiesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    facilityItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      marginRight: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    facilityText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
    },
    noFacilities: {
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: "white",
      fontWeight: "bold",
      marginLeft: 5,
    },
    emptyCourts: {
      alignItems: "center",
      paddingVertical: 30,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 10,
    },
    emptySubText: {
      fontSize: 14,
      color: theme.textSecondary + "80", // 50% opacity
      marginTop: 5,
      textAlign: "center",
    },
    courtCard: {
      backgroundColor: theme.background,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    courtHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    courtName: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
      flex: 1,
      color: theme.text,
    },
    activeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 5,
    },
    activeBadgeActive: {
      backgroundColor: theme.success + "20", // 12% opacity
    },
    activeBadgeInactive: {
      backgroundColor: theme.danger + "20", // 12% opacity
    },
    activeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.text,
    },
    editCourtButton: {
      marginLeft: 10,
      padding: 5,
    },
    deleteButton: {
      marginLeft: 10,
      padding: 5,
    },
    courtDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sportType: {
      color: theme.textSecondary,
      fontWeight: "600",
    },
    price: {
      color: theme.primary,
      fontWeight: "bold",
    },
    courtActions: {
      flexDirection: "row",
    },
    viewBookingsButton: {
      backgroundColor: theme.primaryLight,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
      alignItems: "center",
      flex: 1,
    },
    viewBookingsText: {
      color: theme.primary,
      fontWeight: "600",
    },
    statsCard: {
      backgroundColor: theme.card,
      margin: 15,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
      marginBottom: 30,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 15,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 5,
    },
  });
