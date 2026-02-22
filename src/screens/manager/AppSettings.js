import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Vibration,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../contexts/ThemeContext";

export default function AppSettings() {
  const navigation = useNavigation();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();

  const [settings, setSettings] = useState({
    // Appearance
    darkMode: isDarkMode,

    // Notifications
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,

    // App Behavior (Only these 3)
    autoRefresh: true, // Auto-refresh on focus
    vibration: true, // Vibration
    dataSaver: false, // Data saver mode

    // Booking Preferences
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
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
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

  // Trigger vibration for testing
  const triggerVibration = () => {
    if (!settings.vibration) return;
    Vibration.vibrate(100); // Vibrate for 100ms
  };

  // Toggle setting with vibration effect
  const toggleSetting = async (key, value) => {
    // Vibrate if enabled (only for non-dark mode toggles to avoid double vibration)
    if (settings.vibration && key !== "darkMode") {
      triggerVibration();
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);

    // Special handling for dark mode
    if (key === "darkMode") {
      toggleDarkMode(value);
    }
  };

  // Test functions for each feature
  const testAutoRefresh = () => {
    Alert.alert(
      "Auto-Refresh Test",
      `Auto-refresh is ${settings.autoRefresh ? "ON" : "OFF"}. ${
        settings.autoRefresh
          ? "Screens will automatically refresh when focused."
          : "You will need to manually refresh screens."
      }`,
      [{ text: "OK" }],
    );
  };

  const testVibration = () => {
    if (!settings.vibration) {
      Alert.alert(
        "Vibration OFF",
        "Enable vibration first to feel vibrations.",
      );
      return;
    }
    triggerVibration();
    Alert.alert("Vibration Test", "Your device should have vibrated.");
  };

  const testDataSaver = () => {
    Alert.alert(
      "Data Saver Mode",
      `Data saver is ${settings.dataSaver ? "ON" : "OFF"}. ${
        settings.dataSaver
          ? "Images will load in lower quality and data usage will be reduced."
          : "All content will load in full quality."
      }`,
      [{ text: "OK" }],
    );
  };

  const clearCache = () => {
    Alert.alert("Clear Cache", "Are you sure you want to clear app cache?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("appCache");
            Alert.alert("Success", "Cache cleared successfully");
          } catch (error) {
            Alert.alert("Error", "Failed to clear cache");
          }
        },
      },
    ]);
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
              vibration: true,
              dataSaver: false,
              showBookingReminders: true,
              showPromotions: false,
            };
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            toggleDarkMode(false);
            Alert.alert("Success", "Settings reset to default");
          },
        },
      ],
    );
  };

  const SettingSection = ({ title, children }) => (
    <View style={[styles.section, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingItem = ({
    icon,
    label,
    value,
    onToggle,
    type = "switch",
    onTest,
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <Icon icon={icon} size={22} color={theme.primary} />
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {type === "switch" ? (
          <Switch
            value={value}
            onValueChange={(newValue) => onToggle(newValue)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="white"
          />
        ) : (
          <TouchableOpacity onPress={onTest}>
            <Icon icon="play-circle" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </Text>
        <TouchableOpacity onPress={resetSettings}>
          <Icon icon="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingItem
            icon={isDarkMode ? "moon" : "sunny"}
            label="Dark Mode"
            value={settings.darkMode}
            onToggle={(value) => toggleSetting("darkMode", value)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications"
            label="Push Notifications"
            value={settings.pushNotifications}
            onToggle={(value) => toggleSetting("pushNotifications", value)}
          />
          <SettingItem
            icon="mail"
            label="Email Notifications"
            value={settings.emailNotifications}
            onToggle={(value) => toggleSetting("emailNotifications", value)}
          />
          <SettingItem
            icon="chatbubble"
            label="SMS Notifications"
            value={settings.smsNotifications}
            onToggle={(value) => toggleSetting("smsNotifications", value)}
          />
        </SettingSection>

        {/* App Behavior - Only 3 features */}
        <SettingSection title="App Behavior">
          {/* Auto Refresh */}
          <View style={styles.testRow}>
            <SettingItem
              icon="refresh"
              label="Auto-refresh on focus"
              value={settings.autoRefresh}
              onToggle={(value) => toggleSetting("autoRefresh", value)}
              type="switch"
            />
            <TouchableOpacity
              style={styles.testButton}
              onPress={testAutoRefresh}
            >
              <Text style={[styles.testButtonText, { color: theme.primary }]}>
                Test
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vibration */}
          <View style={styles.testRow}>
            <SettingItem
              icon="phone-portrait"
              label="Vibration"
              value={settings.vibration}
              onToggle={(value) => toggleSetting("vibration", value)}
              type="switch"
            />
            <TouchableOpacity style={styles.testButton} onPress={testVibration}>
              <Text style={[styles.testButtonText, { color: theme.primary }]}>
                Test
              </Text>
            </TouchableOpacity>
          </View>

          {/* Data Saver Mode */}
          <SettingItem
            icon="save"
            label="Data Saver Mode"
            value={settings.dataSaver}
            onToggle={(value) => toggleSetting("dataSaver", value)}
            type="switch"
          />

          <TouchableOpacity style={styles.infoCard} onPress={testDataSaver}>
            <Icon icon="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {settings.dataSaver
                ? "Low quality images, reduced data usage"
                : "Full quality images, normal data usage"}
            </Text>
          </TouchableOpacity>
        </SettingSection>

        {/* Storage */}
        <SettingSection title="Storage">
          <TouchableOpacity style={styles.storageItem} onPress={clearCache}>
            <View style={styles.settingLeft}>
              <Icon icon="trash" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Clear Cache
              </Text>
            </View>
            <Icon
              icon="back"
              size={20}
              color={theme.textSecondary}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <TouchableOpacity
            style={styles.aboutItem}
            onPress={() => Alert.alert("App Version", "PlayConnect v1.0.0")}
          >
            <View style={styles.settingLeft}>
              <Icon icon="information-circle" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                App Version
              </Text>
            </View>
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>
              1.0.0
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aboutItem}
            onPress={() =>
              Alert.alert("Terms", "Terms of service will be available soon")
            }
          >
            <View style={styles.settingLeft}>
              <Icon icon="document-text" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Terms of Service
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aboutItem}
            onPress={() =>
              Alert.alert("Privacy", "Privacy policy will be available soon")
            }
          >
            <View style={styles.settingLeft}>
              <Icon icon="shield" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Privacy Policy
              </Text>
            </View>
          </TouchableOpacity>
        </SettingSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  testButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 5,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  storageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  versionText: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
});
