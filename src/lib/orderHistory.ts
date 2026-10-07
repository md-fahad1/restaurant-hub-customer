import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OrderHistoryItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  note?: string;
}

export interface OrderHistoryEntry {
  orderNumber: string;
  guestPhone: string;
  restaurantSlug: string;
  restaurantName: string;
  total: number;
  placedAt: string;
  // Nicher gulo optional. Purono order e thakbe na
  items?: OrderHistoryItem[];
  currency?: string;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string | number | null;
  deliveryAddress?: string;
}

const HISTORY_KEY = "restaurant-hub-order-history";
const GUEST_INFO_KEY = "restaurant-hub-guest-info";

export async function addOrderToHistory(entry: OrderHistoryEntry) {
  const existing = await getOrderHistory();
  const updated = [entry, ...existing].slice(0, 20); // sorboshesh 20 ta rakhi
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function getOrderHistory(): Promise<OrderHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export interface GuestInfo {
  guestName: string;
  guestPhone: string;
  deliveryAddress?: string;
}

export async function saveGuestInfo(info: GuestInfo) {
  await AsyncStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
}

export async function getGuestInfo(): Promise<GuestInfo | null> {
  const raw = await AsyncStorage.getItem(GUEST_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
