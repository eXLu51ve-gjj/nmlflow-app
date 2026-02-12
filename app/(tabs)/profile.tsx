import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/store';
import { authAPI, removeToken, getServerUrl, saveServerUrl } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import TablerIcon from '@/components/TablerIcon';

export default function ProfileScreen() {
  const { user, logout, showAllTasks, setShowAllTasks } = useStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [editingServer, setEditingServer] = useState(false);
  const [newServerUrl, setNewServerUrl] = useState('');

  useEffect(() => {
    getServerUrl().then(url => {
      setServerUrl(url || '');
      setNewServerUrl(url || '');
    });
  }, []);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await authAPI.logout(); } catch (e) {}
          await removeToken();
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSaveServer = async () => {
    if (newServerUrl.trim()) {
      const saved = await saveServerUrl(newServerUrl);
      setServerUrl(saved);
      setEditingServer(false);
      Alert.alert('Сохранено', 'Адрес сервера обновлён. Перезайдите для применения.');
    }
  };

  return (
    <ScreenWrapper title="Профиль">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* User Card */}
        <GlassCard style={styles.userCard}>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <TablerIcon name={isAdmin ? 'shield-check' : 'user-circle'} size={12} color={isAdmin ? colors.warning : colors.primary} />
              <Text style={[styles.roleText, isAdmin && styles.roleTextAdmin]}>
                {isAdmin ? 'Администратор' : 'Сотрудник'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Stats */}
        {user?.dailyRate && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.dailyRate} ₽</Text>
              <Text style={styles.statLabel}>Ставка/день</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>+{user.carBonus || 0} ₽</Text>
              <Text style={styles.statLabel}>Доп. ставка</Text>
            </View>
          </View>
        )}

        {/* Server Settings */}
        <GlassCard style={styles.serverCard}>
          <View style={styles.serverHeader}>
            <TablerIcon name="server" size={18} color={colors.primary} />
            <Text style={styles.serverTitle}>Сервер</Text>
            <TouchableOpacity onPress={() => setEditingServer(!editingServer)}>
              <TablerIcon name={editingServer ? 'x' : 'pencil'} size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {editingServer ? (
            <View style={styles.serverEdit}>
              <TextInput style={styles.serverInput} value={newServerUrl} onChangeText={setNewServerUrl}
                placeholder="example.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveServer}>
                <TablerIcon name="check" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.serverUrl}>{serverUrl || 'Не указан'}</Text>
          )}
        </GlassCard>

        {/* Tasks Settings */}
        <GlassCard style={styles.serverCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <TablerIcon name="list" size={18} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.serverTitle}>Все задачи</Text>
                <Text style={styles.settingDescription}>Показывать все задачи проекта</Text>
              </View>
            </View>
            <Switch value={showAllTasks} onValueChange={setShowAllTasks}
              trackColor={{ false: colors.glass, true: colors.primary }} thumbColor={colors.text} />
          </View>
        </GlassCard>

        {/* Menu */}
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('В разработке', 'Эта функция скоро будет доступна')}>
            <View style={styles.menuIcon}><TablerIcon name="user-edit" size={20} color={colors.primary} /></View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Редактировать профиль</Text>
              <Text style={styles.menuSubtitle}>Имя, телефон, аватар</Text>
            </View>
            <TablerIcon name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('В разработке', 'Эта функция скоро будет доступна')}>
            <View style={styles.menuIcon}><TablerIcon name="lock" size={20} color={colors.primary} /></View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Сменить пароль</Text>
              <Text style={styles.menuSubtitle}>Безопасность аккаунта</Text>
            </View>
            <TablerIcon name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('В разработке', 'Эта функция скоро будет доступна')}>
            <View style={styles.menuIcon}><TablerIcon name="bell" size={20} color={colors.primary} /></View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Уведомления</Text>
              <Text style={styles.menuSubtitle}>Настройки push-уведомлений</Text>
            </View>
            <TablerIcon name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          
          {isAdmin && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin')}>
              <View style={styles.menuIcon}><TablerIcon name="shield-check" size={20} color={colors.warning} /></View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Админ-панель</Text>
                <Text style={styles.menuSubtitle}>Управление системой</Text>
              </View>
              <TablerIcon name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          <TablerIcon name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{loggingOut ? 'Выход...' : 'Выйти из аккаунта'}</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>nmL Flow</Text>
          <Text style={styles.appVersion}>Версия 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.primary },
  userInfo: { marginLeft: spacing.md, flex: 1 },
  userName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  userEmail: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm,
    backgroundColor: colors.glass, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, alignSelf: 'flex-start',
  },
  roleText: { color: colors.primary, fontSize: fontSize.xs, marginLeft: spacing.xs },
  roleTextAdmin: { color: colors.warning },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  menu: { marginBottom: spacing.xl },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  menuContent: { flex: 1, marginLeft: spacing.md },
  menuTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  menuSubtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.errorBg, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '500', marginLeft: spacing.sm },
  appInfo: { alignItems: 'center' },
  appName: { color: colors.textMuted, fontSize: fontSize.sm },
  appVersion: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  serverCard: { marginBottom: spacing.lg },
  serverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  serverTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '500', marginLeft: spacing.sm, flex: 1 },
  serverUrl: { color: colors.textSecondary, fontSize: fontSize.sm },
  serverEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  serverInput: {
    flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.sm,
  },
  serverSaveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTextContainer: { marginLeft: spacing.sm, flex: 1 },
  settingDescription: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
