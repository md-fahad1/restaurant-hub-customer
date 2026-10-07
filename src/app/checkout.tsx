import { useMutation } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
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
import { cardShadow, ORDER_TYPES } from "../constants/ui";
import { useCart } from "../context/CartContext";
import { useIsOnline } from "../hooks/use-online";
import { usePublicMenu } from "../hooks/use-public-menu";
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
  const online = useIsOnline();

  // Restaurant naam, currency ar table number (cache/save kora menu theke)
  const { data: menuData } = usePublicMenu(restaurantSlug, tableId);
  const restaurantName =
    menuData?.publicMenu.restaurant.name ?? restaurantSlug ?? "";
  const currency = menuData?.publicMenu.restaurant.currency;
  const tableNumber = menuData?.publicMenu.table?.tableNumber ?? null;

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
    if (!online) {
      Alert.alert(
        "You're offline",
        "Connect to the internet to place your order.",
      );
      return;
    }
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
          restaurantName,
          total: data?.createGuestOrder?.total ?? total,
          placedAt: new Date().toISOString(),
          currency,
          orderType,
          tableNumber,
          deliveryAddress: needsAddress ? deliveryAddress : undefined,
          items: items.map((l) => ({
            menuItemId: l.menuItemId,
            name: l.name,
            price: l.price,
            quantity: l.quantity,
            image: l.image,
            note: l.note,
          })),
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
      <Stack.Screen options={{ title: "Checkout" }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Order type switcher (table QR hole lukano) */}
          {!tableId && (
            <>
              <Text className="mb-2 text-[13px] font-semibold text-gray-500">
                ORDER TYPE
              </Text>
              <View className="mb-5 flex-row gap-1.5 rounded-2xl bg-surface p-1.5">
                {ORDER_TYPES.map((o) => {
                  const active = o.type === orderType;
                  return (
                    <TouchableOpacity
                      key={o.type}
                      onPress={() => setOrderType(o.type)}
                      className={`flex-1 items-center rounded-xl py-3 ${active ? "bg-white" : ""}`}
                      style={active ? cardShadow : undefined}
                    >
                      <Ionicons
                        name={o.icon}
                        size={20}
                        color={active ? "#ea580c" : "#9ca3af"}
                      />
                      <Text
                        className={`mt-1 text-[12px] font-semibold ${active ? "text-ink" : "text-gray-400"}`}
                      >
                        {o.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text className="mb-3 text-lg font-extrabold text-ink">
            Your details
          </Text>

          <Text className="mb-1.5 text-[13px] font-medium text-gray-500">
            Full name
          </Text>
          <TextInput
            className="mb-4 rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-ink"
            value={guestName}
            onChangeText={setGuestName}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
          />

          <Text className="mb-1.5 text-[13px] font-medium text-gray-500">
            Phone number
          </Text>
          <TextInput
            className="mb-4 rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-ink"
            value={guestPhone}
            onChangeText={setGuestPhone}
            placeholder="01XXXXXXXXX"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />

          {needsAddress && (
            <>
              <Text className="mb-1.5 text-[13px] font-medium text-gray-500">
                Delivery address
              </Text>
              <TextInput
                className="mb-4 min-h-[90px] rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-ink"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="House, road, area"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
              />
            </>
          )}

          {/* Payment */}
          <View className="flex-row items-center gap-3 rounded-2xl bg-cream p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Ionicons name="cash-outline" size={20} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-ink">
                Cash payment
              </Text>
              <Text className="text-[12px] text-gray-500">
                Pay on {needsAddress ? "delivery" : "pickup"}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View className="mt-5 rounded-3xl bg-surface p-4">
            <View className="mb-2 flex-row justify-between">
              <Text className="text-[14px] text-gray-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
              <Text className="text-[14px] font-semibold text-ink">
                ৳{total}
              </Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-3">
              <Text className="text-base font-extrabold text-ink">Total</Text>
              <Text className="text-lg font-extrabold text-brand">
                ৳{total}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-3 pt-2">
          {!online && (
            <View className="mb-2 flex-row items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5">
              <Ionicons name="cloud-offline-outline" size={16} color="white" />
              <Text className="text-[12px] font-semibold text-white">
                Connect to the internet to place your order
              </Text>
            </View>
          )}
          <TouchableOpacity
            className={`items-center rounded-2xl py-4 ${online ? "bg-brand active:opacity-90" : "bg-gray-300"} disabled:opacity-60`}
            onPress={handleSubmit}
            disabled={loading || !online}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-[15px] font-bold text-white">
                Place order · ৳{total}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
