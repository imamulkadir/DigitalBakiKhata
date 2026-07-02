import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageToggleCompact from './LanguageToggleCompact';

// Sibling of the screen's KeyboardAvoidingView/ScrollView, not a child of the
// padded scroll content — so it pins to the real screen corner instead of
// sitting inset by the content padding.
export default function AuthLanguageCorner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.corner, { top: insets.top + 12 }]}>
      <LanguageToggleCompact accentColor="#1B8A5A" />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
});
