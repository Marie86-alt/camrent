import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  keyboardAware?: boolean;
  keyboardVerticalOffset?: number;
  scroll?: boolean;
  topSafeArea?: boolean;
};

export function Screen({
  children,
  keyboardAware = true,
  keyboardVerticalOffset = 0,
  scroll = true,
  topSafeArea = false,
}: ScreenProps) {
  const edges = topSafeArea
    ? (['top', 'left', 'right', 'bottom'] as const)
    : (['left', 'right', 'bottom'] as const);

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-5"
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={edges} style={styles.root}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={styles.root}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
