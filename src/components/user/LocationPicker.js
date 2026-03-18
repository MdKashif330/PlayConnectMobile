import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Slider from "@react-native-community/slider";
import Icon from "../Icon";
import * as Location from "expo-location";

const LocationPicker = ({
  visible,
  onClose,
  onLocationSelected,
  currentLocation,
}) => {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(currentLocation?.radius || 10);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    currentLocation?.lat && currentLocation?.lng
      ? {
          name: currentLocation.name || "Selected Location",
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          address: currentLocation.address || "",
        }
      : null,
  );
  const [address, setAddress] = useState(currentLocation?.address || "");
  const [mapRegion, setMapRegion] = useState(
    currentLocation?.lat && currentLocation?.lng
      ? {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      : {
          latitude: 31.5204, // Default to Lahore, Pakistan
          longitude: 74.3587,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
  );
  const [markerCoordinate, setMarkerCoordinate] = useState(
    currentLocation?.lat && currentLocation?.lng
      ? {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        }
      : null,
  );

  useEffect(() => {
    if (visible) {
      if (currentLocation?.lat && currentLocation?.lng) {
        // Use existing location if available
        setSelectedLocation(currentLocation);
        setAddress(currentLocation.address || "");
        setMarkerCoordinate({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        });
        setMapRegion({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else {
        // Get current location on open
        getCurrentLocation();
      }
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location.",
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addressString = addressResult
        ? `${addressResult.city || ""}, ${addressResult.region || ""}`
        : "Current Location";

      const locationData = {
        name: addressString,
        lat: latitude,
        lng: longitude,
        address: addressResult,
      };

      setSelectedLocation(locationData);
      setAddress(addressString);
      setMarkerCoordinate({ latitude, longitude });

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setMapRegion(newRegion);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowResults(true);

    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            "User-Agent": "PlayConnectApp/1.0",
          },
        },
      );
      const data = await response.json();

      const results = data.map((item) => ({
        name: item.display_name.split(",")[0],
        fullAddress: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Error", "Failed to search location");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (location) => {
    setSelectedLocation(location);
    setAddress(location.fullAddress);
    setMarkerCoordinate({
      latitude: location.lat,
      longitude: location.lng,
    });

    const newRegion = {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setMapRegion(newRegion);

    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }

    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setMarkerCoordinate({ latitude, longitude });

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: mapRegion.latitudeDelta,
          longitudeDelta: mapRegion.longitudeDelta,
        },
        500,
      );
    }

    // Reverse geocode to get address
    reverseGeocode(latitude, longitude);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const addressString = addressResult
        ? `${addressResult.city || ""}, ${addressResult.region || ""}`
        : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      setAddress(addressString);
      setSelectedLocation({
        name: addressString,
        lat: lat,
        lng: lng,
        address: addressResult,
      });
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setSelectedLocation({
        name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat: lat,
        lng: lng,
        address: null,
      });
    }
  };

  const handleClearFilters = () => {
    setSelectedLocation(null);
    setMarkerCoordinate(null);
    setAddress("");
    setRadius(10);
    setMapRegion({
      latitude: 31.5204,
      longitude: 74.3587,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected({
        name: selectedLocation.name || "Selected Location",
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address,
        radius: radius,
      });
    } else {
      // If no location selected, just pass radius (show all venues)
      onLocationSelected({
        name: "All Locations",
        lat: null,
        lng: null,
        radius: radius,
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon icon="close" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity onPress={getCurrentLocation}>
            <Icon icon="location" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon icon="search" size={20} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a city or area..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchLocation}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon icon="close" size={20} color="#757575" />
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <ActivityIndicator
              size="small"
              color="#2E7D32"
              style={styles.searchLoader}
            />
          )}

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <Icon icon="location" size={16} color="#2E7D32" />
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>
                        {item.fullAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Map */}
        {loading && !markerCoordinate ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            provider={PROVIDER_DEFAULT}
          >
            {markerCoordinate && (
              <Marker
                coordinate={markerCoordinate}
                draggable
                onDragEnd={(e) => handleMapPress(e)}
              />
            )}
          </MapView>
        )}

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          {/* Address Display */}
          {address ? (
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          ) : (
            <Text style={styles.addressPlaceholder}>
              Tap on map or search to select location
            </Text>
          )}

          {/* Coordinates */}
          {markerCoordinate && (
            <View style={styles.coordinates}>
              <Text style={styles.coordText}>
                Lat: {markerCoordinate.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                Lng: {markerCoordinate.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Radius Selector */}
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusLabel}>Search Radius: {radius} km</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor="#2E7D32"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#2E7D32"
            />
            <View style={styles.radiusValues}>
              <Text style={styles.radiusMin}>1 km</Text>
              <Text style={styles.radiusMax}>50 km</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Apply Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: "#212121",
    padding: 0,
  },
  searchLoader: {
    marginTop: 10,
  },
  resultsContainer: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    maxHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 12,
    color: "#757575",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  address: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  addressPlaceholder: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  coordinates: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  coordText: {
    fontSize: 12,
    color: "#757575",
  },
  radiusContainer: {
    marginBottom: 20,
  },
  radiusLabel: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 10,
    fontWeight: "500",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  radiusMin: {
    fontSize: 12,
    color: "#757575",
  },
  radiusMax: {
    fontSize: 12,
    color: "#757575",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 2,
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default LocationPicker;
