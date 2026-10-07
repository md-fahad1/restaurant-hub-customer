import { ErrorState } from "@/components/ErrorState";
import { ServerWakingNotice } from "@/components/ServerWakingNotice";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cardShadow, ORDER_TYPES } from "../constants/ui";
import { useCart } from "../context/CartContext";
import { usePublicMenu } from "../hooks/use-public-menu";
import { useSlowLoading } from "../hooks/use-slow-loading";
export default function OrderType() {
  const router = useRouter();
  // menu theke "change" korte ashle ?change=1 thake
  const { change } = useLocalSearchParams<{ change?: string }>();
  const { restaurantSlug, orderType, setOrderType } = useCart();
  const [selected, setSelected] = useState(orderType);

  const { data, loading, error, refetch } = usePublicMenu(restaurantSlug, null);
  const slowLoading = useSlowLoading(loading);

  if (!restaurantSlug) {
    router.replace("/");
    return null;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#ea580c" size="large" />
        {slowLoading && (
          <View className="mt-6 w-full">
            <ServerWakingNotice />
          </View>
        )}
      </View>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState
          title="Couldn't find this restaurant"
          message="Check the code or your internet connection and try again."
          onRetry={() => refetch()}
        />
        <TouchableOpacity
          className="items-center pb-4"
          onPress={() => router.replace("/")}
        >
          <Text className="text-[13px] font-semibold text-gray-500">
            Back to start
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const restaurant = data.publicMenu.restaurant;

  function handleContinue() {
    setOrderType(selected);
    if (change) router.back();
    else router.replace("/menu");
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 px-6 pt-10">
        <View className="items-center">
          {restaurant.logo ? (
            <Image
              source={{ uri: restaurant.logo }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-22 h-[88px] w-[88px] items-center justify-center rounded-full bg-brand">
              <Ionicons name="restaurant" size={34} color="white" />
            </View>
          )}
          <Text className="mt-4 text-sm text-gray-400">Welcome to</Text>
          <Text className="text-center text-2xl font-extrabold text-ink">
            {restaurant.name}
          </Text>
        </View>

        <Text className="mb-4 mt-10 text-lg font-bold text-ink">
          How would you like to order?
        </Text>

        <View className="gap-3">
          {ORDER_TYPES.map((o) => {
            const active = selected === o.type;
            return (
              <TouchableOpacity
                key={o.type}
                activeOpacity={0.9}
                onPress={() => setSelected(o.type)}
                className={`flex-row items-center gap-4 rounded-3xl border-2 bg-white p-4 ${active ? "border-brand" : "border-transparent"}`}
                style={cardShadow}
              >
                <View
                  className={`h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-brand" : "bg-cream"}`}
                >
                  <Ionicons
                    name={o.icon}
                    size={22}
                    color={active ? "white" : "#ea580c"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-ink">
                    {o.title}
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    {o.subtitle}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${active ? "border-brand bg-brand" : "border-gray-300"}`}
                >
                  {active && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected === "DELIVERY" && (
          <Text className="mt-3 px-1 text-xs text-gray-400">
            You'll enter your delivery address at checkout.
          </Text>
        )}
      </View>

      <View className="px-6 pb-4">
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-4 active:opacity-90"
          onPress={handleContinue}
        >
          <Text className="text-base font-bold text-white">Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
