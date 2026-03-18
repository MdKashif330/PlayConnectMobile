import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { venueAPI, userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const VenueDetailScreen = ({ navigation, route }) => {
  const { venueId } = route.params;
  const { user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

  useEffect(() => {
    fetchVenueDetails();
    checkIfFavorite();
  }, []);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const response = await venueAPI.getPublicVenueById(venueId);
      setVenue(response.data);
    } catch (error) {
      console.error("Error fetching venue details:", error);
      Alert.alert("Error", "Failed to load venue details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      setCheckingFavorite(true);
      const response = await userAPI.getFavorites();
      const favorites = response.data || [];
      const isFav = favorites.some((fav) => fav._id === venueId);
      setIsFavorite(isFav);
    } catch (error) {
      console.error("Error checking favorite:", error);
    } finally {
      setCheckingFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login to add venues to your favorites.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    try {
      if (isFavorite) {
        await userAPI.removeFavorite(venueId);
        setIsFavorite(false);
      } else {
        await userAPI.addFavorite(venueId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites. Please try again.");
    }
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
  };

  const handleBookNow = () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to make a booking.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    if (!selectedCourt) {
      Alert.alert("Select Court", "Please select a court to book");
      return;
    }

    navigation.navigate("CreateBooking", {
      venueId: venue._id,
      courtId: selectedCourt._id,
      venueName: venue.name,
      courtName: selectedCourt.name,
      price: selectedCourt.pricePerSlot,
    });
  };

  const handleDirections = () => {
    if (venue?.location?.latitude && venue?.location?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`;
      Linking.openURL(url);
    } else if (venue?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`;
      Linking.openURL(url);
    } else {
      Alert.alert(
        "Location Not Available",
        "No location information available for this venue.",
      );
    }
  };

  const handleCall = () => {
    // You would need to add phone number to venue schema or get from manager
    Alert.alert("Coming Soon", "Call feature will be available soon.");
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return "money";
      case "easypaisa":
        return "phone-android";
      case "jazzcash":
        return "phone-android";
      case "bank":
        return "account-balance";
      default:
        return "payment";
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case "cash":
        return "#4CAF50";
      case "easypaisa":
        return "#E91E63";
      case "jazzcash":
        return "#FF9800";
      case "bank":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  const renderFacilityIcon = (facility, available) => {
    if (!available) return null;

    const facilityIcons = {
      lights: { icon: "bulb", label: "Floodlights" },
      parking: { icon: "car", label: "Parking" },
      cafeteria: { icon: "cafe", label: "Cafeteria" },
      coaching: { icon: "school", label: "Coaching" },
      sportsGoods: { icon: "shirt", label: "Sports Goods" },
    };

    const facilityInfo = facilityIcons[facility];
    if (!facilityInfo) return null;

    return (
      <View style={styles.facilityIconItem}>
        <Icon icon={facilityInfo.icon} size={20} color="#2E7D32" />
        <Text style={styles.facilityIconLabel}>{facilityInfo.label}</Text>
      </View>
    );
  };

  const renderCourtCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.courtCard,
        selectedCourt?._id === item._id && styles.selectedCourtCard,
      ]}
      onPress={() => handleCourtSelect(item)}
    >
      <View style={styles.courtImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: getImageUrl(item.images[0]) }}
            style={styles.courtImage}
          />
        ) : (
          <View style={styles.courtImagePlaceholder}>
            <Icon icon="court" size={30} color="#CCCCCC" />
          </View>
        )}
      </View>
      <View style={styles.courtInfo}>
        <Text style={styles.courtName}>{item.name}</Text>
        <Text style={styles.courtSport}>{item.sportType}</Text>
        <View style={styles.courtPriceContainer}>
          <Text style={styles.courtPrice}>PKR {item.pricePerSlot}</Text>
          <Text style={styles.courtPriceUnit}>/hour</Text>
        </View>
      </View>
      {selectedCourt?._id === item._id && (
        <View style={styles.selectedIndicator}>
          <Icon icon="check" size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCourtDetails = () => {
    if (!selectedCourt) return null;

    return (
      <View style={styles.courtDetailsSection}>
        <View style={styles.courtDetailsHeader}>
          <Text style={styles.courtDetailsTitle}>Court Details</Text>
          <TouchableOpacity
            style={styles.changeCourtButton}
            onPress={() => setSelectedCourt(null)}
          >
            <Text style={styles.changeCourtText}>Change Court</Text>
          </TouchableOpacity>
        </View>

        {/* Court Images Gallery */}
        {selectedCourt.images && selectedCourt.images.length > 0 && (
          <View style={styles.courtImagesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={selectedCourt.images}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: getImageUrl(item) }}
                  style={styles.courtDetailImage}
                />
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        )}

        {/* Court Specifications */}
        <View style={styles.specsContainer}>
          <View style={styles.specRow}>
            <View style={styles.specItem}>
              <Icon icon="ruler" size={20} color="#2E7D32" />
              <Text style={styles.specLabel}>Length</Text>
              <Text style={styles.specValue}>
                {selectedCourt.dimensions?.length || "N/A"} ft
              </Text>
            </View>
            <View style={styles.specItem}>
              <Icon icon="ruler" size={20} color="#2E7D32" />
              <Text style={styles.specLabel}>Width</Text>
              <Text style={styles.specValue}>
                {selectedCourt.dimensions?.width || "N/A"} ft
              </Text>
            </View>
            <View style={styles.specItem}>
              <Icon icon="square" size={20} color="#2E7D32" />
              <Text style={styles.specLabel}>Total Area</Text>
              <Text style={styles.specValue}>
                {selectedCourt.dimensions?.totalArea || "N/A"} ft²
              </Text>
            </View>
          </View>
        </View>

        {/* Sport Type */}
        <View style={styles.detailRow}>
          <Icon icon="sports" size={18} color="#757575" />
          <Text style={styles.detailLabel}>Sport:</Text>
          <Text style={styles.detailValue}>{selectedCourt.sportType}</Text>
        </View>

        {/* Price */}
        <View style={styles.detailRow}>
          <Icon icon="price" size={18} color="#757575" />
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>
            PKR {selectedCourt.pricePerSlot}/hour
          </Text>
        </View>

        {/* Payment Methods */}
        {selectedCourt.paymentMethods &&
          selectedCourt.paymentMethods.length > 0 && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Accepted Payment Methods</Text>
              <View style={styles.paymentMethodsList}>
                {selectedCourt.paymentMethods.map((method, index) => (
                  <View key={index} style={styles.paymentMethodChip}>
                    <Icon
                      icon={getPaymentMethodIcon(method)}
                      size={14}
                      color={getPaymentMethodColor(method)}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        { color: getPaymentMethodColor(method) },
                      ]}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Account Details */}
        {selectedCourt.accountDetails && (
          <View style={styles.accountSection}>
            <Text style={styles.accountTitle}>Account Details</Text>

            {selectedCourt.accountDetails.bankName && (
              <View style={styles.accountRow}>
                <Icon icon="account-balance" size={16} color="#2196F3" />
                <Text style={styles.accountText}>
                  {selectedCourt.accountDetails.bankName} -{" "}
                  {selectedCourt.accountDetails.accountTitle} (
                  {selectedCourt.accountDetails.accountNumber})
                </Text>
              </View>
            )}

            {selectedCourt.accountDetails.easypaisaNumber && (
              <View style={styles.accountRow}>
                <Icon icon="phone-android" size={16} color="#E91E63" />
                <Text style={styles.accountText}>
                  EasyPaisa: {selectedCourt.accountDetails.easypaisaNumber}
                </Text>
              </View>
            )}

            {selectedCourt.accountDetails.jazzcashNumber && (
              <View style={styles.accountRow}>
                <Icon icon="phone-android" size={16} color="#FF9800" />
                <Text style={styles.accountText}>
                  JazzCash: {selectedCourt.accountDetails.jazzcashNumber}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomHeader showBack title="Venue Details" />
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.container}>
        <CustomHeader showBack title="Venue Details" />
        <View style={styles.errorContainer}>
          <Icon icon="venues" size={60} color="#CCCCCC" />
          <Text style={styles.errorText}>Venue not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <CustomHeader showBack title={venue?.name || "Venue Details"} /> */}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Venue Image Gallery */}
        <View style={styles.imageGallery}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={venue?.images?.length ? venue.images : [null]}
            renderItem={({ item }) => (
              <View style={styles.galleryImageContainer}>
                {item ? (
                  <Image
                    source={{ uri: getImageUrl(item) }}
                    style={styles.galleryImage}
                  />
                ) : (
                  <View style={styles.galleryPlaceholder}>
                    <Icon icon="venues" size={60} color="#CCCCCC" />
                  </View>
                )}
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            disabled={checkingFavorite}
          >
            <Icon
              icon={isFavorite ? "favorite-filled" : "favorite"}
              size={24}
              color={isFavorite ? "#FF4081" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Venue Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.venueName}>{venue?.name}</Text>
            <View style={styles.ratingContainer}>
              <Icon icon="star" size={16} color="#FFC107" />
              <Text style={styles.ratingText}>
                {venue?.averageRating?.toFixed(1) || "4.0"}
              </Text>
              <Text style={styles.reviewCount}>
                ({venue?.reviewCount || 0} reviews)
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{venue?.description}</Text>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationContainer}>
            <View style={styles.addressRow}>
              <Icon icon="location" size={18} color="#2E7D32" />
              <Text style={styles.addressText}>
                {venue?.location?.address ||
                  venue?.address ||
                  "Address not specified"}
              </Text>
            </View>

            {/* Coordinates if available */}
            {venue?.location?.latitude && venue?.location?.longitude && (
              <View style={styles.coordinatesRow}>
                <Icon icon="pin" size={16} color="#757575" />
                <Text style={styles.coordinatesText}>
                  {venue.location.latitude.toFixed(6)},{" "}
                  {venue.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.locationActions}>
              <TouchableOpacity
                style={styles.locationAction}
                onPress={handleDirections}
              >
                <Icon icon="navigate" size={20} color="#2E7D32" />
                <Text style={styles.locationActionText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.locationAction}
                onPress={handleCall}
              >
                <Icon icon="call" size={20} color="#2E7D32" />
                <Text style={styles.locationActionText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Venue Facilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Facilities</Text>
          <View style={styles.facilitiesIconsGrid}>
            {renderFacilityIcon("lights", venue?.facilities?.lights)}
            {renderFacilityIcon("parking", venue?.facilities?.parking)}
            {renderFacilityIcon("cafeteria", venue?.facilities?.cafeteria)}
            {renderFacilityIcon("coaching", venue?.facilities?.coaching)}
            {renderFacilityIcon("sportsGoods", venue?.facilities?.sportsGoods)}
          </View>
        </View>

        {/* Courts List */}
        {venue?.courts?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Courts</Text>
            <Text style={styles.selectHint}>Tap on a court to see details</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={venue.courts}
              renderItem={renderCourtCard}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.courtsList}
            />
          </View>
        )}

        {/* Selected Court Details */}
        {renderCourtDetails()}

        {/* Spacer for bottom button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Selected Court</Text>
          <Text style={styles.priceValue}>
            {selectedCourt ? selectedCourt.name : "None selected"}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedCourt && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={!selectedCourt}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 10,
  },
  imageGallery: {
    height: 250,
    position: "relative",
  },
  galleryImageContainer: {
    width: 400,
    height: 250,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  venueName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  locationContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#212121",
    marginLeft: 8,
    flex: 1,
  },
  coordinatesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 8,
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  locationAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationActionText: {
    fontSize: 14,
    color: "#2E7D32",
    marginLeft: 6,
    fontWeight: "500",
  },
  facilitiesIconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  facilityIconItem: {
    width: "33%",
    alignItems: "center",
    marginBottom: 12,
  },
  facilityIconLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    textAlign: "center",
  },
  selectHint: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 12,
    fontStyle: "italic",
  },
  courtsList: {
    paddingRight: 16,
  },
  courtCard: {
    width: 200,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCourtCard: {
    borderColor: "#2E7D32",
  },
  courtImageContainer: {
    height: 120,
  },
  courtImage: {
    width: "100%",
    height: "100%",
  },
  courtImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  courtInfo: {
    padding: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  courtSport: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  courtPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  courtPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  courtPriceUnit: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 2,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  courtDetailsSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  courtDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  courtDetailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  changeCourtButton: {
    padding: 6,
  },
  changeCourtText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  courtImagesContainer: {
    marginBottom: 16,
  },
  courtDetailImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  specsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  specItem: {
    alignItems: "center",
  },
  specLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  specValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
    flex: 1,
  },
  paymentSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  paymentMethodsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paymentMethodChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  paymentMethodText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  accountSection: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  accountText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceContainer: {
    flex: 1,
    marginRight: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  bookButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default VenueDetailScreen;
