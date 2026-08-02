import api from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==================== VACATION API ====================
export const vacationAPI = {
  // Get all vacations for manager
  getVacations: () => api.get("/vacations"),

  // Get vacations for specific venue
  getVenueVacations: (venueId) => api.get(`/vacations/venue/${venueId}`),

  // Create new vacation
  createVacation: (data) => api.post("/vacations", data),

  // Update vacation
  updateVacation: (id, data) => api.put(`/vacations/${id}`, data),

  // Delete vacation
  deleteVacation: (id) => api.delete(`/vacations/${id}`),

  // Check availability
  checkAvailability: (venueId, startDate, endDate) =>
    api.get("/vacations/check-availability", {
      params: { venueId, startDate, endDate },
    }),

  // NEW: Check if a specific date is a vacation
  checkVacation: (venueId, date) =>
    api.get("/vacations/check", { params: { venueId, date } }),
};

// ==================== VENUE API (Manager) ====================
export const venueAPI = {
  // Manager endpoints
  getVenues: () => api.get("/manager/venues"),
  getVenue: (venueId) => api.get(`/manager/venues/${venueId}`),
  createVenue: (data) => api.post("/manager/venues", data),
  updateVenue: (venueId, data) => api.put(`/manager/venues/${venueId}`, data),
  deleteVenue: (venueId) => api.delete(`/manager/venues/${venueId}`),

  // Public/User endpoints (NEW)
  getAllPublicVenues: (params) => api.get("/venues", { params }),
  getPublicVenueById: (id) => api.get(`/venues/${id}`),
  getPublicVenueCourts: (venueId) => api.get(`/venues/${venueId}/courts`),
};

// ==================== COURT API ====================
export const courtAPI = {
  // Manager endpoints
  getCourts: (venueId) => api.get(`/manager/venues/${venueId}/courts`),
  createCourt: (venueId, data) =>
    api.post(`/manager/venues/${venueId}/courts`, data),
  deleteCourt: (courtId) => api.delete(`/manager/courts/${courtId}`),

  // Public/User endpoints
  getPublicCourtById: (id) => api.get(`/courts/${id}`),

  // Fix: Use the correct endpoint for available slots
  getAvailableSlots: (courtId, date) => {
    return api.get("/slots", {
      params: {
        courtId: courtId,
        date: date,
      },
    });
  },
};

// ==================== BOOKING API ====================
export const bookingAPI = {
  // Manager bookings
  getManagerBookings: (status) =>
    api.get(`/manager/bookings${status ? `?status=${status}` : ""}`),
  updateBookingStatus: (bookingId, status) =>
    api.put(`/manager/bookings/${bookingId}`, { status }),

  // User bookings
  getBookingById: (bookingId) => api.get(`/bookings/${bookingId}`),
  getUserBookings: () => api.get("/bookings/user"),
  createUserBooking: (data) => api.post("/bookings", data),
  simulatePayment: (bookingId, method) =>
    api.post("/bookings/simulate-payment", { bookingId, method }),

  // NEW: Cancel user booking
  cancelUserBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`), // ADD THIS LINE

  // NEW: Get booked dates for calendar
  getBookedDates: (month, venueId) =>
    api.get("/bookings/dates", { params: { month, venueId } }),
};

// ==================== USER PROFILE API (NEW) ====================
export const userAPI = {
  // Profile
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),

  // Favorites
  getFavorites: () => api.get("/users/favorites"),
  addFavorite: (venueId) => api.post(`/users/favorites/${venueId}`),
  removeFavorite: (venueId) => api.delete(`/users/favorites/${venueId}`),
};

// ==================== EVENT API (NEW) ====================
export const eventAPI = {
  // Public endpoints
  getAllEvents: (params) => api.get("/events/public", { params }),
  getEventById: (id) => api.get(`/events/public/${id}`),

  // User endpoints (require auth)
  registerForEvent: (eventId) => api.post(`/events/${eventId}/register`),
  cancelRegistration: (eventId) => api.delete(`/events/${eventId}/register`),
  getUserEvents: () => api.get("/events/user/registered"),

  // Manager endpoints (require manager role)
  getManagerEvents: () => api.get("/events/manager"),
  createEvent: (data) => api.post("/events", data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getManagerEventById: (id) => api.get(`/events/manager/${id}`),
};

// ==================== CHATBOT API (NEW) ====================
export const chatbotAPI = {
  // Send query to AI
  query: (message, context) => api.post("/chatbot/query", { message, context }),
};

// Refund API
export const refundAPI = {
  createRefundRequest: (data) => api.post("/refunds", data),
  getUserRefunds: () => api.get("/refunds/my-refunds"),
  getManagerRefunds: () => api.get("/refunds/manager/refunds"),
  updateRefundStatus: (id, data) => api.put(`/refunds/${id}/status`, data),
  getRefundById: (id) => api.get(`/refunds/${id}`),
};

// ==================== REVIEW API (NEW) ====================
export const reviewAPI = {
  // Get reviews for a venue
  getVenueReviews: (venueId) => api.get(`/venues/${venueId}/reviews`),

  // Add review
  addReview: (venueId, data) => api.post(`/venues/${venueId}/reviews`, data),

  // Update review
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),

  // Delete review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// ==================== PROFILE API (Legacy - kept for backward compatibility) ====================
export const profileAPI = {
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Export the base api for custom calls
export { api };
