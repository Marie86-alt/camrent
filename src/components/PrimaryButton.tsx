import type { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

type PrimaryButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ children, disabled, loading, onPress }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`h-12 items-center justify-center rounded-lg ${
        disabled || loading ? 'bg-slate-300' : 'bg-brand-blue'
      }`}
      disabled={disabled || loading}
      onPress={onPress}
      style={{ backgroundColor: disabled || loading ? '#cbd5e1' : '#3B63D4' }}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="font-semibold text-white">{children}</Text>}
    </TouchableOpacity>
  );
}
