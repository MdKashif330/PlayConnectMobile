import React, { useState, useEffect } from "react";
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
import { getManagerVenues } from "../../services/managerService";

export default function ManagerVenues({ navigation }) {
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchVenues();
    });

    fetchVenues();

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVenues();
  };

  const handleVenuePress = (venue) => {
    Alert.alert(venue.name, "Choose an action", [
      {
        text: "View Details",
        onPress: () =>
          navigation.navigate("VenueDetails", {
            venueId: venue._id,
            venue: venue,
          }),
      },
      {
        text: "Edit Venue",
        onPress: () =>
          navigation.navigate("AddVenue", {
            venue: venue,
            onVenueUpdated: fetchVenues,
          }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderVenueItem = ({ item }) => (
    <View style={styles.venueCard}>
      <TouchableOpacity
        style={styles.venueContent}
        onPress={() =>
          navigation.navigate("VenueDetails", {
            venueId: item._id,
            venue: item,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.venueHeader}>
          <Icon name="place" size={24} color="#2196F3" />
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

      {/* Edit button - separate from main card press */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() =>
          navigation.navigate("AddVenue", {
            venue: item,
            onVenueUpdated: fetchVenues,
          })
        }
      >
        <Icon name="edit" size={20} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Venues</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate("AddVenue", {
              onVenueAdded: fetchVenues,
            })
          }
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {venues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No venues yet</Text>
          <Text style={styles.emptySubText}>
            Add your first venue to start accepting bookings
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() =>
              navigation.navigate("AddVenue", {
                onVenueAdded: fetchVenues,
              })
            }
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#2196F3",
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
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    color: "#333",
    flex: 1,
  },
  editIcon: {
    marginLeft: 10,
  },
  venueAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  facilities: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  facility: {
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 5,
    fontSize: 12,
    color: "#2196F3",
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
    color: "#666",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 25,
  },
  emptyButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  venueCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative", // For absolute positioning of edit button
  },
  venueContent: {
    padding: 15,
  },
  editButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 8,
    backgroundColor: "#f0f8ff",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
