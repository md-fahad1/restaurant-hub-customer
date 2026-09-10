import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { PUBLIC_MENU_QUERY, PublicMenuData } from "../lib/graphql";

export default function Menu() {
  const router = useRouter();
  const { restaurantSlug, tableId, addItem, itemCount, total } = useCart();

  const { data, loading, error } = useQuery<PublicMenuData>(PUBLIC_MENU_QUERY, {
    variables: {
      restaurantSlug: restaurantSlug ?? "",
      tableId: tableId ?? undefined,
    },
    skip: !restaurantSlug,
  });

  if (!restaurantSlug) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white p-6">
        <Ionicons name="qr-code-outline" size={40} color="#9ca3af" />
        <Text className="text-center text-gray-600">
          No restaurant selected yet.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-brand px-5 py-3"
          onPress={() => router.replace("/")}
        >
          <Text className="font-semibold text-white">Scan a QR code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
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
          Could not load the menu. Please try again.
        </Text>
      </View>
    );
  }

  const menu = data.publicMenu;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="border-b border-gray-100 px-4 py-3">
        <Text className="text-xl font-extrabold text-ink">
          {menu.restaurant.name}
        </Text>
        {menu.table && (
          <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full bg-amber-100 px-2.5 py-1">
            <Ionicons name="location-outline" size={13} color="#92400e" />
            <Text className="text-xs font-semibold text-amber-800">
              Table {menu.table.tableNumber}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={menu.categories}
        keyExtractor={(c: any) => c.id}
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? 110 : 24 }}
        renderItem={({ item: category }) => (
          <View className="px-4 pt-5">
            <Text className="mb-3 text-lg font-bold text-ink">
              {category.name}
            </Text>
            {category.items.map((menuItem: any) => {
              const outOfStock = menuItem.availability === "OUT_OF_STOCK";
              return (
                <View
                  key={menuItem.id}
                  className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100 p-3"
                >
                  {menuItem.image ? (
                    <Image
                      source={{ uri: menuItem.image }}
                      style={{ width: 64, height: 64, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
                      <Ionicons
                        name="fast-food-outline"
                        size={24}
                        color="#9ca3af"
                      />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text
                      className="text-[15px] font-semibold text-ink"
                      numberOfLines={1}
                    >
                      {menuItem.name}
                    </Text>
                    {menuItem.description ? (
                      <Text
                        className="mt-0.5 text-xs text-gray-500"
                        numberOfLines={2}
                      >
                        {menuItem.description}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-sm font-bold text-brand">
                      {menu.restaurant.currency} {menuItem.price}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={outOfStock}
                    className={`h-9 w-9 items-center justify-center rounded-full ${outOfStock ? "bg-gray-200" : "bg-ink active:opacity-80"}`}
                    onPress={() =>
                      addItem({
                        menuItemId: menuItem.id,
                        name: menuItem.name,
                        price: menuItem.price,
                        image: menuItem.image,
                      })
                    }
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      />

      {itemCount > 0 && (
        <TouchableOpacity
          className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-brand px-5 py-4 shadow-lg active:opacity-90"
          onPress={() => router.push("/cart")}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-white/25">
              <Text className="text-xs font-bold text-white">{itemCount}</Text>
            </View>
            <Text className="text-[15px] font-bold text-white">View cart</Text>
          </View>
          <Text className="text-[15px] font-bold text-white">
            {menu.restaurant.currency} {total}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
