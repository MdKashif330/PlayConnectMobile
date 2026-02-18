import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Language() {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState("english");

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
    setSelectedLanguage(languageId);

    try {
      // Save language preference to AsyncStorage
      await AsyncStorage.setItem("appLanguage", languageId);

      // Here you would typically update the app's language context
      // and reload strings/resources

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color="#333" />
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
                <Icon icon="checkmark" size={24} color="#2196F3" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Icon icon="info" size={20} color="#2196F3" />
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 15,
  },
  languageList: {
    backgroundColor: "white",
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
    borderBottomColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#E3F2FD",
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
    color: "#333",
  },
  nativeName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    color: "#1565C0",
    fontSize: 14,
  },
  helpSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
