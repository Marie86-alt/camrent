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
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SheetAction = {
  label:     string;
  onPress:   () => void;
  variant?:  'default' | 'danger';
  icon?:     React.ComponentProps<typeof Ionicons>['name'];
};

type SheetOptions = {
  title?:    string;
  subtitle?: string;
  actions:   SheetAction[];
};

type BottomSheetContextValue = {
  show: (options: SheetOptions) => void;
  hide: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const BSCtx = createContext<BottomSheetContextValue>({
  show: () => {},
  hide: () => {},
});

export const useBottomSheet = () => useContext(BSCtx);

// ─── Sheet component ──────────────────────────────────────────────────────────

const SPRING = { damping: 20, stiffness: 200, reduceMotion: ReduceMotion.System };
const TIMING = { duration: 200, reduceMotion: ReduceMotion.System };

function Sheet({ options, onClose }: { options: SheetOptions; onClose: () => void }) {
  const { bottom } = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const bgOpacity  = useSharedValue(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function animateClose() {
    translateY.value = withTiming(400, TIMING);
    bgOpacity.value  = withTiming(0, TIMING, (finished) => {
      if (finished) runOnJS(onCloseRef.current)();
    });
  }

  useEffect(() => {
    translateY.value = withSpring(0, SPRING);
    bgOpacity.value  = withTiming(0.5, TIMING);
  }, [translateY, bgOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <>
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          overlayStyle,
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
        ]}
      />

      {/* Tap-to-dismiss area */}
      <Pressable
        accessibilityLabel="Fermer"
        onPress={animateClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          sheetStyle,
          {
            position:   'absolute',
            left:       0,
            right:      0,
            bottom:     0,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius:  24,
            borderTopRightRadius: 24,
            paddingBottom: bottom + 8,
            shadowColor:   '#000',
            shadowOpacity: 0.16,
            shadowRadius:  24,
            shadowOffset:  { width: 0, height: -2 },
            elevation:     12,
          },
        ]}
      >
        {/* Handle */}
        <View className="items-center pt-3 pb-4">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        {/* Title / subtitle */}
        {(options.title || options.subtitle) ? (
          <View className="px-6 pb-4">
            {options.title ? (
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 24, color: '#0F172A' }}
              >
                {options.title}
              </Text>
            ) : null}
            {options.subtitle ? (
              <Text
                style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: '#64748B', marginTop: 4 }}
              >
                {options.subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Actions */}
        <View className="px-4 gap-2 pb-2">
          {options.actions.map((action, index) => {
            const isDanger  = action.variant === 'danger';
            const textColor = isDanger ? '#DC2626' : '#0F172A';
            const bgClass   = isDanger ? 'bg-danger-light' : 'bg-slate-50';

            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => { action.onPress(); animateClose(); }}
                className={`flex-row items-center gap-3 rounded-lg px-4 py-4 ${bgClass}`}
              >
                {action.icon ? (
                  <Ionicons color={textColor} name={action.icon} size={20} />
                ) : null}
                <Text
                  style={{
                    flex:       1,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize:   16,
                    color:      textColor,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}

          {/* Cancel button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            onPress={animateClose}
            className="items-center rounded-lg bg-slate-100 px-4 py-4 mt-1"
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#64748B' }}>
              Annuler
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ visible: boolean; options: SheetOptions | null }>({
    visible: false,
    options: null,
  });

  const show = useCallback((options: SheetOptions) => {
    setState({ visible: true, options });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <BSCtx.Provider value={{ show, hide }}>
      {children}
      {state.visible && state.options ? (
        <Modal
          animationType="none"
          onRequestClose={hide}
          statusBarTranslucent
          transparent
          visible={state.visible}
        >
          <Sheet onClose={hide} options={state.options} />
        </Modal>
      ) : null}
    </BSCtx.Provider>
  );
}
