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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../../components/CustomHeader";
import Icon from "../../components/Icon";
import api from "../../services/api";

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "👋 Hello! I'm your AI assistant for PlayConnect. I can help you find venues, check availability, make bookings, or answer any questions. How can I help you today?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const flatListRef = useRef();

  // Common suggestions for users
  useEffect(() => {
    setSuggestions([
      "Find football venues near me",
      "Badminton courts available now",
      "Book a tennis court for tomorrow",
      "What events are coming up?",
      "Show me venues with parking",
      "Cheapest courts in my area",
    ]);
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
      // Process with AI
      await processWithAI(inputText);
    } catch (error) {
      console.error("AI Processing Error:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to my AI service. Please try again or check your internet connection.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const processWithAI = async (userInput) => {
    try {
      // Call your backend AI endpoint
      const response = await api.post("/chatbot/query", {
        message: userInput,
        context: {
          userId: "current-user-id", // Get from auth context
          previousMessages: messages.slice(-5), // Send last 5 messages for context
        },
      });

      const aiResponse = response.data;

      // Check if AI wants to show venues
      if (aiResponse.showVenues) {
        const venuesMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.text,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          venues: aiResponse.venues,
          type: "venues",
        };
        setMessages((prev) => [...prev, venuesMessage]);
      }
      // Check if AI wants to show events
      else if (aiResponse.showEvents) {
        const eventsMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.text,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          events: aiResponse.events,
          type: "events",
        };
        setMessages((prev) => [...prev, eventsMessage]);
      }
      // Regular text response
      else {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text:
            aiResponse.text ||
            "I understand you're looking for help. Could you please provide more details?",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          actions: aiResponse.actions || [],
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      // Update suggestions based on context
      if (aiResponse.suggestions) {
        setSuggestions(aiResponse.suggestions);
      }
    } catch (error) {
      console.error("AI API Error:", error);

      // Fallback to rule-based responses if AI fails
      fallbackResponse(userInput);
    }
  };

  const fallbackResponse = (userInput) => {
    const input = userInput.toLowerCase();
    let response = {
      text: "I can help you find venues, check availability, or make bookings. What would you like to do?",
    };

    if (input.includes("football") || input.includes("soccer")) {
      response = {
        text: "I found several football venues near you. Here are some options:",
        showVenues: true,
        venues: mockFootballVenues,
      };
    } else if (input.includes("badminton")) {
      response = {
        text: "Here are the best badminton courts available:",
        showVenues: true,
        venues: mockBadmintonVenues,
      };
    } else if (input.includes("event") || input.includes("tournament")) {
      response = {
        text: "Here are upcoming events you might be interested in:",
        showEvents: true,
        events: mockEvents,
      };
    } else if (input.includes("book") || input.includes("reserve")) {
      response = {
        text: "I can help you make a booking. Which venue would you like to book? You can also use the + button to create a booking.",
        actions: ["create_booking"],
      };
    } else if (input.includes("parking") || input.includes("facilities")) {
      response = {
        text: "Venues with parking and other facilities:",
        showVenues: true,
        venues: mockVenuesWithFacilities,
      };
    }

    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
      venues: response.showVenues ? response.venues : null,
      events: response.showEvents ? response.events : null,
      type: response.showVenues
        ? "venues"
        : response.showEvents
          ? "events"
          : "text",
      actions: response.actions || [],
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
    // Auto-send after a short delay
    setTimeout(() => handleSend(), 100);
  };

  const renderVenueCard = (venue) => (
    <TouchableOpacity
      key={venue.id}
      style={styles.venueCard}
      onPress={() => navigation.navigate("VenueDetail", { venueId: venue.id })}
    >
      <View style={styles.venueImagePlaceholder}>
        <Icon icon="venues" size={30} color="#CCCCCC" />
      </View>
      <View style={styles.venueCardInfo}>
        <Text style={styles.venueCardName}>{venue.name}</Text>
        <Text style={styles.venueCardDistance}>{venue.distance}</Text>
        <View style={styles.venueCardRating}>
          <Icon icon="star" size={12} color="#FFC107" />
          <Text style={styles.venueCardRatingText}>{venue.rating}</Text>
        </View>
        {venue.price && (
          <Text style={styles.venueCardPrice}>₹{venue.price}/hr</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEventCard = (event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
    >
      <View style={styles.eventImagePlaceholder}>
        <Icon icon="events" size={30} color="#CCCCCC" />
      </View>
      <View style={styles.eventCardInfo}>
        <Text style={styles.eventCardName}>{event.name}</Text>
        <Text style={styles.eventCardDate}>{event.date}</Text>
        <Text style={styles.eventCardVenue}>{event.venue}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderActions = (actions) => {
    if (!actions || actions.length === 0) return null;

    return (
      <View style={styles.actionButtons}>
        {actions.includes("create_booking") && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("CreateBooking")}
          >
            <Icon icon="add" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Create Booking</Text>
          </TouchableOpacity>
        )}
        {actions.includes("view_venues") && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("Home")}
          >
            <Icon icon="venues" size={16} color="#2E7D32" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Browse Venues
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    // Render venue cards
    if (item.type === "venues" && item.venues) {
      return (
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <Icon icon="chat" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.venuesContainer}>
            <Text style={styles.venuesTitle}>{item.text}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.venues.map((venue) => renderVenueCard(venue))}
            </ScrollView>
            {renderActions(item.actions)}
          </View>
        </View>
      );
    }

    // Render event cards
    if (item.type === "events" && item.events) {
      return (
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <Icon icon="chat" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.venuesContainer}>
            <Text style={styles.venuesTitle}>{item.text}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.events.map((event) => renderEventCard(event))}
            </ScrollView>
            {renderActions(item.actions)}
          </View>
        </View>
      );
    }

    // Regular text message
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
            {item.text}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          {item.sender === "bot" && renderActions(item.actions)}
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

      {/* Suggestions Chips */}
      {suggestions.length > 0 && messages.length < 3 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
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
          placeholder="Ask me anything about venues, bookings, events..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
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
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Mock data for fallback responses
const mockFootballVenues = [
  {
    id: 1,
    name: "City Football Ground",
    distance: "2.5 km",
    rating: 4.5,
    price: "₹800",
  },
  {
    id: 2,
    name: "Green Field Arena",
    distance: "3.8 km",
    rating: 4.3,
    price: "₹600",
  },
  {
    id: 3,
    name: "Sports Complex Football",
    distance: "5.2 km",
    rating: 4.7,
    price: "₹1000",
  },
];

const mockBadmintonVenues = [
  {
    id: 4,
    name: "Elite Badminton Arena",
    distance: "1.5 km",
    rating: 4.8,
    price: "₹400",
  },
  {
    id: 5,
    name: "Smash Badminton Court",
    distance: "3.0 km",
    rating: 4.4,
    price: "₹350",
  },
];

const mockVenuesWithFacilities = [
  {
    id: 6,
    name: "Grand Sports Hub",
    distance: "4.0 km",
    rating: 4.6,
    price: "₹1200",
  },
  {
    id: 7,
    name: "Elite Sports Village",
    distance: "6.5 km",
    rating: 4.9,
    price: "₹1500",
  },
];

const mockEvents = [
  {
    id: 1,
    name: "Summer Football Tournament",
    date: "15 Jul 2024",
    venue: "City Football Ground",
  },
  {
    id: 2,
    name: "Badminton Championship",
    date: "20 Jul 2024",
    venue: "Elite Badminton Arena",
  },
  {
    id: 3,
    name: "Tennis Open 2024",
    date: "25 Jul 2024",
    venue: "Tennis World",
  },
];

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
    width: 160,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
  },
  venueImagePlaceholder: {
    height: 90,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  venueCardInfo: {
    padding: 10,
  },
  venueCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  venueCardDistance: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  venueCardRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  venueCardRatingText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  venueCardPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  eventCard: {
    width: 160,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
  },
  eventImagePlaceholder: {
    height: 80,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  eventCardInfo: {
    padding: 10,
  },
  eventCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  eventCardDate: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  eventCardVenue: {
    fontSize: 12,
    color: "#757575",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  secondaryButtonText: {
    color: "#2E7D32",
  },
});

export default ChatbotScreen;
