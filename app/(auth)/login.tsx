import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { authAPI, settingsAPI, getServerUrl, saveServerUrl } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

type Mode = 'login' | 'register';
type RegistrationMode = 'open' | 'invite' | 'closed';

interface SystemSettings {
  registrationMode: RegistrationMode;
  maintenanceMode: boolean;
}

export default function LoginScreen() {
  const { setUser, setAuthenticated } = useStore();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState('');
  const [showServerInput, setShowServerInput] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    registrationMode: 'open',
    maintenanceMode: false,
  });
  
  // Form fields
  const [serverUrl, setServerUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load saved server URL
      const url = await getServerUrl();
      if (url) {
        setServerUrl(url);
        // Try to load system settings
        await loadSystemSettings();
      }
    } catch (e) {
      console.log('Failed to load initial data');
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const settings = await settingsAPI.get();
      if (settings) {
        setSystemSettings({
          registrationMode: settings.registrationMode || 'open',
          maintenanceMode: settings.maintenanceMode || false,
        });
      }
    } catch (e) {
      console.log('Failed to load system settings');
    }
  };

  // Reload settings when server URL changes
  const handleServerUrlChange = async (url: string) => {
    setServerUrl(url);
    if (url.trim()) {
      try {
        await saveServerUrl(url);
        await loadSystemSettings();
      } catch (e) {}
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validate server URL
    if (!serverUrl.trim()) {
      setError('Укажите адрес сервера');
      setShowServerInput(true);
      return;
    }
    
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }
    
    if (mode === 'register') {
      // Check if registration is allowed
      if (systemSettings.registrationMode === 'closed') {
        setError('Регистрация закрыта');
        return;
      }
      
      if (!name) {
        setError('Введите имя');
        return;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      if (password.length < 6) {
        setError('Пароль минимум 6 символов');
        return;
      }
      // Check invite code if required
      if (systemSettings.registrationMode === 'invite' && !inviteCode.trim()) {
        setError('Введите код приглашения');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Save server URL first
      await saveServerUrl(serverUrl);
      
      if (mode === 'login') {
        const { user } = await authAPI.login(email, password);
        setUser(user);
        setAuthenticated(true);
      } else {
        const fullName = surname ? `${name} ${surname}`.trim() : name;
        const { user } = await authAPI.register({ 
          name: fullName, 
          email, 
          phone, 
          password,
          inviteCode: systemSettings.registrationMode === 'invite' ? inviteCode : undefined,
        });
        setUser(user);
        setAuthenticated(true);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Ошибка подключения';
      if (errorMsg.includes('Network') || errorMsg.includes('timeout')) {
        setError('Не удалось подключиться к серверу. Проверьте адрес.');
        setShowServerInput(true);
      } else if (errorMsg.includes('invite') || errorMsg.includes('Invite') || errorMsg.includes('код')) {
        setError('Неверный код приглашения');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
  };

  const isRegisterDisabled = systemSettings.registrationMode === 'closed' || systemSettings.maintenanceMode;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>nmL Flow</Text>
          <Text style={styles.subtitle}>CRM и управление проектами</Text>
        </View>

        {/* Maintenance Mode Banner */}
        {systemSettings.maintenanceMode && (
          <View style={styles.maintenanceBanner}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <View style={styles.maintenanceTextContainer}>
              <Text style={styles.maintenanceTitle}>Режим обслуживания</Text>
              <Text style={styles.maintenanceSubtitle}>Вход только для администраторов</Text>
            </View>
          </View>
        )}

        {/* Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => switchMode('login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Вход
            </Text>
          </TouchableOpacity>
          <View style={styles.tabSpacer} />
          <TouchableOpacity 
            style={[styles.tab, mode === 'register' && styles.tabActive, isRegisterDisabled && styles.tabDisabled]}
            onPress={() => !isRegisterDisabled && switchMode('register')}
            activeOpacity={isRegisterDisabled ? 1 : 0.7}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive, isRegisterDisabled && styles.tabTextDisabled]}>
              Регистрация {isRegisterDisabled ? '🔒' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <GlassCard style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Invite Code Required Info */}
          {mode === 'register' && systemSettings.registrationMode === 'invite' && (
            <View style={styles.inviteInfoBox}>
              <Ionicons name="key" size={16} color="#f59e0b" />
              <Text style={styles.inviteInfoText}>Для регистрации требуется код приглашения</Text>
            </View>
          )}

          {/* Server URL - collapsible */}
          <TouchableOpacity 
            style={styles.serverToggle}
            onPress={() => setShowServerInput(!showServerInput)}
          >
            <Ionicons name="server-outline" size={16} color={colors.textMuted} />
            <Text style={styles.serverToggleText} numberOfLines={1}>
              {serverUrl || 'Указать сервер'}
            </Text>
            <Ionicons 
              name={showServerInput ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={colors.textMuted} 
            />
          </TouchableOpacity>
          
          {showServerInput && (
            <Input
              label="Адрес сервера"
              placeholder="example.com или IP:порт"
              value={serverUrl}
              onChangeText={handleServerUrlChange}
              icon="globe-outline"
              autoCapitalize="none"
            />
          )}

          {mode === 'register' && (
            <>
              {/* Name fields */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    label="Имя"
                    placeholder="Иван"
                    value={name}
                    onChangeText={setName}
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    label="Фамилия"
                    placeholder="Иванов"
                    value={surname}
                    onChangeText={setSurname}
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </>
          )}

          <Input
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
          />

          {mode === 'register' && (
            <Input
              label="Телефон"
              placeholder="+7 999 123-45-67"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="call-outline"
            />
          )}

          <View style={styles.passwordContainer}>
            <Input
              label="Пароль"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock-closed-outline"
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <View style={styles.passwordContainer}>
              <Input
                label="Подтвердите пароль"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                icon="lock-closed-outline"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Invite Code Field */}
          {mode === 'register' && systemSettings.registrationMode === 'invite' && (
            <View style={styles.inviteCodeContainer}>
              <Input
                label="Код приглашения"
                placeholder="XXXXXX"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                icon="key-outline"
                autoCapitalize="characters"
              />
            </View>
          )}

          <Button
            title={mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.text} />}
          />

          {/* Switch mode link */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            </Text>
            <TouchableOpacity 
              onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
              disabled={mode === 'login' && isRegisterDisabled}
            >
              <Text style={[styles.switchLink, mode === 'login' && isRegisterDisabled && styles.switchLinkDisabled]}>
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={styles.footer}>© 2025 nmL Flow</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.primary,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  maintenanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  maintenanceTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  maintenanceTitle: {
    color: '#f59e0b',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  maintenanceSubtitle: {
    color: 'rgba(245, 158, 11, 0.8)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabSpacer: {
    width: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
  },
  tabTextDisabled: {
    color: colors.textMuted,
  },
  form: {
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  inviteInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  inviteInfoText: {
    color: '#f59e0b',
    fontSize: fontSize.xs,
    marginLeft: spacing.sm,
    flex: 1,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  serverToggleText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 38,
    padding: spacing.xs,
  },
  inviteCodeContainer: {
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  switchText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  switchLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  switchLinkDisabled: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  footer: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
