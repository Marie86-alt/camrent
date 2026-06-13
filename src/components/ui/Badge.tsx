import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'neutral';

type Props = {
  children: string;
  variant?: BadgeVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  dot?: boolean;
};

// Static color pairs — kept as literals so NativeWind includes them
const STYLES: Record<BadgeVariant, { bg: string; text: string; iconColor: string }> = {
  primary: { bg: 'bg-primary-100',    text: 'text-primary-700',  iconColor: '#3B63D4' },
  success: { bg: 'bg-success-light',  text: 'text-success',      iconColor: '#16A34A' },
  warning: { bg: 'bg-warning-light',  text: 'text-warning',      iconColor: '#D97706' },
  danger:  { bg: 'bg-danger-light',   text: 'text-danger',       iconColor: '#DC2626' },
  info:    { bg: 'bg-info-light',     text: 'text-info',         iconColor: '#0077B6' },
  accent:  { bg: 'bg-accent-50',      text: 'text-accent-600',   iconColor: '#E8900A' },
  neutral: { bg: 'bg-slate-100',      text: 'text-slate-600',    iconColor: '#64748B' },
};

export function Badge({ children, variant = 'neutral', icon, dot }: Props) {
  const s = STYLES[variant];

  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-0.5 ${s.bg}`}>
      {dot ? (
        <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.iconColor }} />
      ) : null}
      {icon ? <Ionicons color={s.iconColor} name={icon} size={11} /> : null}
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, lineHeight: 16, color: s.iconColor }}>
        {children}
      </Text>
    </View>
  );
}
