import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import api from "../../services/api";

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/user/favorites');
      // setFavorites(response.data);

      // Mock data for now
      setTimeout(() => {
        setFavorites(mockFavorites);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const removeFromFavorites = (venueId, venueName) => {
    Alert.alert(
      "Remove from Favorites",
      `Are you sure you want to remove ${venueName} from your favorites?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            // TODO: Call API to remove from favorites
            // await api.delete(`/user/favorites/${venueId}`);

            // Update local state
            setFavorites(favorites.filter((item) => item.id !== venueId));
          },
          style: "destructive",
        },
      ],
    );
  };

  const renderFavoriteCard = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate("VenueDetail", { venueId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.venueImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon icon="venues" size={40} color="#CCCCCC" />
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Icon icon="star" size={12} color="#FFC107" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => removeFromFavorites(item.id, item.name)}
        >
          <Icon icon="favorite-filled" size={20} color="#FF4081" />
        </TouchableOpacity>
      </View>

      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>

        <View style={styles.locationContainer}>
          <Icon icon="location" size={14} color="#757575" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Icon icon="sports" size={14} color="#757575" />
            <Text style={styles.detailText}>{item.sports} sports</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon icon="price" size={14} color="#757575" />
            <Text style={styles.detailText}>₹{item.price}/hr</Text>
          </View>
        </View>

        <View style={styles.facilitiesContainer}>
          {item.facilities?.slice(0, 3).map((facility, index) => (
            <View key={index} style={styles.facilityTag}>
              <Text style={styles.facilityText}>{facility}</Text>
            </View>
          ))}
          {item.facilities?.length > 3 && (
            <Text style={styles.moreText}>+{item.facilities.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon icon="favorite" size={60} color="#CCCCCC" />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyText}>
        Start adding venues to your favorites by tapping the heart icon on venue
        details
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.browseButtonText}>Browse Venues</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader title="Favorites" showNotifications showProfile />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Favorites" showNotifications showProfile />

      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

// Mock data
const mockFavorites = [
  {
    id: 1,
    name: "Sports Complex A",
    location: "Downtown, City Center",
    rating: 4.5,
    price: "500",
    sports: 5,
    image: null,
    facilities: [
      "Parking",
      "Floodlights",
      "Changing Rooms",
      "Cafeteria",
      "Equipment Rental",
    ],
  },
  {
    id: 2,
    name: "Elite Badminton Arena",
    location: "North Side, Sports District",
    rating: 4.8,
    price: "400",
    sports: 2,
    image: null,
    facilities: ["Parking", "AC Courts", "Professional Flooring", "Coaching"],
  },
  {
    id: 3,
    name: "City Football Ground",
    location: "East End, Riverside",
    rating: 4.2,
    price: "800",
    sports: 1,
    image: null,
    facilities: ["Floodlights", "Parking", "Turf", "Spectator Seating"],
  },
  {
    id: 4,
    name: "Tennis World",
    location: "West Side, Sports Hub",
    rating: 4.6,
    price: "600",
    sports: 1,
    image: null,
    facilities: [
      "Clay Courts",
      "Hard Courts",
      "Coaching",
      "Pro Shop",
      "Parking",
    ],
  },
  {
    id: 5,
    name: "Grand Sports Hub",
    location: "Central District",
    rating: 4.7,
    price: "1000",
    sports: 8,
    image: null,
    facilities: [
      "Parking",
      "Cafeteria",
      "Gym",
      "Swimming Pool",
      "Spa",
      "Changing Rooms",
    ],
  },
];

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
  listContainer: {
    padding: 16,
  },
  favoriteCard: {
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
  imageContainer: {
    height: 180,
    position: "relative",
  },
  venueImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
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
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  venueInfo: {
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
  },
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  facilityTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  facilityText: {
    fontSize: 12,
    color: "#757575",
  },
  moreText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default FavoritesScreen;
