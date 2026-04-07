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
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const FavoritesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      Alert.alert("Error", "Failed to load favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const removeFromFavorites = async (venueId, venueName) => {
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
          onPress: async () => {
            try {
              await userAPI.removeFavorite(venueId);
              setFavorites(favorites.filter((item) => item._id !== venueId));
              Alert.alert("Success", `${venueName} removed from favorites`);
            } catch (error) {
              console.error("Error removing favorite:", error);
              Alert.alert("Error", "Failed to remove from favorites");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const handleImageError = (venueId) => {
    setImageErrors((prev) => ({ ...prev, [venueId]: true }));
  };

  const renderFavoriteCard = ({ item }) => {
    const hasImageError = imageErrors[item._id];

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() =>
          navigation.navigate("VenueDetail", { venueId: item._id })
        }
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 && !hasImageError ? (
            <Image
              source={{ uri: getImageUrl(item.images[0]) }}
              style={styles.venueImage}
              onError={() => handleImageError(item._id)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon icon="venues" size={40} color="#CCCCCC" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.ratingBadge}>
            <Icon icon="star" size={12} color="#FFC107" />
            <Text style={styles.ratingText}>
              {item.averageRating?.toFixed(1) || "4.0"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => removeFromFavorites(item._id, item.name)}
          >
            <Icon icon="favorite-filled" size={20} color="#FF4081" />
          </TouchableOpacity>
        </View>

        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{item.name}</Text>

          <View style={styles.locationContainer}>
            <Icon icon="location" size={14} color="#757575" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location?.address || "Location not specified"}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon icon="sports" size={14} color="#757575" />
              <Text style={styles.detailText}>
                {item.courtCount || 0} courts
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon icon="price" size={14} color="#757575" />
              <Text style={styles.detailText}>₹{item.priceFrom || 0}/hr</Text>
            </View>
          </View>

          {item.facilities && (
            <View style={styles.facilitiesContainer}>
              {item.facilities.lights && (
                <View style={styles.facilityTag}>
                  <Text style={styles.facilityText}>Floodlights</Text>
                </View>
              )}
              {item.facilities.parking && (
                <View style={styles.facilityTag}>
                  <Text style={styles.facilityText}>Parking</Text>
                </View>
              )}
              {item.facilities.cafeteria && (
                <View style={styles.facilityTag}>
                  <Text style={styles.facilityText}>Cafeteria</Text>
                </View>
              )}
              {item.facilities.coaching && (
                <View style={styles.facilityTag}>
                  <Text style={styles.facilityText}>Coaching</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
        onPress={() => navigation.navigate("UserTabs", { screen: "Home" })}
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
          keyExtractor={(item) => item._id}
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
  placeholderText: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
    textAlign: "center",
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
    flex: 1,
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
