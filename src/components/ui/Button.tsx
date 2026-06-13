import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
};

// Static class strings — NativeWind must see them as literals to include them in CSS
const BG: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600',
  secondary: 'bg-slate-100',
  ghost:     'bg-transparent border border-slate-200',
  danger:    'bg-danger',
};

const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary:   '#FFFFFF',
  secondary: '#0F172A',
  ghost:     '#3B63D4',
  danger:    '#FFFFFF',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TIMING = { duration: 120, reduceMotion: ReduceMotion.System };

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  accessibilityLabel,
}: Props) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  function onPressIn() {
    scale.value   = withTiming(0.97, TIMING);
    opacity.value = withTiming(0.9,  TIMING);
  }

  function onPressOut() {
    scale.value   = withTiming(1, TIMING);
    opacity.value = withTiming(1, TIMING);
  }

  function onPressOutCancelled() {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value   = 1;
    opacity.value = 1;
  }

  const isDisabled = disabled || loading;
  const iconColor  = TEXT_COLOR[variant];

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onLongPress={onPressOutCancelled}
      style={[animStyle, { height: 52, opacity: isDisabled ? 0.5 : 1 }]}
      className={`flex-row items-center justify-center gap-2 rounded-md ${BG[variant]} ${fullWidth ? 'w-full' : 'self-start px-6'}`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons color={iconColor} name={icon} size={18} /> : null}
          <Text style={{ color: iconColor, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
            {children}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
