import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '@/store';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function GlassCard({ children, style, noPadding }: GlassCardProps) {
  const { uiOpacity } = useStore();
  // uiOpacity: 1 = fully opaque background, 0.3 = more transparent background
  const bgOpacity = uiOpacity;
  
  return (
    <View style={[styles.card, noPadding && styles.noPadding, { backgroundColor: `rgba(30, 20, 50, ${bgOpacity})` }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
});
