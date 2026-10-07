import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please check your internet connection and try again.",
  onRetry,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white p-8">
      <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-red-50">
        <Ionicons name="cloud-offline-outline" size={42} color="#ef4444" />
      </View>
      <Text className="text-xl font-extrabold text-ink">{title}</Text>
      <Text className="mt-1 text-center text-[14px] leading-5 text-gray-500">
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          className="mt-6 flex-row items-center gap-2 rounded-2xl bg-brand px-8 py-3.5 active:opacity-90"
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text className="font-bold text-white">Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
