import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Animated, { ReduceMotion, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingSearch from '../../../assets/onboarding/onboarding-1-search.svg';
import OnboardingDriver from '../../../assets/onboarding/onboarding-2-driver.svg';
import OnboardingPay from '../../../assets/onboarding/onboarding-3-pay.svg';
import { Button } from '../../components/ui';

type OnboardingSlide = {
  Illustration: React.FC<SvgProps>;
  subtitle: string;
  title: string;
};

const SLIDES: OnboardingSlide[] = [
  {
    Illustration: OnboardingSearch,
    title: 'Trouve ta voiture ideale',
    subtitle: 'Des centaines de vehicules verifies pres de chez toi.',
  },
  {
    Illustration: OnboardingDriver,
    title: 'Avec ou sans chauffeur',
    subtitle: 'Conduis toi-meme ou choisis un chauffeur de confiance.',
  },
  {
    Illustration: OnboardingPay,
    title: 'Paie en toute securite',
    subtitle: 'MTN MoMo, Orange Money ou carte, en quelques secondes.',
  },
];

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(active ? '#3B63D4' : '#CBD5E1', {
        duration: 220,
        reduceMotion: ReduceMotion.System,
      }),
      width: withTiming(active ? 28 : 8, {
        duration: 220,
        reduceMotion: ReduceMotion.System,
      }),
    }),
    [active],
  );

  return <Animated.View className="h-2 rounded-full" style={style} />;
}

type Props = {
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: Props) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onDone();
      return;
    }

    listRef.current?.scrollToIndex({ animated: true, index: index + 1 });
  }, [index, isLast, onDone]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(Math.min(Math.max(nextIndex, 0), SLIDES.length - 1));
    },
    [width],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<OnboardingSlide> | null | undefined, itemIndex: number) => ({
      index: itemIndex,
      length: width,
      offset: width * itemIndex,
    }),
    [width],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OnboardingSlide>) => {
      const Illustration = item.Illustration;

      return (
        <View className="items-center justify-center px-6" style={{ width }}>
          <View
            className="w-full items-center rounded-xl bg-white px-5 py-8"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="h-64 w-full items-center justify-center">
              <Illustration height="100%" width="100%" />
            </View>
          </View>

          <View className="mt-10 items-center px-4">
            <Text className="text-center font-display text-[31px] leading-[38px] text-slate-950">
              {item.title}
            </Text>
            <Text className="mt-4 text-center font-sans text-[15px] leading-[22px] text-slate-600">
              {item.subtitle}
            </Text>
          </View>
        </View>
      );
    },
    [width],
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.title, []);
  const dots = useMemo(
    () => SLIDES.map((slide, slideIndex) => <Dot active={slideIndex === index} key={slide.title} />),
    [index],
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <View className="flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
            <Ionicons color="#3B63D4" name="car-sport-outline" size={20} />
          </View>
          <Text className="font-sans-bold text-base text-slate-950">Autofix Pro</Text>
        </View>

        <Pressable
          accessibilityLabel="Passer l'onboarding"
          className="min-h-11 justify-center rounded-full px-3"
          onPress={onDone}
        >
          <Text className="font-sans-semi text-sm text-primary-600">Passer</Text>
        </Pressable>
      </View>

      <FlatList
        data={SLIDES}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        horizontal
        keyExtractor={keyExtractor}
        onMomentumScrollEnd={onMomentumScrollEnd}
        pagingEnabled
        ref={listRef}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <View className="gap-6 px-5 pb-7">
        <View className="h-3 flex-row items-center justify-center gap-2">{dots}</View>

        <Button onPress={goNext}>{isLast ? 'Commencer' : 'Suivant'}</Button>
      </View>
    </SafeAreaView>
  );
}
