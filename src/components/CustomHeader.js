import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "../components/Icon";
import { useNavigation } from "@react-navigation/native";

const CustomHeader = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {/* Left: Logo */}
      <Text style={styles.logo}>PlayConnect</Text>

      {/* Right: Notification + Profile */}
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon
            icon="notificationsFill"
            outline={false}
            size={22}
            color="#333"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon icon="profileFill" outline={false} size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 15,
  },
  profileButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default CustomHeader;
