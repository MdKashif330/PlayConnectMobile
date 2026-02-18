import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Icon from "../../components/Icon";
import { useNavigation } from "@react-navigation/native";

export default function FAQs() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const faqCategories = [
    {
      title: "General Questions",
      data: [
        {
          id: 1,
          question: "What is PlayConnect?",
          answer:
            "PlayConnect is a sports venue booking platform that allows users to book courts for various sports like badminton, tennis, football, cricket, and more. It also provides managers with tools to manage their venues efficiently.",
        },
        {
          id: 2,
          question: "How do I create an account?",
          answer:
            "You can create an account by downloading the PlayConnect app and clicking on 'Sign Up'. You'll need to provide your name, email address, and create a password. You can register as either a user or a venue manager.",
        },
        {
          id: 3,
          question: "Is PlayConnect free to use?",
          answer:
            "Yes, the app is free to download and use. You only pay for the court bookings you make. Venue managers pay a small commission on each booking through their venue.",
        },
      ],
    },
    {
      title: "Booking Related",
      data: [
        {
          id: 4,
          question: "How do I book a court?",
          answer:
            "To book a court: 1) Select your desired sport, 2) Choose a venue, 3) Pick a date and available time slot, 4) Complete the payment, 5) Receive confirmation. You can book up to 30 days in advance.",
        },
        {
          id: 5,
          question: "Can I book multiple time slots?",
          answer:
            "Yes, you can select multiple consecutive time slots for a single booking. They will be combined into one booking with the total duration displayed. Non-consecutive slots will create separate bookings.",
        },
        {
          id: 6,
          question: "How do I cancel a booking?",
          answer:
            "You can cancel a booking from your bookings screen. Cancellation is free up to 24 hours before the booking time. Late cancellations may be subject to a fee as per venue policy.",
        },
        {
          id: 7,
          question: "What is a multi-day booking?",
          answer:
            "Multi-day bookings are for reservations that span 3 or more consecutive days. These appear in the 'Reservations' tab and are ideal for tournaments or extended events.",
        },
      ],
    },
    {
      title: "Payments",
      data: [
        {
          id: 8,
          question: "What payment methods are accepted?",
          answer:
            "We accept various payment methods including credit/debit cards, bank transfers, and mobile payments. The available options may vary by venue.",
        },
        {
          id: 9,
          question: "When do I need to complete payment?",
          answer:
            "Payment must be completed within 30 minutes of creating a booking, otherwise the booking will be automatically cancelled.",
        },
        {
          id: 10,
          question: "How do refunds work?",
          answer:
            "Refunds are processed back to the original payment method within 5-7 business days. The refund amount depends on the cancellation policy of the venue.",
        },
      ],
    },
    {
      title: "For Venue Managers",
      data: [
        {
          id: 11,
          question: "How do I register as a manager?",
          answer:
            "During sign up, select 'Manager Account' and provide your venue details. Your account will be reviewed and approved by our admin team within 24-48 hours.",
        },
        {
          id: 12,
          question: "How do I mark vacation dates?",
          answer:
            "Go to your dashboard, tap on the calendar, select the dates you want to mark as vacation, and add a reason. These dates will be blocked for bookings.",
        },
        {
          id: 13,
          question: "Can I manage multiple venues?",
          answer:
            "Yes, as a manager you can add and manage multiple venues from your account. Each venue will have its own dashboard and settings.",
        },
        {
          id: 14,
          question: "How do I approve bookings?",
          answer:
            "Go to the 'Unapproved' tab in your bookings section. You can approve or reject pending bookings. Approved bookings will move to the 'Approved' tab.",
        },
      ],
    },
    {
      title: "Account & Security",
      data: [
        {
          id: 15,
          question: "How do I change my password?",
          answer:
            "Go to Profile → Change Password. You'll need to enter your current password and then your new password. Make sure to choose a strong password.",
        },
        {
          id: 16,
          question: "What if I forget my password?",
          answer:
            "On the login screen, tap 'Forgot Password' and enter your email address. You'll receive instructions to reset your password.",
        },
        {
          id: 17,
          question: "How do I delete my account?",
          answer:
            "Go to Profile → Delete Account. Please note that this action is permanent and cannot be undone. All your data will be removed from our system.",
        },
      ],
    },
  ];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFAQs = faqCategories
    .map((category) => ({
      ...category,
      data: category.data.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.data.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon icon="back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon icon="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon icon="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((category, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.faqList}>
                {category.data.map((item) => (
                  <View key={item.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.questionContainer}
                      onPress={() => toggleExpand(item.id)}
                    >
                      <Text style={styles.question}>{item.question}</Text>
                      <Icon
                        icon={
                          expandedId === item.id ? "chevron-up" : "chevron-down"
                        }
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {expandedId === item.id && (
                      <View style={styles.answerContainer}>
                        <Text style={styles.answer}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResults}>
            <Icon icon="help-circle" size={60} color="#ccc" />
            <Text style={styles.noResultsText}>No FAQs found</Text>
            <Text style={styles.noResultsSubText}>
              Try searching with different keywords
            </Text>
          </View>
        )}

        {/* Still Need Help */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Still Need Help?</Text>
          <Text style={styles.helpText}>
            Can't find what you're looking for? Contact our support team
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate("AboutUs")}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  searchContainer: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    paddingLeft: 5,
  },
  faqList: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "white",
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginRight: 10,
  },
  answerContainer: {
    padding: 15,
    paddingTop: 0,
    backgroundColor: "#f9f9f9",
  },
  answer: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
    marginBottom: 5,
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#999",
  },
  helpSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  contactButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
