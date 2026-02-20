import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Light theme colors
const lightTheme = {
  background: "#f5f5f5",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#2196F3",
  primaryLight: "#E3F2FD",
  border: "#eeeeee",
  danger: "#f44336",
  success: "#4CAF50",
  warning: "#FF9800",
  icon: "#2196F3",
  placeholder: "#999999",
};

// Dark theme colors
const darkTheme = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#ffffff",
  textSecondary: "#b0b0b0",
  primary: "#64b5f6",
  primaryLight: "#2c3e50",
  border: "#333333",
  danger: "#ff5252",
  success: "#81c784",
  warning: "#ffb74d",
  icon: "#64b5f6",
  placeholder: "#666666",
};

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme(); // 'light' or 'dark'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("darkMode");
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      } else {
        // If no saved preference, use device theme
        setIsDarkMode(deviceTheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem("darkMode", JSON.stringify(value));
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        theme,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
