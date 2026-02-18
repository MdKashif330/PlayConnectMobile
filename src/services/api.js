import api from "./authService"; // Import your existing axios instance

// Vacation API calls
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
};

// Venue API calls
export const venueAPI = {
  getVenues: () => api.get("/manager/venues"),
  getVenue: (venueId) => api.get(`/manager/venues/${venueId}`),
  createVenue: (data) => api.post("/manager/venues", data),
  updateVenue: (venueId, data) => api.put(`/manager/venues/${venueId}`, data),
  deleteVenue: (venueId) => api.delete(`/manager/venues/${venueId}`),
};

// Court API calls
export const courtAPI = {
  getCourts: (venueId) => api.get(`/manager/venues/${venueId}/courts`),
  createCourt: (venueId, data) =>
    api.post(`/manager/venues/${venueId}/courts`, data),
  deleteCourt: (courtId) => api.delete(`/manager/courts/${courtId}`),
};

// Booking API calls
export const bookingAPI = {
  // Manager bookings
  getManagerBookings: (status) =>
    api.get(`/manager/bookings${status ? `?status=${status}` : ""}`),
  updateBookingStatus: (bookingId, status) =>
    api.put(`/manager/bookings/${bookingId}`, { status }),

  // User bookings
  getUserBookings: () => api.get("/user/bookings"),
  createUserBooking: (data) => api.post("/user/bookings", data),
  cancelUserBooking: (bookingId) => api.delete(`/user/bookings/${bookingId}`),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Export the base api for custom calls
export { api };
