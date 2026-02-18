import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Icons } from "../utils/icons";

export default function Icon({
  icon,
  name,
  size = 24,
  color = "#333",
  style,
  outline = true,
}) {
  const iconKey = icon || name || "error";

  let iconName = Icons[iconKey];

  if (!iconName) {
    iconName = iconKey;
  }

  if (outline && !iconName.includes("-outline") && !iconKey.includes("Fill")) {
    iconName = `${iconName}-outline`;
  }

  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
