import type { ReactNode } from 'react';
import { View } from 'react-native';

// Shadow e1 — opacity 0.06, radius 6, y 2, elevation 2
const SHADOW_E1 = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const SHADOW_E2 = {
  shadowColor: '#000',
  shadowOpacity: 0.10,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

type Props = {
  children: ReactNode;
  className?: string;
  shadow?: 'e1' | 'e2' | 'none';
  noPadding?: boolean;
};

export function Card({ children, className = '', shadow = 'e1', noPadding = false }: Props) {
  const shadowStyle = shadow === 'e1' ? SHADOW_E1 : shadow === 'e2' ? SHADOW_E2 : undefined;

  return (
    <View
      className={`rounded-lg bg-white ${noPadding ? '' : 'p-4'} ${className}`}
      style={shadowStyle}
    >
      {children}
    </View>
  );
}

export { SHADOW_E1, SHADOW_E2 };
