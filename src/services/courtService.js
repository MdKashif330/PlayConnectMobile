import api from "./authService";

export const getAvailableCourts = async () => {
  try {
    const response = await api.get("/courts/available");
    return { success: true, courts: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch courts",
    };
  }
};
