import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  note?: string;
}

interface CartContextValue {
  items: CartLine[];
  restaurantSlug: string | null;
  tableId: string | null;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  setOrderType: (t: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  setRestaurant: (slug: string, tableId: string | null) => void;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "restaurant-hub-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<
    "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("TAKEAWAY");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw: string | null) => {
      if (!raw) return;
      try {
        setItems(JSON.parse(raw).items ?? []);
      } catch {
        // corrupt cache — ignore, start fresh
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }, [items]);

  // নতুন রেস্টুরেন্টের QR স্ক্যান করলে — আগের রেস্টুরেন্টের cart থাকলে সেটা
  // ক্লিয়ার করে দিচ্ছি, কারণ এক অর্ডারে দুই রেস্টুরেন্টের আইটেম মেশা ঠিক না
  function setRestaurant(slug: string, newTableId: string | null) {
    setRestaurantSlug((prevSlug) => {
      if (prevSlug && prevSlug !== slug) {
        setItems([]);
      }
      return slug;
    });
    setTableId(newTableId);
    setOrderType(newTableId ? "DINE_IN" : "TAKEAWAY");
  }

  function addItem(item: Omit<CartLine, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.menuItemId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity } : l)),
    );
  }

  function removeItem(menuItemId: string) {
    setItems((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  }

  function clearCart() {
    setItems([]);
    setRestaurantSlug(null);
    setTableId(null);
  }

  const total = items.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = items.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantSlug,
        tableId,
        orderType,
        setOrderType,
        setRestaurant,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
