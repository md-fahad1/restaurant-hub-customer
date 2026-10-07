import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import { cardShadow } from "../constants/ui";
import { PublicMenuItem } from "../lib/graphql";
import { AnimatedAddButton } from "./AnimatedAddButton";

interface Props {
  item: PublicMenuItem;
  currency: string;
  onPress: () => void;
  onAdd: () => void;
}

export function FoodCard({ item, currency, onPress, onAdd }: Props) {
  const out = item.availability === "OUT_OF_STOCK";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="w-44 rounded-3xl bg-white p-2.5"
      style={cardShadow}
    >
      <View className="overflow-hidden rounded-2xl">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 120 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-[120px] items-center justify-center bg-surface">
            <Ionicons name="fast-food-outline" size={32} color="#9ca3af" />
          </View>
        )}
        {out && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <Text className="text-xs font-bold text-white">SOLD OUT</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        className="mt-2.5 px-1 text-[15px] font-bold text-ink"
      >
        {item.name}
      </Text>
      <Text numberOfLines={1} className="px-1 text-xs text-gray-500">
        {item.description || " "}
      </Text>

      <View className="mt-2 flex-row items-center justify-between px-1 pb-0.5">
        <Text className="text-[15px] font-extrabold text-brand">
          {currency} {item.price}
        </Text>
        <AnimatedAddButton disabled={out} onPress={onAdd} />
      </View>
    </TouchableOpacity>
  );
}
