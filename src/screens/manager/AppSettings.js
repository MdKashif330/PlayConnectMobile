import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AppSettings() {
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    darkMode: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    autoRefresh: true,
    soundEffects: true,
    vibration: true,
    dataSaver: false,
    showBookingReminders: true,
    showPromotions: false,
  });

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("appSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem("appSettings", JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const clearCache = () => {
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear app cache? This will free up storage space.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              // Simulate cache clearing
              await AsyncStorage.removeItem("appCache");
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ],
    );
  };

  const resetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            const defaultSettings = {
              darkMode: false,
              pushNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
              autoRefresh: true,
              soundEffects: true,
              vibration: true,
              dataSaver: false,
              showBookingReminders: true,
              showPromotions: false,
            };
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            Alert.alert("Success", "Settings reset to default");
          },
        },
      ],
    );
  };

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingItem = ({ icon, label, value, onToggle, type = "switch" }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Icon icon={icon} size={22} color="#2196F3" />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === "switch" ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#ddd", true: "#2196F3" }}
          thumbColor="white"
        />
      ) : (
        <TouchableOpacity onPress={onToggle}>
          <Icon
            icon="back"
            size={20}
            color="#999"
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={resetSettings}>
          <Icon icon="refresh" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingItem
            icon="bulb"
            label="Dark Mode"
            value={settings.darkMode}
            onToggle={() => toggleSetting("darkMode")}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications"
            label="Push Notifications"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting("pushNotifications")}
          />
          <SettingItem
            icon="mail"
            label="Email Notifications"
            value={settings.emailNotifications}
            onToggle={() => toggleSetting("emailNotifications")}
          />
          <SettingItem
            icon="chatbubble"
            label="SMS Notifications"
            value={settings.smsNotifications}
            onToggle={() => toggleSetting("smsNotifications")}
          />
        </SettingSection>

        {/* App Behavior */}
        <SettingSection title="App Behavior">
          <SettingItem
            icon="refresh"
            label="Auto-refresh on focus"
            value={settings.autoRefresh}
            onToggle={() => toggleSetting("autoRefresh")}
          />
          <SettingItem
            icon="volume-high"
            label="Sound Effects"
            value={settings.soundEffects}
            onToggle={() => toggleSetting("soundEffects")}
          />
          <SettingItem
            icon="phone-portrait"
            label="Vibration"
            value={settings.vibration}
            onToggle={() => toggleSetting("vibration")}
          />
          <SettingItem
            icon="save"
            label="Data Saver Mode"
            value={settings.dataSaver}
            onToggle={() => toggleSetting("dataSaver")}
          />
        </SettingSection>

        {/* Booking Preferences */}
        <SettingSection title="Booking Preferences">
          <SettingItem
            icon="calendar"
            label="Show Booking Reminders"
            value={settings.showBookingReminders}
            onToggle={() => toggleSetting("showBookingReminders")}
          />
          <SettingItem
            icon="megaphone"
            label="Show Promotions"
            value={settings.showPromotions}
            onToggle={() => toggleSetting("showPromotions")}
          />
        </SettingSection>

        {/* Storage */}
        <SettingSection title="Storage">
          <SettingItem
            icon="trash"
            label="Clear Cache"
            type="link"
            onToggle={clearCache}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingItem
            icon="information-circle"
            label="App Version"
            type="link"
            onToggle={() => Alert.alert("App Version", "PlayConnect v1.0.0")}
          />
          <SettingItem
            icon="document-text"
            label="Terms of Service"
            type="link"
            onToggle={() =>
              Alert.alert("Terms", "Terms of service will be available soon")
            }
          />
          <SettingItem
            icon="shield"
            label="Privacy Policy"
            type="link"
            onToggle={() =>
              Alert.alert("Privacy", "Privacy policy will be available soon")
            }
          />
          <SettingItem
            icon="star"
            label="Rate the App"
            type="link"
            onToggle={() => Alert.alert("Rate", "Rate us on the app store")}
          />
          <SettingItem
            icon="share"
            label="Share App"
            type="link"
            onToggle={() => Alert.alert("Share", "Sharing feature coming soon")}
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Settings are automatically saved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "white",
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});
