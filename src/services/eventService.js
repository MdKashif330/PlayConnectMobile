import api from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get all events for manager
export const getManagerEvents = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get("/events/manager", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, events: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch events",
    };
  }
};

// Get single event details
export const getEventDetails = async (eventId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get(`/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, event: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch event",
    };
  }
};

// Create new event
export const createEvent = async (eventData) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.post("/events", eventData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, event: response.data.event };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create event",
    };
  }
};

// Update event
export const updateEvent = async (eventId, eventData) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.put(`/events/${eventId}`, eventData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, event: response.data.event };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update event",
    };
  }
};

// Delete/cancel event
export const deleteEvent = async (eventId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.delete(`/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete event",
    };
  }
};
