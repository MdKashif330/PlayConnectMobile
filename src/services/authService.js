import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.0.110:5000/api"; // Change to your backend IP

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Auth functions
export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Login failed";
    return { success: false, message };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem("token");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const getUser = async () => {
  const userJson = await AsyncStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

export const getUserRole = async () => {
  const user = await getUser();
  return user ? user.role : null;
};

export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

export default api;
