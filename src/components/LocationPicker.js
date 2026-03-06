import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../contexts/ThemeContext";

export default function LocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLocation = null,
}) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [location, setLocation] = useState(initialLocation || null);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [region, setRegion] = useState(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
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

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setLocation(initialLocation);
        setAddress(initialLocation.address || "");
        setRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to pick a location.",
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);
      setLocation({ latitude, longitude });

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }

      reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap's Nominatim API (completely free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "PlayConnectApp/1.0", // Required by Nominatim
          },
        },
      );
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setShowResults(true);

    try {
      // Using OpenStreetMap's Nominatim API for search (completely free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            "User-Agent": "PlayConnectApp/1.0", // Required by Nominatim
          },
        },
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Error", "Failed to search location");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    setRegion(newRegion);
    setLocation({ latitude: lat, longitude: lon });
    setAddress(item.display_name);
    setShowResults(false);
    setSearchQuery("");

    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        500,
      );
    }

    reverseGeocode(latitude, longitude);
  };

  const handleConfirm = () => {
    if (location) {
      onLocationSelect({
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || "Selected location",
      });
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.card, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Pick Location
          </Text>
          <TouchableOpacity onPress={getCurrentLocation}>
            <Icon name="my-location" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Completely Free */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Icon name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search for a place"
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchLocation}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {searching && (
            <ActivityIndicator
              size="small"
              color={theme.primary}
              style={styles.searchLoader}
            />
          )}

          {showResults && searchResults.length > 0 && (
            <View
              style={[styles.resultsContainer, { backgroundColor: theme.card }]}
            >
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.resultItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => selectSearchResult(item)}
                >
                  <Icon name="place" size={16} color={theme.primary} />
                  <Text
                    style={[styles.resultText, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Getting your location...
            </Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              provider={PROVIDER_DEFAULT}
            >
              {location && (
                <Marker
                  coordinate={location}
                  draggable
                  onDragEnd={(e) => handleMapPress(e)}
                />
              )}
            </MapView>

            <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
              {address ? (
                <Text
                  style={[styles.address, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {address}
                </Text>
              ) : (
                <Text style={[styles.address, { color: theme.textSecondary }]}>
                  Tap on map or search to select location
                </Text>
              )}

              <View style={styles.coordinates}>
                {location && (
                  <>
                    <Text
                      style={[styles.coordText, { color: theme.textSecondary }]}
                    >
                      Lat: {location.latitude.toFixed(6)}
                    </Text>
                    <Text
                      style={[styles.coordText, { color: theme.textSecondary }]}
                    >
                      Lng: {location.longitude.toFixed(6)}
                    </Text>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleConfirm}
                disabled={!location}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 999,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  searchLoader: {
    marginTop: 10,
  },
  resultsContainer: {
    marginTop: 10,
    borderRadius: 8,
    maxHeight: 200,
    elevation: 3,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
  },
  address: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  coordinates: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  coordText: {
    fontSize: 14,
  },
  confirmButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
