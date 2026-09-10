import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useCart } from "../context/CartContext";

export default function Scan() {
  const router = useRouter();
  const { setRestaurant } = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white p-8">
        <Ionicons name="camera-outline" size={48} color="#9ca3af" />
        <Text className="text-center text-[15px] text-gray-600">
          Camera access is needed to scan the restaurant's QR code.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-brand px-6 py-3"
          onPress={requestPermission}
        >
          <Text className="font-semibold text-white">Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // QR-এ আপনার dashboard যেভাবে URL এনকোড করে সেই ফরম্যাট ধরে (যেমন:
  // https://restauranthub-sigma.vercel.app/order/test-restaurant?table=5),
  // এখান থেকে slug আর tableId বের করছি
  function parseOrderUrl(
    raw: string,
  ): { slug: string; tableId: string | null } | null {
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/order\/([^/?]+)/);
      if (!match) return null;
      const slug = match[1];
      const tableId = url.searchParams.get("table");
      return { slug, tableId };
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
    // table QR হলে সরাসরি মেনু (dine-in auto), অনলাইন-অর্ডার QR হলে
    // আগে জিজ্ঞেস করব dine-in/takeaway/delivery কোনটা চান
    router.replace(parsed.tableId ? "/menu" : "/order-type");
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="h-64 w-64 rounded-3xl border-4 border-white/70" />
        <Text className="mt-6 text-[15px] font-medium text-white">
          Point at the restaurant's QR code
        </Text>
      </View>
    </View>
  );
}
