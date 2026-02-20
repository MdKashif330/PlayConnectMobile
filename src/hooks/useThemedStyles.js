import { useTheme } from "../contexts/ThemeContext";

export const useThemedStyles = (styleCreator) => {
  const { theme } = useTheme();
  return styleCreator(theme);
};
