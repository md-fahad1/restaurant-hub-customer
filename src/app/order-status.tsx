import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TRACK_ORDER_QUERY, TrackGuestOrderData } from "../lib/graphql";

// রান্নাঘরের status (dine-in / takeaway অর্ডারের জন্য)
const KITCHEN_STEPS = [
  { key: "PENDING", label: "Order placed", icon: "receipt-outline" as const },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    icon: "checkmark-circle-outline" as const,
  },
  { key: "PREPARING", label: "Preparing", icon: "flame-outline" as const },
  { key: "READY", label: "Ready", icon: "fast-food-outline" as const },
  { key: "COMPLETED", label: "Completed", icon: "happy-outline" as const },
];

// ডেলিভারির status (delivery অর্ডারের জন্য — backend DeliveryStatus enum-এর সাথে মিলিয়ে)
const DELIVERY_STEPS = [
  { key: "PENDING", label: "Order received", icon: "receipt-outline" as const },
  { key: "ASSIGNED", label: "Rider assigned", icon: "person-outline" as const },
  { key: "PICKED_UP", label: "Picked up", icon: "bag-check-outline" as const },
  {
    key: "OUT_FOR_DELIVERY",
    label: "On the way",
    icon: "bicycle-outline" as const,
  },
  { key: "DELIVERED", label: "Delivered", icon: "home-outline" as const },
];

type Step = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function StepTimeline({
  steps,
  currentKey,
}: {
  steps: Step[];
  currentKey: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <View className="mb-6">
      {steps.map((step, i) => {
        const active = i <= currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <View key={step.key} className="flex-row">
            <View className="items-center">
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${active ? "bg-brand" : "bg-gray-100"}`}
              >
                <Ionicons
                  name={step.icon}
                  size={17}
                  color={active ? "white" : "#9ca3af"}
                />
              </View>
              {!isLast && (
                <View
                  className={`h-8 w-0.5 ${active ? "bg-brand" : "bg-gray-100"}`}
                />
              )}
            </View>
            <Text
              className={`ml-3 pt-2 text-[15px] ${active ? "font-semibold text-ink" : "text-gray-400"}`}
            >
              {step.label}
            </Text>
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

  const { data, loading, error } = useQuery<TrackGuestOrderData>(
    TRACK_ORDER_QUERY,
    {
      variables: { restaurantSlug, orderNumber, guestPhone },
      pollInterval: 5000,
      skip: !restaurantSlug || !orderNumber || !guestPhone,
    },
  );

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white p-6">
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text className="text-center text-gray-600">
          Could not find this order.
        </Text>
      </View>
    );
  }

  const order = data.trackGuestOrder;
  const isDelivery = order.type === "DELIVERY" && order.delivery;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1 p-5">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xl font-extrabold text-ink">
            Order #{order.orderNumber}
          </Text>
          <View className="rounded-full bg-cream px-3 py-1">
            <Text className="text-xs font-semibold text-amber-800">
              {order.type === "DINE_IN"
                ? "Dine-in"
                : order.type === "DELIVERY"
                  ? "Delivery"
                  : "Takeaway"}
            </Text>
          </View>
        </View>
        <Text className="mb-6 text-[15px] text-gray-500">
          Total: ৳{order.total}
        </Text>

        {isDelivery ? (
          <>
            <StepTimeline
              steps={DELIVERY_STEPS}
              currentKey={order.delivery!.status}
            />

            <View className="mb-5 rounded-2xl border border-gray-100 p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text className="flex-1 text-[13px] text-gray-600">
                  {order.delivery!.deliveryAddress}
                </Text>
              </View>

              {order.delivery!.partnerName ? (
                <View className="mt-2 flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <View className="flex-row items-center gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-cream">
                      <Ionicons name="bicycle" size={18} color="#92400e" />
                    </View>
                    <View>
                      <Text className="text-[14px] font-semibold text-ink">
                        {order.delivery!.partnerName}
                      </Text>
                      <Text className="text-[12px] text-gray-500">
                        Your delivery rider
                      </Text>
                    </View>
                  </View>
                  {order.delivery!.partnerPhone && (
                    <TouchableOpacity
                      className="h-10 w-10 items-center justify-center rounded-full bg-brand"
                      onPress={() =>
                        Linking.openURL(`tel:${order.delivery!.partnerPhone}`)
                      }
                    >
                      <Ionicons name="call" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text className="mt-2 text-[13px] text-gray-400">
                  Waiting for a rider to be assigned…
                </Text>
              )}
            </View>
          </>
        ) : (
          <StepTimeline steps={KITCHEN_STEPS} currentKey={order.status} />
        )}

        <Text className="mb-2 font-semibold text-ink">Items</Text>
        {order.items.map((item, i) => (
          <View
            key={i}
            className="flex-row justify-between border-b border-gray-100 py-2"
          >
            <Text className="text-gray-700">{item.name}</Text>
            <Text className="text-gray-500">× {item.quantity}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
