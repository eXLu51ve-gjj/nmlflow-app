import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store';
import { authAPI, usersAPI, removeToken, getServerUrl, saveServerUrl, getToken } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { BackgroundPicker } from '@/components/settings/BackgroundPicker';
import TablerIcon from '@/components/TablerIcon';

export default function SettingsScreen() {
  const { user, setUser, logout, showAllTasks, setShowAllTasks, notificationsEnabled, setNotificationsEnabled, chatNotificationsEnabled, setChatNotificationsEnabled, backgroundOverlay, setBackgroundOverlay, uiOpacity, setUiOpacity } = useStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [editingServer, setEditingServer] = useState(false);
  const [newServerUrl, setNewServerUrl] = useState('');
  
  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    city: '',
    citizenship: '',
  });

  useEffect(() => {
    getServerUrl().then(url => {
      setServerUrl(url || '');
      setNewServerUrl(url || '');
    });
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        citizenship: user.citizenship || '',
      });
    }
  }, [user]);

  const handleSaveServer = async () => {
    if (newServerUrl.trim()) {
      const saved = await saveServerUrl(newServerUrl);
      setServerUrl(saved);
      setEditingServer(false);
      Alert.alert('Сохранено', 'Адрес сервера обновлён. Перезайдите для применения.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updated = await usersAPI.update(user.id, profileData);
      setUser({ ...user, ...updated });
      setEditingProfile(false);
      Alert.alert('Сохранено', 'Профиль обновлён');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const asset = result.assets[0];
        
        // Get server URL and upload
        const serverUrl = await getServerUrl();
        const token = await getToken();
        
        // Convert to base64
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
        
        const base64Data = await base64Promise;
        const filename = `avatar-${Date.now()}.jpg`;
        
        // Upload to server
        const uploadRes = await fetch(`${serverUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ base64: base64Data, filename, mimeType: 'image/jpeg' }),
        });
        
        if (!uploadRes.ok) throw new Error('Upload failed');
        
        const { url } = await uploadRes.json();
        const fullUrl = url.startsWith('http') ? url : `${serverUrl}${url}`;
        
        // Update user avatar
        if (user?.id) {
          const updated = await usersAPI.update(user.id, { avatar: fullUrl });
          setUser({ ...user, ...updated, avatar: fullUrl });
          Alert.alert('Готово', 'Аватарка обновлена');
        }
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить аватарку');
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const nameParts = (user?.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <ScreenWrapper title="Настройки">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="user-circle" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Профиль</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditingProfile(!editingProfile)}>
              <TablerIcon name={editingProfile ? 'x' : 'pencil'} size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <GlassCard>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarSection} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: user?.avatar || `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(user?.name || 'User')}&backgroundColor=7c3aed` }} 
                  style={styles.avatar}
                />
                <View style={styles.avatarOverlay}>
                  <TablerIcon name="camera" size={24} color={colors.text} />
                </View>
              </View>
              <Text style={styles.avatarHint}>{uploadingAvatar ? 'Загрузка...' : 'Нажмите чтобы изменить'}</Text>
            </TouchableOpacity>

            {editingProfile ? (
              <View style={styles.profileForm}>
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Имя</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={profileData.name.split(' ')[0] || ''}
                      onChangeText={(text) => {
                        const parts = profileData.name.split(' ');
                        parts[0] = text;
                        setProfileData({ ...profileData, name: parts.join(' ').trim() });
                      }}
                      placeholder="Имя"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Фамилия</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={profileData.name.split(' ').slice(1).join(' ') || ''}
                      onChangeText={(text) => {
                        const firstName = profileData.name.split(' ')[0] || '';
                        setProfileData({ ...profileData, name: `${firstName} ${text}`.trim() });
                      }}
                      placeholder="Фамилия"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <View style={[styles.fieldInput, styles.fieldDisabled]}>
                      <Text style={styles.fieldDisabledText}>{user?.email}</Text>
                    </View>
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Телефон</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={profileData.phone}
                      onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                      placeholder="Телефон"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Город</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={profileData.city}
                      onChangeText={(text) => setProfileData({ ...profileData, city: text })}
                      placeholder="Город"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Гражданство</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={profileData.citizenship}
                      onChangeText={(text) => setProfileData({ ...profileData, citizenship: text })}
                      placeholder="Гражданство"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveProfileBtn, saving && styles.saveProfileBtnDisabled]} 
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text style={styles.saveProfileText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.profileRow}>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Имя</Text>
                    <Text style={styles.profileValue}>{firstName || '—'}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Фамилия</Text>
                    <Text style={styles.profileValue}>{lastName || '—'}</Text>
                  </View>
                </View>
                <View style={styles.profileRow}>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Email</Text>
                    <Text style={styles.profileValue}>{user?.email || '—'}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Телефон</Text>
                    <Text style={styles.profileValue}>{user?.phone || '—'}</Text>
                  </View>
                </View>
                <View style={styles.profileRow}>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Город</Text>
                    <Text style={styles.profileValue}>{user?.city || '—'}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Гражданство</Text>
                    <Text style={styles.profileValue}>{user?.citizenship || '—'}</Text>
                  </View>
                </View>
              </View>
            )}
          </GlassCard>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
            <TablerIcon name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>{loggingOut ? 'Выход...' : 'Выйти из аккаунта'}</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="palette" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Оформление</Text>
          </View>
          <GlassCard>
            <BackgroundPicker />
          </GlassCard>
        </View>

        {/* Transparency Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="adjustments" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Прозрачность</Text>
          </View>
          <GlassCard>
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <Text style={styles.settingTitle}>Затемнение фона</Text>
                <Text style={styles.sliderValue}>{Math.round(backgroundOverlay * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={0.9}
                value={backgroundOverlay}
                onValueChange={setBackgroundOverlay}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.glass}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.settingDescription}>Затемняет фоновое изображение</Text>
            </View>
            
            <View style={[styles.sliderRow, { marginTop: spacing.lg }]}>
              <View style={styles.sliderHeader}>
                <Text style={styles.settingTitle}>Непрозрачность UI</Text>
                <Text style={styles.sliderValue}>{Math.round(uiOpacity * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.2}
                maximumValue={1}
                value={uiOpacity}
                onValueChange={setUiOpacity}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.glass}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.settingDescription}>100% — полностью непрозрачный фон карточек</Text>
            </View>
          </GlassCard>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="clipboard" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Задачи</Text>
          </View>
          <GlassCard>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Показывать все задачи</Text>
                <Text style={styles.settingDescription}>Отображать все задачи проекта, а не только назначенные вам</Text>
              </View>
              <Switch
                value={showAllTasks}
                onValueChange={setShowAllTasks}
                trackColor={{ false: colors.glass, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </GlassCard>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="bell" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Уведомления</Text>
          </View>
          <GlassCard>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push-уведомления</Text>
                <Text style={styles.settingDescription}>Получать уведомления о новых задачах и изменениях</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={async (value) => {
                  setNotificationsEnabled(value);
                  // Sync to server
                  try {
                    const serverUrl = await getServerUrl();
                    const token = await getToken();
                    if (user?.id && serverUrl && token) {
                      await fetch(`${serverUrl}/api/users/push-token`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ userId: user.id, notificationsEnabled: value }),
                      });
                    }
                  } catch (e) {
                    console.error('Failed to sync notification setting:', e);
                  }
                }}
                trackColor={{ false: colors.glass, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
            
            <View style={[styles.settingRow, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.glassBorder }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Уведомления чата</Text>
                <Text style={styles.settingDescription}>Получать уведомления о новых сообщениях в общем чате</Text>
              </View>
              <Switch
                value={chatNotificationsEnabled}
                onValueChange={async (value) => {
                  setChatNotificationsEnabled(value);
                  try {
                    const serverUrl = await getServerUrl();
                    const token = await getToken();
                    if (user?.id && serverUrl && token) {
                      await fetch(`${serverUrl}/api/push-token`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ userId: user.id, chatNotificationsEnabled: value }),
                      });
                    }
                  } catch (e) {
                    console.error('Failed to sync chat notification setting:', e);
                  }
                }}
                trackColor={{ false: colors.glass, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </GlassCard>
        </View>

        {/* Server Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TablerIcon name="server" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Сервер</Text>
          </View>
          <GlassCard>
            <View style={styles.serverRow}>
              <View style={styles.serverInfo}>
                <Text style={styles.settingTitle}>Адрес сервера</Text>
                {!editingServer && (
                  <Text style={styles.serverUrl}>{serverUrl || 'Не указан'}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setEditingServer(!editingServer)}>
                <TablerIcon name={editingServer ? 'x' : 'pencil'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {editingServer && (
              <View style={styles.serverEdit}>
                <TextInput
                  style={styles.serverInput}
                  value={newServerUrl}
                  onChangeText={setNewServerUrl}
                  placeholder="example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveServer}>
                  <TablerIcon name="check" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </View>

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
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginLeft: spacing.sm, flex: 1 },
  editBtn: { padding: spacing.xs },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, marginRight: spacing.md },
  settingTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  settingDescription: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  serverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serverInfo: { flex: 1 },
  serverUrl: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  serverEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  serverInput: {
    flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.sm,
  },
  serverSaveBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatarContainer: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary },
  avatarOverlay: { 
    position: 'absolute', bottom: 0, right: 0, 
    width: 32, height: 32, borderRadius: 16, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.glass,
  },
  avatarHint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  profileForm: { gap: spacing.md },
  formRow: { flexDirection: 'row', gap: spacing.md },
  formField: { flex: 1 },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: 4 },
  fieldInput: {
    backgroundColor: colors.glass, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.sm,
  },
  fieldDisabled: { opacity: 0.6 },
  fieldDisabledText: { color: colors.textMuted, fontSize: fontSize.sm },
  saveProfileBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveProfileBtnDisabled: { opacity: 0.6 },
  saveProfileText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  profileInfo: { gap: spacing.md },
  profileRow: { flexDirection: 'row', gap: spacing.md },
  profileField: { flex: 1 },
  profileLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: 2 },
  profileValue: { color: colors.text, fontSize: fontSize.sm },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.errorBg, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md,
  },
  logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '500', marginLeft: spacing.sm },
  appInfo: { alignItems: 'center', paddingVertical: spacing.xl },
  appName: { color: colors.textMuted, fontSize: fontSize.sm },
  appVersion: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  sliderRow: {},
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sliderValue: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  slider: { width: '100%', height: 40 },
});
