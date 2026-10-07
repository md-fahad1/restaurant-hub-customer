import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { OrderType } from "../constants/ui";

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
  orderType: OrderType;
  hydrated: boolean; // storage theke load shesh hoyeche kina
  setOrderType: (t: OrderType) => void;
  setRestaurant: (slug: string, tableId: string | null) => void;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  leaveRestaurant: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "restaurant-hub-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [hydrated, setHydrated] = useState(false);

  // App khulle storage theke cart + restaurant + table + order type phire ano
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        // restaurantSlug chhara save kora cart ta purono version er,
        // kon restaurant er item jani na, tai ignore kore dichhi
        if (saved.restaurantSlug && Array.isArray(saved.items)) {
          setItems(saved.items);
          setRestaurantSlug(saved.restaurantSlug);
          setTableId(saved.tableId ?? null);
          setOrderType(saved.orderType ?? "TAKEAWAY");
        }
      })
      .catch(() => {
        // corrupt cache — ignore, fresh start
      })
      .finally(() => setHydrated(true));
  }, []);

  // Load shesh howar por-i save korbo, nahole khali state diye overwrite hobe
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, restaurantSlug, tableId, orderType }),
    ).catch(() => {});
  }, [hydrated, items, restaurantSlug, tableId, orderType]);

  // Notun restaurant er QR scan korle ager restaurant er cart clear
  // (ek order e duto restaurant er item mishe jaoa thik na)
  function setRestaurant(slug: string, newTableId: string | null) {
    if (restaurantSlug && restaurantSlug !== slug) {
      setItems([]);
    }
    setRestaurantSlug(slug);
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

  // Order shesh hole shudhu item gula muchi, restaurant mone rakhi
  function clearCart() {
    setItems([]);
  }

  // Onno restaurant e jete chaile: sob bhule jai
  function leaveRestaurant() {
    setItems([]);
    setRestaurantSlug(null);
    setTableId(null);
    setOrderType("TAKEAWAY");
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
        hydrated,
        setOrderType,
        setRestaurant,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        leaveRestaurant,
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
  orderType: OrderType;
  hydrated: boolean; // storage theke load shesh hoyeche kina
  setOrderType: (t: OrderType) => void;
  setRestaurant: (slug: string, tableId: string | null) => void;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  leaveRestaurant: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "restaurant-hub-cart";

// Table QR scan er por koto khon table mone rakhbo (6 ghonta)
const TABLE_TTL_MS = 6 * 60 * 60 * 1000;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableSetAt, setTableSetAt] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [hydrated, setHydrated] = useState(false);

  // App khulle storage theke cart + restaurant + table + order type phire ano
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        // restaurantSlug chhara save kora cart ta purono version er,
        // kon restaurant er item jani na, tai ignore kore dichhi
        if (saved.restaurantSlug && Array.isArray(saved.items)) {
          // Table QR 6 ghonta por expire (kal er table ajo jeno na dekhay)
          const tableFresh =
            !!saved.tableId &&
            typeof saved.tableSetAt === "number" &&
            Date.now() - saved.tableSetAt < TABLE_TTL_MS;

          setItems(saved.items);
          setRestaurantSlug(saved.restaurantSlug);
          setTableId(tableFresh ? saved.tableId : null);
          setTableSetAt(tableFresh ? saved.tableSetAt : null);

          if (!tableFresh && saved.orderType === "DINE_IN") {
            setOrderType("TAKEAWAY");
          } else {
            setOrderType(saved.orderType ?? "TAKEAWAY");
          }
        }
      })
      .catch(() => {
        // corrupt cache — ignore, fresh start
      })
      .finally(() => setHydrated(true));
  }, []);

  // Load shesh howar por-i save korbo, nahole khali state diye overwrite hobe
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, restaurantSlug, tableId, tableSetAt, orderType }),
    ).catch(() => {});
  }, [hydrated, items, restaurantSlug, tableId, tableSetAt, orderType]);

  // Notun restaurant er QR scan korle ager restaurant er cart clear
  // (ek order e duto restaurant er item mishe jaoa thik na)
  function setRestaurant(slug: string, newTableId: string | null) {
    if (restaurantSlug && restaurantSlug !== slug) {
      setItems([]);
    }
    setRestaurantSlug(slug);
    setTableId(newTableId);
    setTableSetAt(newTableId ? Date.now() : null);
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

  // Order shesh hole shudhu item gula muchi, restaurant mone rakhi
  function clearCart() {
    setItems([]);
  }

  // Onno restaurant e jete chaile: sob bhule jai
  function leaveRestaurant() {
    setItems([]);
    setRestaurantSlug(null);
    setTableId(null);
    setTableSetAt(null);
    setOrderType("TAKEAWAY");
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
        hydrated,
        setOrderType,
        setRestaurant,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        leaveRestaurant,
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
