import type { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

type PrimaryButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({ children, disabled, loading, onPress, variant = 'primary' }: PrimaryButtonProps) {
  const isSecondary = variant === 'secondary';
  const backgroundColor = disabled || loading ? '#cbd5e1' : isSecondary ? '#ffffff' : '#3B63D4';
  const borderColor = isSecondary && !disabled && !loading ? '#3B63D4' : backgroundColor;
  const textColor = isSecondary && !disabled && !loading ? 'text-brand-blue' : 'text-white';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`h-12 items-center justify-center rounded-lg ${
        disabled || loading ? 'bg-slate-300' : isSecondary ? 'bg-white' : 'bg-brand-blue'
      }`}
      disabled={disabled || loading}
      onPress={onPress}
      style={{ backgroundColor, borderColor, borderWidth: isSecondary ? 1.5 : 0 }}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text className={`font-semibold ${textColor}`}>{children}</Text>}
    </TouchableOpacity>
  );
}
