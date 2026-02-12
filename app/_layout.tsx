import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/store';
import { authAPI, getToken } from '@/lib/api';
import { colors } from '@/constants/theme';
import { MenuProvider } from '@/components/providers/MenuProvider';
import { BackgroundProvider } from '@/components/providers/BackgroundProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

export default function RootLayout() {
  const { setUser, setAuthenticated } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const { user } = await authAPI.me();
        setUser(user);
        setAuthenticated(true);
      }
    } catch (error) {
      setAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <StatusBar style="light" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <BackgroundProvider>
          <NotificationProvider>
            <MenuProvider>
              <StatusBar style="light" translucent={true} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="task/[id]" options={{ presentation: 'modal' }} />
              </Stack>
            </MenuProvider>
          </NotificationProvider>
        </BackgroundProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
