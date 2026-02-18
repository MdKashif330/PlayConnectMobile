import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getToken,
  getUserRole,
  getUser, // Import existing getUser function
  logout as authLogout,
} from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    const role = await getUserRole();

    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);

      // Get user data from AsyncStorage
      const userData = await getUser();
      if (userData) {
        setUser(userData);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUser(null);
    }
    setLoading(false);
  };

  const login = (userData, role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUser(userData);
  };

  const logout = async () => {
    await authLogout();
    setIsLoggedIn(false);
    setUserRole(null);
    setUser(null);
  };

  // ADD THIS FUNCTION
  const updateUser = (userData) => {
    setUser(userData);
    // Also update in AsyncStorage if you want to persist it
    // You'll need to import AsyncStorage and save it
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userRole,
        user,
        loading,
        login,
        logout,
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
