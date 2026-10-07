import { ActivityIndicator, Text, View } from "react-native";

export function ServerWakingNotice() {
  return (
    <View className="mx-4 mt-3 flex-row items-center gap-3 rounded-2xl bg-cream p-4">
      <ActivityIndicator color="#ea580c" />
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-ink">
          Waking up the server…
        </Text>
        <Text className="mt-0.5 text-[12px] leading-4 text-gray-500">
          The first load can take up to a minute. Thanks for waiting!
        </Text>
      </View>
    </View>
  );
}
