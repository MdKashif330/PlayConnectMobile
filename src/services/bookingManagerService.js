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

// Update booking status (request payment, verify payment, reject)
export const updateBookingStatus = async (bookingId, action, data = {}) => {
  try {
    let response;

    switch (action) {
      case "request_payment":
        // Change status from PENDING to PAYMENT_SUBMITTED
        response = await api.put(`/bookings/manager/${bookingId}/status`, {
          status: "PAYMENT_SUBMITTED",
          notes: data.paymentRequestNote,
        });
        break;
      case "verify_payment":
        response = await api.post(
          `/bookings/manager/${bookingId}/verify-payment`,
          {
            isApproved: data.isApproved,
            rejectionReason: data.rejectionReason,
          },
        );
        break;
      case "reject":
        response = await api.put(`/bookings/manager/${bookingId}/status`, {
          status: "REJECTED",
          notes: data.rejectionReason,
        });
        break;
      default:
        return { success: false, message: "Invalid action" };
    }

    return {
      success: true,
      message: response.data.message,
      booking: response.data.booking,
    };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        `Failed to ${action.replace("_", " ")}`,
    };
  }
};

// Get booking details for payment verification
export const getBookingDetails = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return { success: true, booking: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch booking details",
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

// For Pending, Payment Submitted, Confirmed tabs
export const getManagerFutureBookingsByStatus = async (status) => {
  try {
    console.log(`📡 Fetching bookings with status: ${status}`);
    const response = await api.get(`/bookings/manager/status/${status}`);
    console.log(`✅ Received ${response.data?.length || 0} bookings`);
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
    const response = await api.get("/bookings/manager/history");
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
    const response = await api.get("/bookings/manager/reservations");
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
    const response = await api.get("/bookings/manager/stats");
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
    const response = await api.get(`/bookings/manager/date/${date}`);
    return { success: true, bookings: response.data };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};
