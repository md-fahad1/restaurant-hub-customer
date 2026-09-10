import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { PUBLIC_MENU_QUERY, PublicMenuData } from "../lib/graphql";

const OPTIONS = [
  {
    type: "DINE_IN" as const,
    icon: "restaurant-outline" as const,
    title: "Dine-in",
    subtitle: "I'm at a table",
  },
  {
    type: "TAKEAWAY" as const,
    icon: "bag-handle-outline" as const,
    title: "Takeaway",
    subtitle: "I'll pick it up",
  },
  {
    type: "DELIVERY" as const,
    icon: "bicycle-outline" as const,
    title: "Delivery",
    subtitle: "Bring it to me",
  },
];

export default function OrderType() {
  const router = useRouter();
  const { restaurantSlug, setOrderType } = useCart();

  const { data, loading } = useQuery<PublicMenuData>(PUBLIC_MENU_QUERY, {
    variables: { restaurantSlug: restaurantSlug ?? "" },
    skip: !restaurantSlug,
  });

  if (!restaurantSlug) {
    router.replace("/");
    return null;
  }

  if (loading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  const restaurant = data.publicMenu.restaurant;
  const brandColor = restaurant.brandColor || "#ea580c";

  function handleSelect(type: "DINE_IN" | "TAKEAWAY" | "DELIVERY") {
    setOrderType(type);
    router.replace("/menu");
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center px-6 pt-12">
        {restaurant.logo ? (
          <Image
            source={{ uri: restaurant.logo }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              borderWidth: 3,
              borderColor: "white",
            }}
            contentFit="cover"
          />
        ) : (
          <View
            className="h-24 w-24 items-center justify-center rounded-full border-4 border-white"
            style={{ backgroundColor: brandColor }}
          >
            <Ionicons name="restaurant" size={36} color="white" />
          </View>
        )}

        <Text className="mt-4 text-center text-2xl font-extrabold text-ink">
          {restaurant.name}
        </Text>
        <Text className="mb-8 mt-1 text-center text-[15px] text-gray-500">
          How would you like to order today?
        </Text>

        <View className="w-full gap-3">
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              className="flex-row items-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-4 active:opacity-80"
              onPress={() => handleSelect(option.type)}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: `${brandColor}1A` }}
              >
                <Ionicons name={option.icon} size={20} color={brandColor} />
              </View>
              <View>
                <Text className="text-[15px] font-semibold text-ink">
                  {option.title}
                </Text>
                <Text className="text-[13px] text-gray-500">
                  {option.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
