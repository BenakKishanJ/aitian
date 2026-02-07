import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    notification: null,
    isLoading: false,
    error: null,
  });

  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Push notifications require a physical device',
        }));
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Permission not granted for push notifications',
        }));
        return;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      const token = tokenData.data;

      // Save token to Firestore
      await setDoc(doc(db, 'pushTokens', user.uid), {
        token,
        userId: user.uid,
        userEmail: user.email,
        platform: Platform.OS,
        updatedAt: new Date().toISOString(),
      });

      setState((prev) => ({
        ...prev,
        expoPushToken: token,
        isLoading: false,
      }));

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#000000',
        });

        await Notifications.setNotificationChannelAsync('assignments', {
          name: 'Assignments',
          description: 'Assignment notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#000000',
        });

        await Notifications.setNotificationChannelAsync('grades', {
          name: 'Grades',
          description: 'Grade notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#000000',
        });
      }
    } catch (err: any) {
      console.error('Error registering for push notifications:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to register for push notifications',
      }));
    }
  }, [user]);

  // Unregister push notifications
  const unregisterPushNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'pushTokens', user.uid));
      setState((prev) => ({ ...prev, expoPushToken: null }));
    } catch (err) {
      console.error('Error unregistering push notifications:', err);
    }
  }, [user]);

  // Schedule local notification
  const scheduleNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: Record<string, any>,
      trigger?: Notifications.NotificationTriggerInput
    ) => {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data || {},
          },
          trigger: trigger || null,
        });
        return id;
      } catch (err) {
        console.error('Error scheduling notification:', err);
        throw err;
      }
    },
    []
  );

  // Cancel scheduled notification
  const cancelNotification = useCallback(async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
      console.error('Error canceling notification:', err);
    }
  }, []);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (err) {
      console.error('Error canceling all notifications:', err);
    }
  }, []);

  // Clear badge count
  const clearBadge = useCallback(async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (err) {
      console.error('Error clearing badge:', err);
    }
  }, []);

  useEffect(() => {
    // Register on mount if user is logged in
    if (user) {
      registerForPushNotifications();
    }

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setState((prev) => ({ ...prev, notification }));
      }
    );

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle deep linking or navigation based on data
        console.log('Notification response:', data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, registerForPushNotifications]);

  return {
    ...state,
    registerForPushNotifications,
    unregisterPushNotifications,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    clearBadge,
  };
}
