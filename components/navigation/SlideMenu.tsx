import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store';
import TablerIcon from '@/components/TablerIcon';
import { colors, fontSize, spacing, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.8;

interface MenuItem {
  id: string;
  label: string;
  icon: 'home' | 'checklist' | 'message' | 'credit-card' | 'settings' | 'shield-check' | 'users';
  route: string;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Главная', icon: 'home', route: '/' },
  { id: 'crm', label: 'CRM', icon: 'users', route: '/crm' },
  { id: 'tasks', label: 'Задачи', icon: 'checklist', route: '/tasks' },
  { id: 'chat', label: 'Чат', icon: 'message', route: '/chat' },
  { id: 'salary', label: 'Зарплата', icon: 'credit-card', route: '/salary' },
  { id: 'settings', label: 'Настройки', icon: 'settings', route: '/settings' },
  { id: 'admin', label: 'Админ-панель', icon: 'shield-check', route: '/admin', adminOnly: true },
];

interface SlideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function SlideMenu({ visible, onClose }: SlideMenuProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useStore();
  const translateX = useSharedValue(-MENU_WIDTH);
  const opacity = useSharedValue(0);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateX.value = withTiming(-MENU_WIDTH, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? 'auto' : 'none',
  }));

  const handleMenuPress = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/login');
  };

  if (!visible && translateX.value === -MENU_WIDTH) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Menu */}
      <Animated.View style={[styles.menu, menuStyle, { paddingTop: insets.top + spacing.lg }]}>
        {/* User Profile */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user?.avatar || `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(user?.name || 'User')}&backgroundColor=7c3aed` }} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Пользователь'}</Text>
            <Text style={styles.userRole}>{isAdmin ? 'Администратор' : 'Сотрудник'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuSection} showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <TablerIcon name={item.icon} size={24} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Logout Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <TablerIcon name="logout" size={24} color={colors.error} />
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: 'rgba(15, 10, 30, 0.98)',
    paddingHorizontal: spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  userRole: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  menuLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginLeft: spacing.md,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginLeft: spacing.md,
  },
});

export default SlideMenu;
