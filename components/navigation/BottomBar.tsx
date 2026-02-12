import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import TablerIcon from '@/components/TablerIcon';
import { colors, fontSize, spacing, borderRadius } from '@/constants/theme';

interface BottomBarProps {
  title: string;
  showMenuButton?: boolean;
  rightAction?: React.ReactNode;
  onTitlePress?: () => void;
  bottomInset?: number;
}

export function BottomBar({ title, showMenuButton = true, rightAction, onTitlePress, bottomInset = 0 }: BottomBarProps) {
  const navigation = useNavigation<any>();

  const openDrawer = () => {
    console.log('[BottomBar] Opening drawer');
    try {
      navigation.openDrawer();
    } catch (e) {
      console.log('[BottomBar] openDrawer failed, trying dispatch');
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 8) }]} pointerEvents="box-none">
      <View style={styles.content} pointerEvents="box-none">
        {/* Left - Menu Button */}
        {showMenuButton && (
          <Pressable 
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed
            ]}
            onPress={openDrawer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <TablerIcon name="menu-2" size={24} color={colors.text} />
          </Pressable>
        )}

        {/* Center - Title */}
        {onTitlePress ? (
          <Pressable 
            style={({ pressed }) => [
              styles.titleContainer,
              pressed && styles.titlePressed
            ]}
            onPress={onTitlePress}
          >
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </Pressable>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
        )}

        {/* Right - Custom Action */}
        <View style={styles.rightSection} pointerEvents="box-none">
          {rightAction}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.md,
  },
  menuButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  menuButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.glassBorder,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  titlePressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  rightSection: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
});

export default BottomBar;
