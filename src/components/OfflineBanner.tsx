import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

function timeAgo(ts?: number | null) {
  if (!ts) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

interface Props {
  online: boolean;
  stale?: boolean; // purono save kora data dekhacchi
  savedAt?: number | null;
  onRetry?: () => void;
}

export function OfflineBanner({ online, stale, savedAt, onRetry }: Props) {
  if (online && !stale) return null;

  const when = stale && savedAt ? ` · menu saved ${timeAgo(savedAt)}` : "";

  if (!online) {
    return (
      <View className="flex-row items-center justify-center gap-2 bg-gray-900 px-4 py-2.5">
        <Ionicons name="cloud-offline-outline" size={15} color="white" />
        <Text className="text-[12px] font-semibold text-white">
          You're offline{when}
        </Text>
      </View>
    );
  }

  // Net ache kintu server theke ana jay nai
  return (
    <View className="flex-row items-center justify-between bg-amber-100 px-4 py-2.5">
      <View className="flex-1 flex-row items-center gap-2">
        <Ionicons name="alert-circle-outline" size={16} color="#92400e" />
        <Text className="flex-1 text-[12px] font-semibold text-amber-900">
          Couldn't refresh the menu{when}
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text className="text-[12px] font-bold text-brand">Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
