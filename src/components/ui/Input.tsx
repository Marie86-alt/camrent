import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#DC2626'
    : focused
    ? '#3B63D4'
    : '#E2E8F0';

  return (
    <View className="gap-1.5">
      {/* Overline label */}
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: error ? '#DC2626' : '#64748B',
        }}
      >
        {label}
      </Text>

      {/* Field */}
      <TextInput
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        placeholderTextColor="#94A3B8"
        style={[
          {
            height: 52,
            borderRadius: 8,
            borderWidth: focused ? 1.5 : 1,
            borderColor,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: '#0F172A',
          },
          // Focus halo (shadow)
          focused && !error
            ? {
                shadowColor: '#3B63D4',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
                elevation: 2,
              }
            : undefined,
          style,
        ]}
        {...rest}
      />

      {/* Error or hint */}
      {error ? (
        <Text
          style={{ fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, color: '#DC2626' }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: '#64748B' }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
