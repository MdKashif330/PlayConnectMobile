import React, { useState, useEffect, useCallback } from "react"; // Add useCallback
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Add useFocusEffect
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSettings } from "../../hooks/useAppSettings"; // Add this import
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Language() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { triggerVibration, autoRefresh } = useAppSettings(); // Add this line

  // Create styles FIRST
  const styles = createStyles(theme);

  const [selectedLanguage, setSelectedLanguage] = useState("english");

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefresh) {
        triggerVibration();
        loadSavedLanguage();
      }
    }, [autoRefresh]),
  );

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("appLanguage");
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error("Error loading language:", error);
    }
  };

  const languages = [
    { id: "english", name: "English", nativeName: "English", flag: "🇬🇧" },
    { id: "urdu", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
    { id: "arabic", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { id: "spanish", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { id: "french", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { id: "german", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { id: "chinese", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { id: "hindi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { id: "bengali", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
    { id: "turkish", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  ];

  const handleLanguageSelect = async (languageId) => {
    triggerVibration(); // Vibration on language selection

    setSelectedLanguage(languageId);

    try {
      // Save language preference to AsyncStorage
      await AsyncStorage.setItem("appLanguage", languageId);

      // Here you would typically update the app's language context
      // and reload strings/resources

      triggerVibration(); // Success vibration
      Alert.alert(
        "Language Changed",
        `App language has been set to ${languages.find((l) => l.id === languageId)?.name}`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerVibration(); // Vibration on back
            navigation.goBack();
          }}
        >
          <Icon icon="back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Your Preferred Language</Text>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageItem,
                selectedLanguage === language.id && styles.selectedItem,
              ]}
              onPress={() => handleLanguageSelect(language.id)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.flag}>{language.flag}</Text>
                <View style={styles.languageNames}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.nativeName}>{language.nativeName}</Text>
                </View>
              </View>

              {selectedLanguage === language.id && (
                <Icon icon="checkmark" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Icon icon="info" size={20} color={theme.primary} />
          <Text style={styles.noteText}>
            Changing language will update the app interface. Some content may
            not be fully translated.
          </Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help with translation?</Text>
          <Text style={styles.helpText}>
            If you find any translation issues, please contact support at
            support@playconnect.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Move styles to a function that accepts theme
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 15,
    },
    languageList: {
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 2,
      marginBottom: 20,
    },
    languageItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    selectedItem: {
      backgroundColor: theme.primaryLight,
    },
    languageInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    flag: {
      fontSize: 30,
      marginRight: 15,
    },
    languageNames: {
      justifyContent: "center",
    },
    languageName: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text,
    },
    nativeName: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    noteCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    noteText: {
      flex: 1,
      marginLeft: 10,
      color: theme.primary,
      fontSize: 14,
    },
    helpSection: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
    },
    helpTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
  });
