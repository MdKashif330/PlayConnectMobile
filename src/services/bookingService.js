import api from "./authService";

export const getUserBookings = async () => {
  try {
    const response = await api.get("/bookings/user");
    return { success: true, bookings: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch bookings",
    };
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post("/bookings", bookingData);
    return { success: true, booking: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Booking creation failed",
    };
  }
};
