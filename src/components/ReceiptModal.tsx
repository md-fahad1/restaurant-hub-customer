import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OrderHistoryEntry } from "../lib/orderHistory";
import { ReceiptData, shareReceiptPdf } from "../lib/receiptPdf";

// Server er order ba phone er history, dutoi ei shape e ana jay
export interface ReceiptOrder {
  orderNumber: string;
  createdAt: string;
  type?: string; // DINE_IN | TAKEAWAY | DELIVERY
  tableNumber?: string | number | null;
  total: number;
  deliveryAddress?: string | null;
  items: { name: string; quantity: number }[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  order: ReceiptOrder;
  entry: OrderHistoryEntry | null; // phone e save kora history (dam er jonno)
  restaurantSlug: string;
}

function prettyName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

function Dashed() {
  return (
    <Text numberOfLines={1} className="my-3 text-gray-300">
      {"- ".repeat(80)}
    </Text>
  );
}

export function ReceiptModal({
  visible,
  onClose,
  order,
  entry,
  restaurantSlug,
}: Props) {
  const [busy, setBusy] = useState(false);

  const restaurantName = prettyName(entry?.restaurantName || restaurantSlug);
  const currency = entry?.currency ?? "৳";
  const money = (n: number) => `${currency}${round2(n)}`;

  const typeLabel =
    order.type === "DINE_IN"
      ? order.tableNumber
        ? `Dine-in · Table ${order.tableNumber}`
        : "Dine-in"
      : order.type === "DELIVERY"
        ? "Delivery"
        : order.type === "TAKEAWAY"
          ? "Takeaway"
          : "—";

  const paymentLabel =
    order.type === "DELIVERY"
      ? "Cash on delivery"
      : order.type
        ? "Cash on pickup"
        : "Cash payment";

  // Dam thakle (notun order) entry theke, na thakle shudhu naam + quantity
  const hasPrices = !!entry?.items && entry.items.length > 0;
  const lines: ReceiptData["lines"] = hasPrices
    ? entry!.items!.map((l) => ({
        name: l.name,
        qty: l.quantity,
        note: l.note,
        lineTotal: l.price * l.quantity,
      }))
    : order.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        note: undefined,
        lineTotal: null,
      }));

  const subtotal = hasPrices
    ? lines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0)
    : null;
  // Server er total jodi subtotal er theke beshi hoy (delivery fee, charge ityadi)
  const extra = subtotal !== null ? round2(order.total - subtotal) : 0;

  async function handleSharePdf() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await shareReceiptPdf({
        restaurantName,
        orderNumber: order.orderNumber,
        dateText: formatDateTime(order.createdAt),
        typeLabel,
        address: order.deliveryAddress ?? null,
        paymentLabel,
        currency,
        lines,
        subtotal,
        extra,
        total: order.total,
        hasPrices,
      });
      if (result === "unavailable") {
        Alert.alert(
          "Sharing not available",
          "This device can't open the share sheet.",
        );
      }
    } catch (err) {
      console.log("Receipt PDF error:", err);
      Alert.alert(
        "Couldn't create PDF",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[88%] rounded-t-3xl bg-white"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand">
                <Ionicons name="receipt" size={26} color="white" />
              </View>
              <Text className="mt-3 text-xl font-extrabold text-ink">
                {restaurantName}
              </Text>
              <Text className="mt-0.5 text-[13px] text-gray-500">Receipt</Text>
            </View>

            <Dashed />

            {/* Order info */}
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-[13px] text-gray-500">Order no.</Text>
                <Text className="text-[13px] font-semibold text-ink">
                  #{order.orderNumber}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[13px] text-gray-500">Date</Text>
                <Text className="text-[13px] font-semibold text-ink">
                  {formatDateTime(order.createdAt)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[13px] text-gray-500">Order type</Text>
                <Text className="text-[13px] font-semibold text-ink">
                  {typeLabel}
                </Text>
              </View>
              {order.deliveryAddress ? (
                <View className="flex-row justify-between gap-6">
                  <Text className="text-[13px] text-gray-500">Address</Text>
                  <Text className="flex-1 text-right text-[13px] font-semibold text-ink">
                    {order.deliveryAddress}
                  </Text>
                </View>
              ) : null}
            </View>

            <Dashed />

            {/* Items */}
            {lines.map((l, i) => (
              <View key={i} className="mb-2.5 flex-row justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-ink">
                    {l.qty}× {l.name}
                  </Text>
                  {l.note ? (
                    <Text className="text-[12px] italic text-gray-400">
                      {l.note}
                    </Text>
                  ) : null}
                </View>
                {l.lineTotal !== null && (
                  <Text className="text-[14px] font-semibold text-ink">
                    {money(l.lineTotal)}
                  </Text>
                )}
              </View>
            ))}

            <Dashed />

            {/* Totals */}
            {subtotal !== null && extra > 0.009 && (
              <>
                <View className="mb-1.5 flex-row justify-between">
                  <Text className="text-[13px] text-gray-500">Subtotal</Text>
                  <Text className="text-[13px] font-semibold text-ink">
                    {money(subtotal)}
                  </Text>
                </View>
                <View className="mb-1.5 flex-row justify-between">
                  <Text className="text-[13px] text-gray-500">
                    Other charges
                  </Text>
                  <Text className="text-[13px] font-semibold text-ink">
                    {money(extra)}
                  </Text>
                </View>
              </>
            )}
            <View className="flex-row justify-between">
              <Text className="text-base font-extrabold text-ink">Total</Text>
              <Text className="text-xl font-extrabold text-brand">
                {money(order.total)}
              </Text>
            </View>

            <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-cream p-3.5">
              <Ionicons name="cash-outline" size={18} color="#ea580c" />
              <Text className="text-[13px] font-semibold text-brand">
                {paymentLabel}
              </Text>
            </View>

            {!hasPrices && (
              <Text className="mt-3 text-center text-[11px] leading-4 text-gray-400">
                Item prices aren't available for this order. The total above
                comes from the restaurant.
              </Text>
            )}

            <Text className="mt-5 text-center text-[13px] text-gray-500">
              Thank you for ordering with us!
            </Text>
          </ScrollView>

          {/* Buttons */}
          <View className="border-t border-gray-100 p-4">
            <Text className="mb-3 text-center text-[11px] leading-4 text-gray-400">
              Tap "Share PDF", then pick WhatsApp to send it, or Files / Drive
              to save it on your phone.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 items-center rounded-2xl bg-surface py-3.5"
              >
                <Text className="text-[15px] font-bold text-ink">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSharePdf}
                disabled={busy}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 active:opacity-90 disabled:opacity-60"
              >
                {busy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="document-outline" size={18} color="white" />
                    <Text className="text-[15px] font-bold text-white">
                      Share PDF
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
