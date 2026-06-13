import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextValue = {
  show:    (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue>({
  show:    () => {},
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
});

export const useToast = () => useContext(ToastCtx);

// ─── Visual config ────────────────────────────────────────────────────────────

const CONFIG: Record<ToastType, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string }> = {
  success: { bg: '#15803D', icon: 'checkmark-circle',      iconColor: '#FFFFFF' },
  error:   { bg: '#DC2626', icon: 'close-circle',           iconColor: '#FFFFFF' },
  warning: { bg: '#D97706', icon: 'warning',                iconColor: '#FFFFFF' },
  info:    { bg: '#0077B6', icon: 'information-circle',     iconColor: '#FFFFFF' },
  default: { bg: '#0F172A', icon: 'chatbubble-outline',     iconColor: '#FFFFFF' },
};

// ─── Single animated toast item ───────────────────────────────────────────────

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const { bottom } = useSafeAreaInsets();
  const translateY = useSharedValue(80);
  const opacity    = useSharedValue(0);
  const onDoneRef  = useRef(onDone);
  onDoneRef.current = onDone;

  const MOTION = { reduceMotion: ReduceMotion.System };

  useEffect(() => {
    // Slide + fade in
    translateY.value = withTiming(0, { duration: 250, ...MOTION });
    opacity.value    = withTiming(1, { duration: 200, ...MOTION });

    // Auto-dismiss
    const timer = setTimeout(() => {
      translateY.value = withTiming(80, { duration: 250, ...MOTION });
      opacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 250, ...MOTION }, (finished) => {
          if (finished) runOnJS(onDoneRef.current)();
        }),
      );
    }, item.duration);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   opacity.value,
  }));

  const cfg = CONFIG[item.type];

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position:      'absolute',
          bottom:        (bottom || 24) + 16,
          left:          16,
          right:         16,
          flexDirection: 'row',
          alignItems:    'center',
          gap:           12,
          paddingHorizontal: 16,
          paddingVertical:   12,
          borderRadius:  12,
          backgroundColor: cfg.bg,
          shadowColor:   '#000',
          shadowOpacity: 0.16,
          shadowRadius:  24,
          shadowOffset:  { width: 0, height: -2 },
          elevation:     12,
          zIndex:        9999,
        },
      ]}
    >
      <Ionicons color={cfg.iconColor} name={cfg.icon} size={20} />
      <Text
        numberOfLines={2}
        style={{
          flex:        1,
          fontFamily:  'Inter_500Medium',
          fontSize:    14,
          lineHeight:  20,
          color:       '#FFFFFF',
        }}
      >
        {item.message}
      </Text>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let _idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'default', duration = 3000) => {
    const id = String(++_idCounter);
    setQueue((prev) => [...prev.slice(-1), { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    show,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info'),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {queue.map((item) => (
        <ToastView key={item.id} item={item} onDone={() => dismiss(item.id)} />
      ))}
    </ToastCtx.Provider>
  );
}
