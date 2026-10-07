import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
const HERO_IMAGE = require("../../assets/images/hero.jpg");

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRestaurant } = useCart();
  const [manualCode, setManualCode] = useState("");

  function handleManualEntry() {
    const slug = manualCode.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    setRestaurant(slug, null);
    router.push("/order-type");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-ink" behavior="padding">
      <Stack.Screen options={{ headerShown: false, statusBarStyle: "light" }} />

      {/* Hero */}
      <View className="flex-1 justify-end overflow-hidden px-6 pb-10">
        {HERO_IMAGE ? (
          <Image
            source={HERO_IMAGE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <>
            <View className="absolute -right-16 -top-10 h-64 w-64 rounded-full bg-brand/30" />
            <View className="absolute -left-20 top-40 h-56 w-56 rounded-full bg-brand/15" />
          </>
        )}
        <View className="absolute inset-0 bg-black/45" />

        <View style={{ paddingTop: insets.top }} className="flex-1 justify-end">
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-brand">
            <Ionicons name="restaurant" size={26} color="white" />
          </View>
          <Text className="text-4xl font-extrabold leading-[44px] text-white">
            Good Food,{"\n"}Good Mood
          </Text>
          <Text className="mt-3 text-[15px] leading-6 text-white/80">
            Fresh, tasty & delivered to your door — or served right at your
            table.
          </Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View
        className="rounded-t-[32px] bg-white px-6 pt-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2.5 rounded-2xl bg-brand py-4 active:opacity-90"
          onPress={() => router.push("/scan")}
        >
          <Ionicons name="qr-code-outline" size={20} color="white" />
          <Text className="text-base font-bold text-white">
            Scan QR to order
          </Text>
        </TouchableOpacity>

        <View className="my-4 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-gray-100" />
          <Text className="text-xs text-gray-400">
            or enter restaurant code
          </Text>
          <View className="h-px flex-1 bg-gray-100" />
        </View>

        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-ink"
            placeholder="e.g. test-restaurant"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={handleManualEntry}
            returnKeyType="go"
          />
          <TouchableOpacity
            className="items-center justify-center rounded-2xl bg-ink px-5 active:opacity-80"
            onPress={handleManualEntry}
          >
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center gap-2 py-2"
          onPress={() => router.push("/orders" as any)}
        >
          <Ionicons name="receipt-outline" size={16} color="#6b7280" />
          <Text className="text-[13px] font-medium text-gray-500">
            View my past orders
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
