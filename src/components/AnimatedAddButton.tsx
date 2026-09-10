import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function AnimatedAddButton({
  disabled,
  onPress,
}: {
  disabled?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        disabled={disabled}
        className={`h-9 w-9 items-center justify-center rounded-full ${disabled ? "bg-gray-200" : "bg-ink active:opacity-80"}`}
        onPress={handlePress}
      >
        <Ionicons name="add" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}
