import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useShop } from './store';
import { notificationDestination } from './notifications-domain';
// No automatic permission request, token upload or Expo relay. Direct APNs/FCM channels need
// the store's authenticated HTTPS backend and verified device/account binding before activation.
export default function PushObserver() {
  const router = useRouter(); const { state } = useShop();
  useEffect(() => {
    function open(response: Notifications.NotificationResponse) {
      const destination = notificationDestination(response.notification.request.content.data, state.context);
      router.push(destination as '/notifications');
      void Notifications.clearLastNotificationResponseAsync();
    }
    const previous = Notifications.getLastNotificationResponse();
    if (previous) open(previous);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [router, state.context]);
  return null;
}
