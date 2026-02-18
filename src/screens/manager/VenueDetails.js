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
  const { venueId } = route.params;

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchVenueDetails();
  };

  useEffect(() => {
    fetchVenueDetails();
  }, [venueId]);

  useFocusEffect(
    useCallback(() => {
      fetchVenueDetails();
    }, [venueId]),
  );

  const handleAddCourt = () => {
    navigation.navigate("AddCourt", {
      venueId,
      onCourtAdded: fetchVenueDetails,
    });
  };

  const handleEditVenue = () => {
    navigation.navigate("EditVenue", { venue });
  };

  const handleDeleteCourt = (courtId, courtName) => {
    Alert.alert(
      "Delete Court",
      `Are you sure you want to delete "${courtName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCourt(courtId);
            if (result.success) {
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
    navigation.navigate("CourtBookings", {
      courtId,
      courtName,
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <Text>Venue not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Venue Details</Text>
        <TouchableOpacity onPress={handleEditVenue}>
          <Icon name="create-outline" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Venue Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={18} color="#666" />
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
                <Icon name="bulb-outline" size={22} color="#FFC107" />
                <Text style={styles.facilityText}>Lights</Text>
              </View>
            )}
            {venue.facilities.parking && (
              <View style={styles.facilityItem}>
                <Icon name="car-outline" size={22} color="#4CAF50" />
                <Text style={styles.facilityText}>Parking</Text>
              </View>
            )}
            {venue.facilities.cafeteria && (
              <View style={styles.facilityItem}>
                <Icon name="restaurant-outline" size={22} color="#FF5722" />
                <Text style={styles.facilityText}>Cafeteria</Text>
              </View>
            )}
            {venue.facilities.coaching && (
              <View style={styles.facilityItem}>
                <Icon name="school-outline" size={22} color="#2196F3" />
                <Text style={styles.facilityText}>Coaching</Text>
              </View>
            )}
            {venue.facilities.sportsGoods && (
              <View style={styles.facilityItem}>
                <Icon name="tennisball-outline" size={22} color="#9C27B0" />
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
            <Icon name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Court</Text>
          </TouchableOpacity>
        </View>

        {courts.length === 0 ? (
          <View style={styles.emptyCourts}>
            <Icon name="sports-basketball" size={50} color="#ddd" />
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
                  color="#2196F3"
                  outline={false}
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
                  onPress={() =>
                    navigation.navigate("AddCourt", {
                      venueId: venue._id,
                      court: court, // Pass court data for editing
                      onCourtAdded: fetchVenueDetails, // Refresh after update
                    })
                  }
                >
                  <Icon name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCourt(court._id, court.name)}
                >
                  <Icon name="delete" size={20} color="#f44336" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  infoCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  venueName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  address: {
    fontSize: 15,
    color: "#666",
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
    color: "#888",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  facilityText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  noFacilities: {
    color: "#888",
    fontStyle: "italic",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
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
    color: "#888",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 5,
    textAlign: "center",
  },
  courtCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
    color: "#333",
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 5,
  },
  activeBadgeActive: {
    backgroundColor: "#E8F5E9",
  },
  activeBadgeInactive: {
    backgroundColor: "#FFEBEE",
  },
  editCourtButton: {
    marginLeft: 10,
    padding: 5,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "bold",
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
    color: "#666",
    fontWeight: "600",
  },
  price: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  courtActions: {
    flexDirection: "row",
  },
  viewBookingsButton: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    flex: 1,
  },
  viewBookingsText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});
