import api from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get bookings for manager (with status filter)
export const getManagerBookingsByStatus = async (status) => {
  try {
    const url = status
      ? `/manager/bookings?status=${status}`
      : "/manager/bookings";
    const response = await api.get(url);
    return { success: true, bookings: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};

// Approve a booking
export const approveBooking = async (bookingId) => {
  try {
    const response = await api.put(`/manager/bookings/${bookingId}/approve`);
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Approval failed",
    };
  }
};

// Reject a booking
export const rejectBooking = async (bookingId) => {
  try {
    const response = await api.put(`/manager/bookings/${bookingId}/reject`);
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Rejection failed",
    };
  }
};

// Get bookings for a specific court
export const getCourtBookings = async (courtId, status = "CONFIRMED") => {
  try {
    const response = await api.get(
      `/manager/courts/${courtId}/bookings?status=${status}`,
    );
    return { success: true, bookings: response.data };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch court bookings",
    };
  }
};

// Delete a court
export const deleteCourt = async (courtId) => {
  try {
    const response = await api.delete(`/manager/courts/${courtId}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete court",
    };
  }
};

// For Unapproved & Approved tabs
export const getManagerFutureBookingsByStatus = async (status) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get(`/bookings/manager/status/${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, bookings: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};

// For History tab
export const getManagerBookingHistory = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get("/bookings/manager/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, bookings: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch history",
    };
  }
};

// For Reservations tab
export const getManagerReservations = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get("/bookings/manager/reservations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, bookings: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch reservations",
    };
  }
};

// Dashboard statistics
export const getManagerDashboardStats = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get("/bookings/manager/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, stats: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch stats",
    };
  }
};

// Bookings for specific date
export const getManagerBookingsByDate = async (date) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await api.get(`/bookings/manager/date/${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, bookings: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};
