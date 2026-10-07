import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReceiptModal } from "../components/ReceiptModal";
import { cardShadow } from "../constants/ui";
import { TRACK_ORDER_QUERY, TrackGuestOrderData } from "../lib/graphql";
import { getOrderHistory, OrderHistoryEntry } from "../lib/orderHistory";

// Expo Go (SDK 53+) te expo-notifications kaj kore na — shudhu dev/production
// build e load kora hocche
const isExpoGo = Constants.appOwnership === "expo";
let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  Notifications = require("expo-notifications");
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Your order has been confirmed!",
  PREPARING: "The kitchen is preparing your order.",
  READY: "Your order is ready!",
  COMPLETED: "Order completed. Enjoy your meal!",
  ASSIGNED: "A rider has been assigned to your order.",
  PICKED_UP: "Your order has been picked up.",
  OUT_FOR_DELIVERY: "Your order is on the way!",
  DELIVERED: "Your order has been delivered!",
};

const HEADLINES: Record<string, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Order confirmed",
  PREPARING: "Preparing your food",
  READY: "Ready for you",
  COMPLETED: "Enjoy your meal!",
  ASSIGNED: "Rider assigned",
  PICKED_UP: "Order picked up",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
};

type Step = {
  key: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const KITCHEN_STEPS: Step[] = [
  {
    key: "PENDING",
    label: "Order placed",
    hint: "We received your order",
    icon: "receipt-outline",
  },
  {
    key: "CONFIRMED",
    label: "Order confirmed",
    hint: "The restaurant accepted it",
    icon: "checkmark-circle-outline",
  },
  {
    key: "PREPARING",
    label: "Preparing your food",
    hint: "Your meal is being cooked",
    icon: "flame-outline",
  },
  {
    key: "READY",
    label: "Ready",
    hint: "Ready for you",
    icon: "fast-food-outline",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    hint: "Enjoy your meal",
    icon: "happy-outline",
  },
];

const DELIVERY_STEPS: Step[] = [
  {
    key: "PENDING",
    label: "Order received",
    hint: "Waiting for a rider",
    icon: "receipt-outline",
  },
  {
    key: "ASSIGNED",
    label: "Rider assigned",
    hint: "A rider will pick it up",
    icon: "person-outline",
  },
  {
    key: "PICKED_UP",
    label: "Picked up",
    hint: "Rider has your food",
    icon: "bag-check-outline",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    hint: "On the way to you",
    icon: "bicycle-outline",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    hint: "Enjoy your meal",
    icon: "home-outline",
  },
];

function formatTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function StepTimeline({
  steps,
  currentKey,
  history,
  createdAt,
}: {
  steps: Step[];
  currentKey: string;
  history: { status: string; changedAt: string }[];
  createdAt: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey),
  );
  const finished = currentIndex === steps.length - 1;

  return (
    <View>
      {steps.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && finished);
        const current = i === currentIndex && !finished;
        const isLast = i === steps.length - 1;
        const time =
          formatTime(history.find((h) => h.status === step.key)?.changedAt) ??
          (i === 0 ? formatTime(createdAt) : null);

        return (
          <View key={step.key} className="flex-row">
            <View className="items-center">
              <View
                className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-brand bg-brand"
                    : current
                      ? "border-brand bg-cream"
                      : "border-gray-200 bg-white"
                }`}
              >
                {done ? (
                  <Ionicons name="checkmark" size={18} color="white" />
                ) : current ? (
                  <Ionicons name={step.icon} size={17} color="#ea580c" />
                ) : (
                  <Ionicons name={step.icon} size={16} color="#d1d5db" />
                )}
              </View>
              {!isLast && (
                <View
                  className={`my-1 w-0.5 flex-1 ${i < currentIndex ? "bg-brand" : "bg-gray-200"}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </View>

            <View className="ml-3 flex-1 pb-5 pt-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-[15px] ${done || current ? "font-bold text-ink" : "font-medium text-gray-400"}`}
                >
                  {step.label}
                </Text>
                {(time && done) || current ? (
                  <Text className="text-xs text-gray-400">{time ?? ""}</Text>
                ) : null}
              </View>
              <Text
                className={`mt-0.5 text-[13px] ${current ? "text-brand" : "text-gray-400"}`}
              >
                {step.hint}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderStatus() {
  const { orderNumber, guestPhone, restaurantSlug } = useLocalSearchParams<{
    orderNumber: string;
    guestPhone: string;
    restaurantSlug: string;
  }>();

  const previousStatusRef = useRef<string | null>(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [entry, setEntry] = useState<OrderHistoryEntry | null>(null);

  // Phone e save kora order history theke dam ar restaurant naam ana
  useEffect(() => {
    getOrderHistory().then((list) =>
      setEntry(list.find((o) => o.orderNumber === orderNumber) ?? null),
    );
  }, [orderNumber]);

  const { data, loading, error } = useQuery<TrackGuestOrderData>(
    TRACK_ORDER_QUERY,
    {
      variables: { restaurantSlug, orderNumber, guestPhone },
      pollInterval: 5000,
      skip: !restaurantSlug || !orderNumber || !guestPhone,
    },
  );

  useEffect(() => {
    if (!Notifications) return;
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (!Notifications) return;

    const order = data?.trackGuestOrder;
    if (!order) return;

    const currentStatus = order.delivery ? order.delivery.status : order.status;

    if (
      previousStatusRef.current &&
      previousStatusRef.current !== currentStatus
    ) {
      const message =
        STATUS_LABELS[currentStatus] ?? `Order status: ${currentStatus}`;
      Notifications.scheduleNotificationAsync({
        content: {
          title: `Order #${order.orderNumber}`,
          body: message,
        },
        trigger: null,
      });
    }
    previousStatusRef.current = currentStatus;
  }, [data]);

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ title: "Track Order" }} />
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white p-6">
        <Stack.Screen options={{ title: "Track Order" }} />
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text className="text-center text-gray-600">
          Could not find this order.
        </Text>
      </View>
    );
  }

  const order = data.trackGuestOrder;
  const isDelivery = order.type === "DELIVERY" && !!order.delivery;
  const steps = isDelivery ? DELIVERY_STEPS : KITCHEN_STEPS;
  const currentKey = isDelivery ? order.delivery!.status : order.status;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey),
  );
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const currentStep = steps[currentIndex];

  const typeLabel =
    order.type === "DINE_IN"
      ? order.tableNumber
        ? `Dine-in · Table ${order.tableNumber}`
        : "Dine-in"
      : order.type === "DELIVERY"
        ? "Delivery"
        : "Takeaway";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <Stack.Screen options={{ title: "Track Order" }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View className="overflow-hidden rounded-3xl bg-brand p-5">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/10" />

          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {typeLabel}
              </Text>
            </View>
            <Text className="text-xs font-semibold text-white/80">
              #{order.orderNumber}
            </Text>
          </View>

          <View className="mt-5 flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <Ionicons name={currentStep.icon} size={26} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-extrabold text-white">
                {HEADLINES[currentKey] ?? currentStep.label}
              </Text>
              <Text className="mt-0.5 text-[13px] text-white/85">
                {STATUS_LABELS[currentKey] ?? currentStep.hint}
              </Text>
            </View>
          </View>

          <View className="mt-5 h-2 overflow-hidden rounded-full bg-white/25">
            <View
              className="h-2 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </View>
          <Text className="mt-2 text-[12px] text-white/80">
            Step {currentIndex + 1} of {steps.length}
          </Text>
        </View>

        {/* Timeline */}
        <View className="mt-4 rounded-3xl bg-white p-5 pb-0" style={cardShadow}>
          <StepTimeline
            steps={steps}
            currentKey={currentKey}
            history={order.history}
            createdAt={order.createdAt}
          />
        </View>

        {/* Delivery address + rider */}
        {isDelivery && (
          <View className="mt-4 rounded-3xl bg-white p-4" style={cardShadow}>
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
                <Ionicons name="location" size={18} color="#ea580c" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400">Delivering to</Text>
                <Text className="mt-0.5 text-[14px] font-semibold text-ink">
                  {order.delivery!.deliveryAddress}
                </Text>
              </View>
            </View>

            <View className="mt-4 border-t border-gray-100 pt-4">
              {order.delivery!.partnerName ? (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-brand">
                      <Text className="text-base font-bold text-white">
                        {order.delivery!.partnerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-ink">
                        {order.delivery!.partnerName}
                      </Text>
                      <Text className="text-[12px] text-gray-500">
                        Your delivery rider
                      </Text>
                    </View>
                  </View>
                  {order.delivery!.partnerPhone && (
                    <TouchableOpacity
                      className="h-11 w-11 items-center justify-center rounded-full bg-brand active:opacity-80"
                      onPress={() =>
                        Linking.openURL(`tel:${order.delivery!.partnerPhone}`)
                      }
                    >
                      <Ionicons name="call" size={18} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#ea580c" />
                  <Text className="text-[13px] text-gray-500">
                    Waiting for a rider to be assigned…
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Items */}
        <View className="mt-4 rounded-3xl bg-surface p-4">
          <Text className="mb-2 text-[15px] font-extrabold text-ink">
            Order summary
          </Text>
          {order.items.map((item, i) => (
            <View key={i} className="flex-row items-center py-1.5">
              <View className="mr-3 h-6 min-w-[24px] items-center justify-center rounded-md bg-white px-1.5">
                <Text className="text-xs font-bold text-brand">
                  {item.quantity}×
                </Text>
              </View>
              <Text className="flex-1 text-[14px] text-gray-700">
                {item.name}
              </Text>
            </View>
          ))}
          <View className="mt-2 flex-row justify-between border-t border-gray-200 pt-3">
            <Text className="text-base font-extrabold text-ink">Total</Text>
            <Text className="text-lg font-extrabold text-brand">
              ৳{order.total}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setReceiptOpen(true)}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-white py-3.5 active:opacity-80"
        >
          <Ionicons name="receipt-outline" size={18} color="#ea580c" />
          <Text className="text-[15px] font-bold text-brand">View receipt</Text>
        </TouchableOpacity>
      </ScrollView>

      <ReceiptModal
        visible={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={{
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          type: order.type,
          tableNumber: order.tableNumber,
          total: order.total,
          deliveryAddress: order.delivery?.deliveryAddress ?? null,
          items: order.items,
        }}
        entry={entry}
        restaurantSlug={restaurantSlug}
      />
    </SafeAreaView>
  );
}
