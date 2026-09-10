import { useMutation } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import {
  CREATE_GUEST_ORDER_MUTATION,
  CreateGuestOrderData,
} from "../lib/graphql";
import {
  addOrderToHistory,
  getGuestInfo,
  saveGuestInfo,
} from "../lib/orderHistory";

export default function Checkout() {
  const router = useRouter();
  const {
    items,
    restaurantSlug,
    tableId,
    orderType,
    setOrderType,
    total,
    clearCart,
  } = useCart();
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [createOrder, { loading }] = useMutation<CreateGuestOrderData>(
    CREATE_GUEST_ORDER_MUTATION,
  );
  const needsAddress = orderType === "DELIVERY";

  // আগে কখনো অর্ডার করে থাকলে সেই নাম/ফোন/ঠিকানা auto-fill করে দিই
  useEffect(() => {
    getGuestInfo().then((info) => {
      if (info) {
        setGuestName(info.guestName);
        setGuestPhone(info.guestPhone);
        if (info.deliveryAddress) setDeliveryAddress(info.deliveryAddress);
      }
    });
  }, []);

  async function handleSubmit() {
    if (!guestName.trim() || !guestPhone.trim()) {
      Alert.alert("Missing info", "Please enter your name and phone number.");
      return;
    }
    if (needsAddress && !deliveryAddress.trim()) {
      Alert.alert("Missing address", "Please enter your delivery address.");
      return;
    }

    try {
      const { data } = await createOrder({
        variables: {
          input: {
            restaurantSlug: restaurantSlug ?? "",
            tableId: tableId ?? undefined,
            orderType,
            guestName,
            guestPhone,
            deliveryAddress: needsAddress ? deliveryAddress : undefined,
            items: items.map((l) => ({
              menuItemId: l.menuItemId,
              quantity: l.quantity,
              note: l.note,
            })),
          },
        },
      });

      const orderNumber = data?.createGuestOrder?.orderNumber;

      // পরের বার auto-fill করার জন্য guest info সেভ রাখি
      await saveGuestInfo({
        guestName,
        guestPhone,
        deliveryAddress: needsAddress ? deliveryAddress : undefined,
      });

      // "My Orders"-এ দেখানোর জন্য history তে যোগ করি
      if (orderNumber) {
        await addOrderToHistory({
          orderNumber,
          guestPhone,
          restaurantSlug: restaurantSlug ?? "",
          restaurantName: restaurantSlug ?? "",
          total: data?.createGuestOrder?.total ?? total,
          placedAt: new Date().toISOString(),
        });
      }

      const slugForTracking = restaurantSlug ?? "";
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/order-status",
        params: { orderNumber, guestPhone, restaurantSlug: slugForTracking },
      });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Order failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-lg font-bold text-ink">Your details</Text>

        <Text className="mb-1.5 text-[13px] font-medium text-gray-600">
          Full name
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-[15px]"
          value={guestName}
          onChangeText={setGuestName}
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
        />

        <Text className="mb-1.5 text-[13px] font-medium text-gray-600">
          Phone number
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-[15px]"
          value={guestPhone}
          onChangeText={setGuestPhone}
          placeholder="01XXXXXXXXX"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />

        {needsAddress && (
          <>
            <Text className="mb-1.5 text-[13px] font-medium text-gray-600">
              Delivery address
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-[15px]"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="House, road, area"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </>
        )}

        <View className="mt-2 flex-row items-center gap-2 rounded-xl bg-cream p-3.5">
          <Ionicons name="cash-outline" size={18} color="#92400e" />
          <Text className="text-[13px] font-medium text-amber-800">
            Pay by cash on {needsAddress ? "delivery" : "pickup"}
          </Text>
        </View>

        <View className="mt-5 flex-row justify-between border-t border-gray-100 pt-4">
          <Text className="text-base font-semibold text-ink">Total</Text>
          <Text className="text-lg font-extrabold text-brand">৳{total}</Text>
        </View>
      </ScrollView>

      <View className="p-4">
        <TouchableOpacity
          className="items-center rounded-2xl bg-brand py-4 active:opacity-90 disabled:opacity-50"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-[15px] font-bold text-white">
              Place order
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
