import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReceiptModal } from "../components/ReceiptModal";
import { cardShadow } from "../constants/ui";
import { useCart } from "../context/CartContext";
import { getOrderHistory, OrderHistoryEntry } from "../lib/orderHistory";

function prettyName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export default function Orders() {
  const router = useRouter();
  const { addItem, clearCart, setRestaurant, itemCount } = useCart();
  const { restaurantSlug } = useLocalSearchParams<{
    restaurantSlug?: string;
  }>();
  const scoped = !!restaurantSlug;

  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [receiptFor, setReceiptFor] = useState<OrderHistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      getOrderHistory().then(setHistory);
    }, []),
  );

  const visibleOrders = useMemo(
    () =>
      scoped
        ? history.filter((o) => o.restaurantSlug === restaurantSlug)
        : history,
    [history, scoped, restaurantSlug],
  );

  const title = scoped ? "My Orders Here" : "My Orders";
  const scopedName = scoped
    ? prettyName(visibleOrders[0]?.restaurantName || restaurantSlug!)
    : "";

  function reorder(entry: OrderHistoryEntry) {
    const lines = entry.items ?? [];
    if (lines.length === 0) return;

    const run = () => {
      clearCart();
      setRestaurant(entry.restaurantSlug, null);
      lines.forEach((l) =>
        addItem(
          {
            menuItemId: l.menuItemId,
            name: l.name,
            price: l.price,
            image: l.image,
            note: l.note,
          },
          l.quantity,
        ),
      );
      // Order type (dine-in / takeaway / delivery) abar bachte dei
      router.push("/order-type");
    };

    if (itemCount > 0) {
      Alert.alert(
        "Replace your cart?",
        "Your current cart will be replaced with this past order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace", style: "destructive", onPress: run },
        ],
      );
    } else {
      run();
    }
  }

  if (visibleOrders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Stack.Screen options={{ title }} />
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-cream">
          <Ionicons name="receipt-outline" size={42} color="#ea580c" />
        </View>
        <Text className="text-xl font-extrabold text-ink">No orders yet</Text>
        <Text className="mt-1 text-center text-[14px] text-gray-500">
          {scoped
            ? `You haven't ordered from ${scopedName} yet.`
            : "Your past orders will show up here."}
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-2xl bg-brand px-8 py-3.5"
          onPress={() => (scoped ? router.back() : router.replace("/"))}
        >
          <Text className="font-bold text-white">
            {scoped ? "Back to menu" : "Start ordering"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <Stack.Screen options={{ title }} />

      {scoped && (
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-2xl bg-cream px-4 py-3">
          <Ionicons name="restaurant" size={16} color="#ea580c" />
          <Text className="flex-1 text-[13px] font-semibold text-brand">
            Showing orders from {scopedName}
          </Text>
        </View>
      )}

      <FlatList
        data={visibleOrders}
        keyExtractor={(o) => o.orderNumber}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const hasItems = !!item.items && item.items.length > 0;
          const summary = item.items
            ?.map((l) => `${l.quantity}× ${l.name}`)
            .join(", ");

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              className="mb-3 rounded-3xl bg-white p-4"
              style={cardShadow}
              onPress={() =>
                router.push({
                  pathname: "/order-status",
                  params: {
                    orderNumber: item.orderNumber,
                    guestPhone: item.guestPhone,
                    restaurantSlug: item.restaurantSlug,
                  },
                })
              }
            >
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-cream">
                  <Ionicons name="restaurant" size={20} color="#ea580c" />
                </View>

                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-bold text-ink"
                  >
                    {prettyName(item.restaurantName || item.restaurantSlug)}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-gray-400">
                    Order #{item.orderNumber}
                  </Text>
                </View>

                <Text className="text-[16px] font-extrabold text-brand">
                  {item.currency ?? "৳"}
                  {item.total}
                </Text>
              </View>

              {summary ? (
                <Text
                  numberOfLines={2}
                  className="mt-3 text-[13px] leading-5 text-gray-600"
                >
                  {summary}
                </Text>
              ) : null}

              <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="time-outline" size={14} color="#9ca3af" />
                  <Text className="text-[12px] text-gray-500">
                    {formatWhen(item.placedAt)}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {hasItems && (
                    <TouchableOpacity
                      onPress={() => setReceiptFor(item)}
                      className="flex-row items-center gap-1.5 rounded-full border border-brand px-3 py-2 active:opacity-80"
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={14}
                        color="#ea580c"
                      />
                      <Text className="text-[12px] font-bold text-brand">
                        Receipt
                      </Text>
                    </TouchableOpacity>
                  )}
                  {hasItems && (
                    <TouchableOpacity
                      onPress={() => reorder(item)}
                      className="flex-row items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 active:opacity-90"
                    >
                      <Ionicons name="refresh" size={14} color="white" />
                      <Text className="text-[12px] font-bold text-white">
                        Order again
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Receipt (net chhara, phone er history theke) */}
      {receiptFor && (
        <ReceiptModal
          visible
          onClose={() => setReceiptFor(null)}
          entry={receiptFor}
          restaurantSlug={receiptFor.restaurantSlug}
          order={{
            orderNumber: receiptFor.orderNumber,
            createdAt: receiptFor.placedAt,
            type: receiptFor.orderType,
            tableNumber: receiptFor.tableNumber,
            total: receiptFor.total,
            deliveryAddress: receiptFor.deliveryAddress ?? null,
            items: (receiptFor.items ?? []).map((i) => ({
              name: i.name,
              quantity: i.quantity,
            })),
          }}
        />
      )}
    </SafeAreaView>
  );
}
