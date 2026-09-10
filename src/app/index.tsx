import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";

export default function Landing() {
  const router = useRouter();
  const { setRestaurant } = useCart();
  const [manualCode, setManualCode] = useState("");

  function handleManualEntry() {
    const slug = manualCode.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    setRestaurant(slug, null);
    router.push("/order-type");
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-3xl bg-brand">
          <Ionicons name="restaurant" size={36} color="white" />
        </View>

        <Text className="mb-2 text-center text-3xl font-extrabold text-ink">
          Welcome!
        </Text>
        <Text className="mb-10 text-center text-[15px] text-gray-500">
          Scan the restaurant's QR code to start ordering
        </Text>

        <TouchableOpacity
          className="mb-6 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-4 active:opacity-80"
          onPress={() => router.push("/scan")}
        >
          <Ionicons name="qr-code-outline" size={20} color="white" />
          <Text className="text-base font-semibold text-white">
            Scan QR code
          </Text>
        </TouchableOpacity>

        <Text className="mb-3 text-[13px] text-gray-400">
          or enter the restaurant code manually
        </Text>
        <View className="w-full flex-row gap-2">
          <TextInput
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px]"
            placeholder="e.g. test-restaurant"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <TouchableOpacity
            className="items-center justify-center rounded-xl bg-brand px-5"
            onPress={handleManualEntry}
          >
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
