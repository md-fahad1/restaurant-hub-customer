import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const router = useRouter();
  const { items, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white p-6">
        <Ionicons name="cart-outline" size={48} color="#d1d5db" />
        <Text className="text-[15px] text-gray-500">Your cart is empty.</Text>
        <TouchableOpacity
          className="mt-2 rounded-xl bg-ink px-5 py-3"
          onPress={() => router.replace("/menu")}
        >
          <Text className="font-semibold text-white">Browse menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(l) => l.menuItemId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: line }) => (
          <View className="mb-3 flex-row items-center rounded-2xl border border-gray-100 p-3">
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">
                {line.name}
              </Text>
              <Text className="mt-0.5 text-[13px] text-gray-500">
                ৳{line.price} each
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
                onPress={() =>
                  updateQuantity(line.menuItemId, line.quantity - 1)
                }
              >
                <Ionicons name="remove" size={16} color="#1a1a1a" />
              </TouchableOpacity>
              <Text className="w-6 text-center font-semibold text-ink">
                {line.quantity}
              </Text>
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-ink active:opacity-80"
                onPress={() =>
                  updateQuantity(line.menuItemId, line.quantity + 1)
                }
              >
                <Ionicons name="add" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View className="border-t border-gray-100 p-4">
        <View className="mb-3 flex-row justify-between">
          <Text className="text-base font-semibold text-ink">Total</Text>
          <Text className="text-lg font-extrabold text-brand">৳{total}</Text>
        </View>
        <TouchableOpacity
          className="items-center rounded-2xl bg-brand py-4 active:opacity-90"
          onPress={() => router.push("/checkout")}
        >
          <Text className="text-[15px] font-bold text-white">
            Proceed to checkout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
