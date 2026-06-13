import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useToast } from './Toast';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const toast = useToast();
  const { top } = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const wasOffline = useRef(false);
  const translateY = useSharedValue(-48);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setMounted(true);
      translateY.value = withTiming(0, { duration: 220, reduceMotion: ReduceMotion.System });
      opacity.value = withTiming(1, { duration: 180, reduceMotion: ReduceMotion.System });
      return;
    }

    if (!mounted) return;

    translateY.value = withTiming(-48, { duration: 220, reduceMotion: ReduceMotion.System });
    opacity.value = withTiming(0, { duration: 180, reduceMotion: ReduceMotion.System }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });

    if (wasOffline.current) {
      toast.success('De retour en ligne');
      wasOffline.current = false;
    }
  }, [isOnline, mounted, opacity, toast, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        {
          alignItems: 'center',
          backgroundColor: '#FEF2F2',
          borderBottomColor: '#FECACA',
          borderBottomWidth: 1,
          flexDirection: 'row',
          gap: 8,
          left: 0,
          paddingBottom: 8,
          paddingHorizontal: 16,
          paddingTop: top + 8,
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 9998,
        },
      ]}
    >
      <Ionicons color="#DC2626" name="cloud-offline-outline" size={16} />
      <Text
        style={{
          color: '#991B1B',
          flex: 1,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          lineHeight: 18,
          textAlign: 'center',
        }}
      >
        Pas de connexion internet
      </Text>
    </Animated.View>
  );
}
