import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SuccessCheck } from './SuccessCheck';

type Props = {
  message: string;
  onDone: () => void;
  visible: boolean;
};

const AUTO_CLOSE_MS = 1150;

export function SuccessOverlay({ message, onDone, visible }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      translateY.value = 12;
      return undefined;
    }

    opacity.value = withTiming(1, {
      duration: 180,
      reduceMotion: ReduceMotion.System,
    });
    translateY.value = withTiming(0, {
      duration: 220,
      reduceMotion: ReduceMotion.System,
    });

    const timer = setTimeout(onDone, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [onDone, opacity, translateY, visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-slate-950/40 px-8">
        <Animated.View
          className="w-full items-center rounded-xl bg-white px-6 py-8"
          style={[
            cardStyle,
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 24,
              elevation: 12,
            },
          ]}
        >
          <SuccessCheck />
          <Text className="mt-5 text-center font-sans-bold text-xl text-slate-950">
            {message}
          </Text>
          <Text className="mt-2 text-center font-sans text-sm leading-5 text-slate-500">
            Un instant...
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
