import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.0.119:5000/api"; // Change to your backend IP

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    return { success: true, user, token };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Login failed"),
    };
  }
};

/** Step 1: send OTP to email (account not created yet) */
export const sendRegistrationOtp = async (userData) => {
  try {
    const response = await api.post("/auth/send-registration-otp", userData);
    return {
      success: true,
      message: response.data.message || "OTP sent to your email.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to send OTP"),
    };
  }
};

/** Step 2: verify OTP and create account */
export const completeRegistration = async ({ email, otp }) => {
  try {
    const response = await api.post("/auth/complete-registration", {
      email,
      otp,
    });
    return {
      success: true,
      message: response.data.message || "Registration successful.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Registration failed"),
    };
  }
};

/** Resend OTP from OTP screen only */
export const resendRegistrationOtp = async (email) => {
  try {
    const response = await api.post("/auth/resend-registration-otp", {
      email,
    });
    return {
      success: true,
      message: response.data.message || "A new OTP has been sent.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to resend OTP"),
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
