import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  topSafeArea?: boolean;
};

export function Screen({ children, scroll = true, topSafeArea = false }: ScreenProps) {
  const edges = topSafeArea
    ? (['top', 'left', 'right', 'bottom'] as const)
    : (['left', 'right', 'bottom'] as const);

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-5"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={edges}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
