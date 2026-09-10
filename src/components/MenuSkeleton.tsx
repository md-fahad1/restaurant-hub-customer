import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

function Shimmer({ style }: { style: any }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ backgroundColor: "#e5e7eb" }, style, animatedStyle]}
    />
  );
}

export function MenuSkeleton() {
  return (
    <View className="px-4 pt-5">
      <Shimmer
        style={{ width: 120, height: 22, borderRadius: 6, marginBottom: 14 }}
      />
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100 p-3"
        >
          <Shimmer style={{ width: 64, height: 64, borderRadius: 12 }} />
          <View className="flex-1 gap-2">
            <Shimmer style={{ width: "70%", height: 14, borderRadius: 4 }} />
            <Shimmer style={{ width: "40%", height: 12, borderRadius: 4 }} />
            <Shimmer style={{ width: "30%", height: 14, borderRadius: 4 }} />
          </View>
          <Shimmer style={{ width: 36, height: 36, borderRadius: 18 }} />
        </View>
      ))}
    </View>
  );
}
