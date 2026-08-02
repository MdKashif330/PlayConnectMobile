import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const ChatbotScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "🏸 Welcome to PlayConnect Assistant!\n\nI can help you find available time slots at nearby venues.\n\nJust tell me:\n• Time slot (e.g., '6pm to 7pm')\n• Search radius (e.g., 'within 10km')\n\nExample: 'Find venues with 6pm to 7pm time slot within 10km'",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "6pm to 7pm within 10km",
    "8pm to 9pm within 5km",
    "7pm to 8pm near me",
    "Badminton courts at 7pm within 5km",
  ]);
  const flatListRef = useRef();

  // Send user location to backend
  useEffect(() => {
    const sendLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;

          await api.post("/users/location", { latitude, longitude });
        }
      } catch (error) {
        console.log("Location error:", error);
      }
    };
    sendLocation();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Get current location
      let latitude = null;
      let longitude = null;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (locError) {
        console.log("Location error:", locError);
      }
      const response = await api.post("/chatbot/query", {
        message: inputText,
        latitude: latitude,
        longitude: longitude,
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.text,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
        venues: response.data.venues,
        type: response.data.showVenues ? "venues" : "text",
      };

      setMessages((prev) => [...prev, botMessage]);

      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Chatbot Error:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble. Please try again with something like: '6pm to 7pm within 10km'",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const handleVenueSelect = (venue) => {
    navigation.navigate("VenueDetail", { venueId: venue.venueId });
  };

  const handleBookNow = (venue, courtId, timeSlot) => {
    navigation.navigate("CreateBooking", {
      venueId: venue.venueId,
      courtId: courtId,
      slot: timeSlot,
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const VenueCard = ({ venue, index }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        key={venue.venueId + index}
        style={styles.venueCard}
        onPress={() => handleVenueSelect(venue)}
      >
        <View style={styles.venueImageContainer}>
          {venue.images && venue.images.length > 0 && !imageError ? (
            <Image
              source={{ uri: getImageUrl(venue.images[0]) }}
              style={styles.venueImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.venueImagePlaceholder}>
              <Icon icon="venues" size={30} color="#CCCCCC" />
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.venueCardInfo}>
          <Text style={styles.venueCardName}>{venue.venueName}</Text>
          <Text style={styles.venueCardSport}>{venue.sportType}</Text>
          <View style={styles.venueCardDetails}>
            <View style={styles.venueCardDetail}>
              <Icon icon="time" size={12} color="#757575" />
              <Text style={styles.venueCardDetailText}>{venue.timeSlot}</Text>
            </View>
            {venue.distance && (
              <View style={styles.venueCardDetail}>
                <Icon icon="location" size={12} color="#757575" />
                <Text style={styles.venueCardDetailText}>
                  {venue.distance} km away
                </Text>
              </View>
            )}
            <View style={styles.venueCardDetail}>
              <Icon icon="price" size={12} color="#757575" />
              <Text style={styles.venueCardPrice}>PKR {venue.price}/hour</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookNow(venue, venue.courtId, venue.timeSlot)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    // Safety check for empty item
    if (!item) return null;

    if (item.type === "venues" && item.venues && item.venues.length > 0) {
      return (
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <Icon icon="chat" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.venuesContainer}>
            <Text style={styles.venuesTitle}>{item.text || ""}</Text>
            {item.venues.map((venue, index) => (
              <VenueCard
                key={venue.venueId + index}
                venue={venue}
                index={index}
              />
            ))}
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          item.sender === "user" ? styles.userMessageRow : styles.botMessageRow,
        ]}
      >
        {item.sender === "bot" && (
          <View style={styles.botAvatar}>
            <Icon icon="chat" size={20} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            item.sender === "user" ? styles.userBubble : styles.botBubble,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.sender === "user"
                ? styles.userMessageText
                : styles.botMessageText,
              item.isError && styles.errorText,
            ]}
          >
            {item.text || ""}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp || ""}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <CustomHeader title="AI Assistant" showBack showNotifications />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {suggestions.length > 0 && messages.length < 4 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g., '6pm to 7pm within 10km'"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon icon="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  botMessageRow: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: "#FFEBEE",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#212121",
  },
  errorText: {
    color: "#D32F2F",
  },
  timestamp: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  suggestionsTitle: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#2E7D32",
  },
  botMessageContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  venuesContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginLeft: 8,
  },
  venuesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  venueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  venueImageContainer: {
    height: 100,
    backgroundColor: "#F0F0F0",
  },
  venueImage: {
    width: "100%",
    height: "100%",
  },
  venueImagePlaceholder: {
    height: 100,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
    textAlign: "center",
  },
  venueCardInfo: {
    padding: 12,
  },
  venueCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  venueCardSport: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  venueCardDetails: {
    marginBottom: 8,
  },
  venueCardDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  venueCardDetailText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 6,
  },
  venueCardPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    marginLeft: 6,
  },
  bookButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ChatbotScreen;
