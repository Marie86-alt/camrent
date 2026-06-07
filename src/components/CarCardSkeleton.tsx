import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function CarCardSkeleton() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0.45, { duration: 650 }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  return (
    <Animated.View
      className="mb-4 overflow-hidden rounded-xl bg-white"
      style={[
        animatedStyle,
        {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
      ]}
    >
      <View className="h-44 bg-slate-200" />
      <View className="gap-3 p-4">
        <View className="h-5 w-3/4 rounded-md bg-slate-200" />
        <View className="h-4 w-1/2 rounded-md bg-slate-200" />
        <View className="flex-row gap-2">
          <View className="h-6 w-16 rounded-full bg-slate-200" />
          <View className="h-6 w-20 rounded-full bg-slate-200" />
          <View className="h-6 w-14 rounded-full bg-slate-200" />
        </View>
      </View>
    </Animated.View>
  );
}
