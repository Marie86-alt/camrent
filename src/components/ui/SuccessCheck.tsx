import { useEffect } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { hapticSuccess } from '../../utils/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SUCCESS_COLOR = '#16A34A';
const CIRCLE_RADIUS = 32;
const CIRCLE_DASH = 2 * Math.PI * CIRCLE_RADIUS;
const CHECK_DASH = 54;

type Props = {
  size?: number;
};

export function SuccessCheck({ size = 96 }: Props) {
  const circleOffset = useSharedValue(CIRCLE_DASH);
  const checkOffset = useSharedValue(CHECK_DASH);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    circleOffset.value = CIRCLE_DASH;
    checkOffset.value = CHECK_DASH;
    scale.value = 0.92;

    hapticSuccess();

    circleOffset.value = withTiming(0, {
      duration: 360,
      reduceMotion: ReduceMotion.System,
    });
    checkOffset.value = withDelay(
      260,
      withTiming(0, {
        duration: 300,
        reduceMotion: ReduceMotion.System,
      }),
    );
    scale.value = withDelay(
      560,
      withSpring(1, {
        damping: 10,
        mass: 0.6,
        reduceMotion: ReduceMotion.System,
        stiffness: 180,
      }),
    );
  }, [checkOffset, circleOffset, scale]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circleOffset.value,
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: checkOffset.value,
  }));

  return (
    <Animated.View style={wrapperStyle}>
      <Svg height={size} viewBox="0 0 80 80" width={size}>
        <Circle cx="40" cy="40" fill="#E8F5EC" r="36" />
        <AnimatedCircle
          animatedProps={circleAnimatedProps}
          cx="40"
          cy="40"
          fill="none"
          r={CIRCLE_RADIUS}
          stroke={SUCCESS_COLOR}
          strokeDasharray={`${CIRCLE_DASH} ${CIRCLE_DASH}`}
          strokeLinecap="round"
          strokeWidth="5"
          transform="rotate(-90 40 40)"
        />
        <AnimatedPath
          animatedProps={checkAnimatedProps}
          d="M24 41.5L35 52.5L57 29.5"
          fill="none"
          stroke={SUCCESS_COLOR}
          strokeDasharray={`${CHECK_DASH} ${CHECK_DASH}`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="6"
        />
      </Svg>
    </Animated.View>
  );
}
