import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useStore } from '@/store';
import TablerIcon from '@/components/TablerIcon';
import { colors, fontSize, spacing, borderRadius } from '@/constants/theme';

interface MenuItem {
  id: string;
  label: string;
  icon: 'home' | 'checklist' | 'message' | 'credit-card' | 'settings' | 'shield-check';
  route: string;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Главная', icon: 'home', route: 'index' },
  { id: 'tasks', label: 'Задачи', icon: 'checklist', route: 'tasks' },
  { id: 'chat', label: 'Чат', icon: 'message', route: 'chat' },
  { id: 'salary', label: 'Зарплата', icon: 'credit-card', route: 'salary' },
  { id: 'settings', label: 'Настройки', icon: 'settings', route: 'settings' },
  { id: 'admin', label: 'Админ-панель', icon: 'shield-check', route: 'admin', adminOnly: true },
];

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, projects, tasks, selectedProjectId, setSelectedProjectId, logout } = useStore();
  const [tasksExpanded, setTasksExpanded] = useState(false);

  const isAdmin = user?.isAdmin || user?.role === 'admin';
  const currentRoute = state.routes[state.index]?.name;

  const handleMenuPress = (route: string) => {
    navigation.navigate(route);
  };

  const handleProjectPress = (projectId: string) => {
    setSelectedProjectId(projectId);
    navigation.navigate('tasks');
  };

  const handleLogout = () => {
    logout();
    navigation.closeDrawer();
  };

  const getTaskCountForProject = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId).length;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
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
            // Skip admin item for non-admins
            if (item.adminOnly && !isAdmin) return null;

            const isActive = currentRoute === item.route;
            const isTasksItem = item.id === 'tasks';

            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    if (isTasksItem) {
                      setTasksExpanded(!tasksExpanded);
                    } else {
                      handleMenuPress(item.route);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <TablerIcon 
                    name={item.icon} 
                    size={24} 
                    color={isActive ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                  {isTasksItem && (
                    <TablerIcon 
                      name={tasksExpanded ? 'chevron-down' : 'chevron-right'} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  )}
                </TouchableOpacity>

                {/* Projects Submenu */}
                {isTasksItem && tasksExpanded && (
                  <View style={styles.submenu}>
                    {projects.map((project) => {
                      const isProjectActive = selectedProjectId === project.id && currentRoute === 'tasks';
                      const taskCount = getTaskCountForProject(project.id);

                      return (
                        <TouchableOpacity
                          key={project.id}
                          style={[styles.submenuItem, isProjectActive && styles.submenuItemActive]}
                          onPress={() => handleProjectPress(project.id)}
                          activeOpacity={0.7}
                        >
                          <TablerIcon 
                            name="layout-kanban" 
                            size={18} 
                            color={isProjectActive ? colors.primary : colors.textMuted} 
                          />
                          <Text 
                            style={[styles.submenuLabel, isProjectActive && styles.submenuLabelActive]}
                            numberOfLines={1}
                          >
                            {project.name}
                          </Text>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{taskCount}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.95)',
  },
  content: {
    flex: 1,
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
  menuItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  menuLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginLeft: spacing.md,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.primary,
  },
  submenu: {
    marginLeft: spacing.xl,
    marginBottom: spacing.sm,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  submenuItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  submenuLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  submenuLabelActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
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

export default DrawerContent;
