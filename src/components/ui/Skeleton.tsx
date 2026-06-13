import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';

// ─── Primitive animated block ─────────────────────────────────────────────────

type BlockProps = {
  className?: string;
  width?: number | `${number}%`;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const RADIUS = { sm: 8, md: 12, lg: 16, full: 999 };

export function SkeletonBlock({ className = '', width, height = 16, rounded = 'md' }: BlockProps) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 650, reduceMotion: ReduceMotion.System }),
        withTiming(0.45, { duration: 650, reduceMotion: ReduceMotion.System }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`bg-slate-200 ${className}`}
      style={[animStyle, { height, borderRadius: RADIUS[rounded], width: width as number }]}
    />
  );
}

// ─── Skeleton for a text line ─────────────────────────────────────────────────

export function SkeletonLine({ width = '75%', className = '' }: { width?: BlockProps['width']; className?: string }) {
  return <SkeletonBlock className={className} height={14} rounded="sm" width={width} />;
}

// ─── Skeleton for a full car card (mirrors CarCard) ──────────────────────────

export function CarCardSkeleton() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 650, reduceMotion: ReduceMotion.System }),
        withTiming(0.45, { duration: 650, reduceMotion: ReduceMotion.System }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="mb-3 overflow-hidden rounded-lg bg-white"
      style={[
        animStyle,
        { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
      ]}
    >
      {/* Image placeholder — 16:10 ratio */}
      <View className="bg-slate-200" style={{ aspectRatio: 16 / 10 }} />
      <View className="gap-3 p-4">
        <SkeletonLine width="70%" />
        <SkeletonLine width="45%" />
        <View className="flex-row gap-2">
          <SkeletonBlock height={22} rounded="full" width={56} />
          <SkeletonBlock height={22} rounded="full" width={72} />
          <SkeletonBlock height={22} rounded="full" width={48} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Skeleton for a booking card ─────────────────────────────────────────────

export function BookingCardSkeleton() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 650, reduceMotion: ReduceMotion.System }),
        withTiming(0.45, { duration: 650, reduceMotion: ReduceMotion.System }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="mb-3 overflow-hidden rounded-lg bg-white p-4"
      style={[
        animStyle,
        { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#E2E8F0' },
      ]}
    >
      <View className="flex-row items-start justify-between gap-3 mb-3">
        <View className="flex-1 gap-2">
          <SkeletonLine width="60%" />
          <SkeletonLine width="80%" />
        </View>
        <SkeletonBlock height={22} rounded="full" width={72} />
      </View>
      <View className="flex-row items-center justify-between">
        <SkeletonLine width="50%" />
        <SkeletonBlock height={20} rounded="sm" width={80} />
      </View>
    </Animated.View>
  );
}

// ─── Skeleton for a driver card ───────────────────────────────────────────────

export function DriverCardSkeleton() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 650, reduceMotion: ReduceMotion.System }),
        withTiming(0.45, { duration: 650, reduceMotion: ReduceMotion.System }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="mb-3 flex-row items-center gap-3 rounded-lg bg-white p-4"
      style={[
        animStyle,
        { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
      ]}
    >
      <SkeletonBlock height={56} rounded="full" width={56} />
      <View className="flex-1 gap-2">
        <SkeletonLine width="55%" />
        <SkeletonLine width="40%" />
      </View>
      <View className="items-end gap-2">
        <SkeletonLine width={64} />
        <SkeletonBlock height={20} rounded="full" width={64} />
      </View>
    </Animated.View>
  );
}
