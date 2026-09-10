import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PublicMenuItem } from "../lib/graphql";

interface Props {
  item: PublicMenuItem | null;
  currency: string;
  onClose: () => void;
  onAdd: (item: PublicMenuItem, quantity: number, note?: string) => void;
}

export function ItemDetailModal({ item, currency, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNote("");
    }
  }, [item?.id]);

  if (!item) return null;

  const outOfStock = item.availability === "OUT_OF_STOCK";

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-white"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <ScrollView
            className="max-h-[70%]"
            contentContainerStyle={{ padding: 20 }}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: "100%", height: 180, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-[180px] items-center justify-center rounded-2xl bg-gray-100">
                <Ionicons name="fast-food-outline" size={40} color="#9ca3af" />
              </View>
            )}

            <Text className="mt-4 text-xl font-extrabold text-ink">
              {item.name}
            </Text>
            {item.description ? (
              <Text className="mt-1.5 text-[14px] leading-5 text-gray-500">
                {item.description}
              </Text>
            ) : null}
            <Text className="mt-3 text-lg font-bold text-brand">
              {currency} {item.price}
            </Text>

            {outOfStock && (
              <View className="mt-3 flex-row items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color="#ef4444"
                />
                <Text className="text-[13px] font-medium text-red-600">
                  Currently out of stock
                </Text>
              </View>
            )}

            {!outOfStock && (
              <View className="mt-4">
                <Text className="mb-1.5 text-[13px] font-medium text-gray-600">
                  Special instructions (optional)
                </Text>
                <TextInput
                  className="rounded-xl border border-gray-200 px-3.5 py-3 text-[14px]"
                  placeholder="e.g. less spicy, no onion"
                  placeholderTextColor="#9ca3af"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>
            )}
          </ScrollView>

          <View className="flex-row items-center gap-3 border-t border-gray-100 p-4">
            {!outOfStock && (
              <View className="flex-row items-center gap-4 rounded-full bg-gray-100 px-3 py-2">
                <TouchableOpacity
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={18} color="#1a1a1a" />
                </TouchableOpacity>
                <Text className="w-5 text-center font-bold text-ink">
                  {quantity}
                </Text>
                <TouchableOpacity onPress={() => setQuantity((q) => q + 1)}>
                  <Ionicons name="add" size={18} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              disabled={outOfStock}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-full py-3.5 ${outOfStock ? "bg-gray-200" : "bg-brand active:opacity-90"}`}
              onPress={() => {
                onAdd(item, quantity, note.trim() || undefined);
                onClose();
              }}
            >
              <Text className="text-[15px] font-bold text-white">
                {outOfStock
                  ? "Unavailable"
                  : `Add · ${currency} ${item.price * quantity}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
