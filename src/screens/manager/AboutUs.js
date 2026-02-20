import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext"; // Add this import

export default function AboutUs() {
  const navigation = useNavigation();
  const { theme } = useTheme(); // Add this line

  const developers = [
    {
      name: "Muhammad Daniyal",
      role: "Lead Developer",
      email: "daniyal@playconnect.com",
      icon: "person",
    },
    {
      name: "Ahmed Raza",
      role: "Backend Developer",
      email: "ahmed@playconnect.com",
      icon: "person",
    },
    {
      name: "Fatima Khan",
      role: "UI/UX Designer",
      email: "fatima@playconnect.com",
      icon: "person",
    },
    {
      name: "Ali Hassan",
      role: "Mobile Developer",
      email: "ali@playconnect.com",
      icon: "person",
    },
  ];

  const features = [
    "Easy court booking for multiple sports",
    "Real-time availability checking",
    "Multi-day booking support",
    "Manager dashboard for venue management",
    "Vacation scheduling for venues",
    "Booking history and tracking",
    "Payment integration",
    "Push notifications",
  ];

  const openLink = (url) => {
    Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open link"));
  };

  // Create styles with theme
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* App Logo and Name */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Icon icon="sports" size={60} color="white" />
          </View>
          <Text style={styles.appName}>PlayConnect</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appSlogan}>Connect. Play. Repeat.</Text>
        </View>

        {/* App Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About PlayConnect</Text>
          <Text style={styles.cardText}>
            PlayConnect is a comprehensive sports venue booking platform that
            connects sports enthusiasts with quality playing facilities.
            Launched in 2024, our mission is to make sports facility booking
            seamless, efficient, and accessible for everyone.
          </Text>
          <Text style={styles.cardText}>
            Whether you're a casual player looking for a quick game or a
            tournament organizer needing multiple courts, PlayConnect provides
            the tools you need to find, book, and manage sports facilities with
            ease.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon icon="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10+</Text>
            <Text style={styles.statLabel}>Sports</Text>
          </View>
        </View>

        {/* Development Team */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Development Team</Text>
          {developers.map((dev, index) => (
            <View key={index} style={styles.developerItem}>
              <View style={styles.developerIcon}>
                <Icon icon={dev.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.developerInfo}>
                <Text style={styles.developerName}>{dev.name}</Text>
                <Text style={styles.developerRole}>{dev.role}</Text>
                <Text style={styles.developerEmail}>{dev.email}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get in Touch</Text>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLink("mailto:support@playconnect.com")}
          >
            <Icon icon="mail" size={22} color={theme.primary} />
            <Text style={styles.contactText}>support@playconnect.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLink("https://www.playconnect.com")}
          >
            <Icon icon="globe" size={22} color={theme.primary} />
            <Text style={styles.contactText}>www.playconnect.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLink("tel:+1234567890")}
          >
            <Icon icon="call" size={22} color={theme.primary} />
            <Text style={styles.contactText}>+1 (234) 567-890</Text>
          </TouchableOpacity>

          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => openLink("https://facebook.com/playconnect")}
            >
              <Icon icon="logo-facebook" size={30} color="#3b5998" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => openLink("https://twitter.com/playconnect")}
            >
              <Icon icon="logo-twitter" size={30} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => openLink("https://instagram.com/playconnect")}
            >
              <Icon icon="logo-instagram" size={30} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() =>
                openLink("https://linkedin.com/company/playconnect")
              }
            >
              <Icon icon="logo-linkedin" size={30} color="#0077B5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>
            © 2024 PlayConnect. All rights reserved.
          </Text>
          <Text style={styles.copyrightText}>Made with ❤️ in Pakistan</Text>
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
    },
    logoSection: {
      backgroundColor: theme.primary,
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    appName: {
      fontSize: 28,
      fontWeight: "bold",
      color: "white",
      marginBottom: 5,
    },
    appVersion: {
      fontSize: 16,
      color: "rgba(255,255,255,0.8)",
      marginBottom: 5,
    },
    appSlogan: {
      fontSize: 18,
      color: "white",
      fontStyle: "italic",
    },
    card: {
      backgroundColor: theme.card,
      margin: 15,
      marginBottom: 0,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 15,
    },
    cardText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 10,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    featureText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 12,
      flex: 1,
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: theme.card,
      margin: 15,
      marginBottom: 0,
      padding: 20,
      borderRadius: 12,
      elevation: 2,
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 5,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    developerItem: {
      flexDirection: "row",
      marginBottom: 20,
    },
    developerIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    developerInfo: {
      flex: 1,
    },
    developerName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    developerRole: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    developerEmail: {
      fontSize: 12,
      color: theme.primary,
      marginTop: 2,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    contactText: {
      fontSize: 15,
      color: theme.text,
      marginLeft: 15,
    },
    socialLinks: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    socialIcon: {
      padding: 5,
    },
    copyright: {
      padding: 20,
      alignItems: "center",
    },
    copyrightText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
  });
