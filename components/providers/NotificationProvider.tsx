import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useStore } from '@/store';
import { getServerUrl, getToken } from '@/lib/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, notificationsEnabled } = useStore();
  const responseListener = useRef<any>();
  const notificationListener = useRef<any>();
  const isInitializedRef = useRef(false);

  // Setup notification channel for Android
  const setupNotificationChannel = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('tasks', {
          name: 'Задачи',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7c3aed',
          sound: 'default',
        });
      } catch (error) {
        console.log('Failed to setup notification channel:', error);
      }
    }
  }, []);

  // Register for push notifications and get FCM token
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Get FCM token (Expo handles this automatically with expo-notifications)
      const tokenData = await Notifications.getDevicePushTokenAsync();
      console.log('[Notifications] FCM Token:', tokenData.data);
      
      return tokenData.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }, []);

  // Send FCM token to server
  const sendTokenToServer = useCallback(async (fcmToken: string) => {
    try {
      const serverUrl = await getServerUrl();
      const authToken = await getToken();
      
      if (!serverUrl || !authToken) {
        console.log('[Notifications] No server URL or auth token');
        return;
      }

      const response = await fetch(`${serverUrl}/api/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcmToken,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('[Notifications] FCM token registered on server');
      } else {
        console.log('[Notifications] Failed to register token:', await response.text());
      }
    } catch (error) {
      console.error('[Notifications] Error sending token to server:', error);
    }
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setupNotificationChannel();

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] Tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.taskId) {
        // Navigate to task - implement if needed
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [setupNotificationChannel]);

  // Register token when user logs in
  useEffect(() => {
    if (!user?.id || !notificationsEnabled) return;

    const registerToken = async () => {
      const fcmToken = await registerForPushNotifications();
      if (fcmToken) {
        await sendTokenToServer(fcmToken);
      }
    };

    registerToken();
  }, [user?.id, notificationsEnabled, registerForPushNotifications, sendTokenToServer]);

  return <>{children}</>;
}

export default NotificationProvider;
