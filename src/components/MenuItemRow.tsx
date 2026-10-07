import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import { cardShadow } from "../constants/ui";
import { PublicMenuItem } from "../lib/graphql";
import { AnimatedAddButton } from "./AnimatedAddButton";

interface Props {
  item: PublicMenuItem;
  currency: string;
  qty: number; // cart e koyta ache
  onPress: () => void;
  onAdd: () => void;
}

export function MenuItemRow({ item, currency, qty, onPress, onAdd }: Props) {
  const out = item.availability === "OUT_OF_STOCK";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mb-3 flex-row gap-3 rounded-3xl bg-white p-2.5"
      style={cardShadow}
    >
      <View className="overflow-hidden rounded-2xl">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 96, height: 96 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center bg-surface">
            <Ionicons name="fast-food-outline" size={28} color="#9ca3af" />
          </View>
        )}
        {out && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <Text className="text-[10px] font-bold text-white">SOLD OUT</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-between py-0.5">
        <View>
          <Text numberOfLines={1} className="text-[15px] font-bold text-ink">
            {item.name}
          </Text>
          {item.description ? (
            <Text numberOfLines={2} className="mt-0.5 text-xs text-gray-500">
              {item.description}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-extrabold text-brand">
            {currency} {item.price}
          </Text>
          <View className="flex-row items-center gap-2">
            {qty > 0 && (
              <View className="rounded-full bg-cream px-2.5 py-1">
                <Text className="text-xs font-bold text-brand">×{qty}</Text>
              </View>
            )}
            <AnimatedAddButton disabled={out} onPress={onAdd} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
