import api from "../services/authService";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http")) return imagePath;

  // Get the base URL from your API configuration
  const baseURL = api.defaults.baseURL;
  const baseWithoutApi = baseURL.replace("/api", "");

  // Ensure the path starts with /
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${baseWithoutApi}${cleanPath}`;
};
