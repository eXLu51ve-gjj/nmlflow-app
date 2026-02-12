import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import TablerIcon from '@/components/TablerIcon';
import { colors, fontSize, spacing } from '@/constants/theme';

interface HeaderProps {
  title: string;
  showMenuButton?: boolean;
  rightAction?: React.ReactNode;
}

export function Header({ title, showMenuButton = true, rightAction }: HeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <BlurView intensity={20} tint="dark" style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Left - Menu Button */}
        <View style={styles.leftSection}>
          {showMenuButton && (
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={openDrawer}
              activeOpacity={0.7}
            >
              <TablerIcon name="menu-2" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right - Custom Action */}
        <View style={styles.rightSection}>
          {rightAction}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 10, 30, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.md,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});

export default Header;
