import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";

const CORNERS = {
  tl: "left-0 top-0 rounded-tl-3xl border-l-4 border-t-4",
  tr: "right-0 top-0 rounded-tr-3xl border-r-4 border-t-4",
  bl: "bottom-0 left-0 rounded-bl-3xl border-b-4 border-l-4",
  br: "bottom-0 right-0 rounded-br-3xl border-b-4 border-r-4",
} as const;

function Corner({ pos }: { pos: keyof typeof CORNERS }) {
  return <View className={`absolute h-12 w-12 border-brand ${CORNERS[pos]}`} />;
}

export default function Scan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRestaurant } = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Stack.Screen options={{ title: "Scan QR" }} />
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-cream">
          <Ionicons name="camera-outline" size={36} color="#ea580c" />
        </View>
        <Text className="mb-2 text-xl font-extrabold text-ink">
          Camera access needed
        </Text>
        <Text className="mb-6 text-center text-[15px] text-gray-500">
          We use your camera only to scan the restaurant's QR code.
        </Text>
        <TouchableOpacity
          className="w-full items-center rounded-2xl bg-brand py-4"
          onPress={requestPermission}
        >
          <Text className="font-bold text-white">Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function parseOrderUrl(
    raw: string,
  ): { slug: string; tableId: string | null } | null {
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/order\/([^/?]+)/);
      if (!match) return null;
      return { slug: match[1], tableId: url.searchParams.get("table") };
    } catch {
      return null;
    }
  }

  function handleScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    const parsed = parseOrderUrl(data);
    if (!parsed) {
      Alert.alert(
        "Invalid QR code",
        "This does not look like a restaurant order QR code.",
        [{ text: "Try again", onPress: () => setScanned(false) }],
      );
      return;
    }

    setRestaurant(parsed.slug, parsed.tableId);
    router.replace(parsed.tableId ? "/menu" : "/order-type");
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false, statusBarStyle: "light" }} />
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <View className="absolute inset-0 bg-black/40" />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-black/50"
        style={{ top: insets.top + 8 }}
      >
        <Ionicons name="chevron-back" size={22} color="white" />
      </TouchableOpacity>

      {/* Frame */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="mb-8 text-xl font-extrabold text-white">
          Scan to order
        </Text>
        <View className="h-64 w-64">
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
        </View>
        <Text className="mt-8 px-10 text-center text-[14px] text-white/80">
          Point your camera at the QR code on your table or the restaurant's
          poster
        </Text>
      </View>

      {/* Manual fallback */}
      <View
        className="absolute left-0 right-0 items-center"
        style={{ bottom: Math.max(insets.bottom, 16) + 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-2 rounded-full bg-white px-5 py-3"
        >
          <Ionicons name="keypad-outline" size={16} color="#1a1a1a" />
          <Text className="text-[13px] font-semibold text-ink">
            Enter code manually
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
