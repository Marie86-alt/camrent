import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { Button } from './Button';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  /** SVG illustration — replaces the Ionicons icon when provided. ~180px wide. */
  illustration?: React.FC<SvgProps>;
};

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta, illustration: Illustration }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      {Illustration ? (
        <Illustration height={140} width={180} />
      ) : (
        <View className="h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Ionicons color="#94A3B8" name={icon} size={44} />
        </View>
      )}

      <View className="items-center gap-2">
        <Text
          style={{ fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 24, color: '#0F172A', textAlign: 'center' }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: '#475569', textAlign: 'center' }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {ctaLabel && onCta ? (
        <Button fullWidth={false} onPress={onCta} variant="primary">
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}
