import api from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getManagerBookings = async () => {
  try {
    const response = await api.get("/manager/bookings");
    return { success: true, bookings: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};

export const getManagerVenues = async () => {
  try {
    const response = await api.get("/manager/venues");
    return { success: true, venues: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch venues",
    };
  }
};

// Get specific venue details
export const getVenueDetails = async (venueId) => {
  try {
    const response = await api.get(`/manager/venues/${venueId}`);
    return { success: true, venue: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch venue",
    };
  }
};

// Get courts for a specific venue
export const getVenueCourts = async (venueId) => {
  try {
    const response = await api.get(`/manager/courts?venue=${venueId}`);
    return { success: true, courts: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch courts",
    };
  }
};

// Update existing venue
export const updateVenue = async (venueId, venueData) => {
  try {
    const response = await api.put(`/manager/venues/${venueId}`, venueData);
    return { success: true, venue: response.data };
  } catch (error) {
    console.error("Update venue error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update venue",
    };
  }
};

// Create new venue
export const createVenue = async (venueData) => {
  try {
    const response = await api.post("/manager/venues", venueData);
    return { success: true, venue: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create venue",
    };
  }
};

// Update existing court
export const updateCourt = async (courtId, courtData) => {
  try {
    const response = await api.put(`/manager/courts/${courtId}`, courtData);
    return { success: true, court: response.data };
  } catch (error) {
    console.error("Update court error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update court",
    };
  }
};

// Delete venue
export const deleteVenue = async (venueId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.delete(`/manager/venues/${venueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Delete venue error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete venue",
    };
  }
};
