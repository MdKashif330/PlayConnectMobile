import { useState, useEffect, useCallback } from "react";
import { Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export const useAppSettings = (refreshCallback) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("appSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAutoRefresh(settings.autoRefresh ?? true);
        setVibration(settings.vibration ?? true);
        setDataSaver(settings.dataSaver ?? false);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Trigger vibration
  const triggerVibration = useCallback(() => {
    if (vibration) {
      Vibration.vibrate(50); // 50ms vibration
    }
  }, [vibration]);

  // Auto refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh && refreshCallback) {
        triggerVibration();
        refreshCallback();
      }
    }, [autoRefresh, refreshCallback, triggerVibration]),
  );

  // Data saver helpers
  const getImageQuality = useCallback(() => {
    return dataSaver ? 0.5 : 1.0;
  }, [dataSaver]);

  const getListBatchSize = useCallback(() => {
    return dataSaver ? 5 : 10;
  }, [dataSaver]);

  return {
    autoRefresh,
    vibration,
    dataSaver,
    triggerVibration,
    getImageQuality,
    getListBatchSize,
  };
};
