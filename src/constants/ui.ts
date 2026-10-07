import { Ionicons } from "@expo/vector-icons";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export const ORDER_TYPES: {
  type: OrderType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}[] = [
  {
    type: "DINE_IN",
    icon: "restaurant-outline",
    title: "Dine-in",
    subtitle: "I'm at the restaurant",
  },
  {
    type: "TAKEAWAY",
    icon: "bag-handle-outline",
    title: "Takeaway",
    subtitle: "I'll pick it up",
  },
  {
    type: "DELIVERY",
    icon: "bicycle-outline",
    title: "Delivery",
    subtitle: "Bring it to me",
  },
];

// Soft card shadow (iOS + Android dutei kaj kore)
export const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
