import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'habitos-recordatorios';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Recordatorios de hábitos',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Pide permiso de notificaciones. Devuelve true si quedó concedido. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Programa una notificación diaria para un hábito a la hora dada ("HH:MM", 24 h, hora local).
 * Devuelve el id de la notificación programada (para poder cancelarla después).
 */
export async function scheduleHabitReminder(
  habitName: string,
  time: string
): Promise<string> {
  await ensureAndroidChannel();

  const [hour, minute] = time.split(':').map(Number);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Buenos Hábitos',
      body: `Recordatorio: ${habitName}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

/** Cancela una notificación programada por su id. No falla si ya no existe. */
export async function cancelHabitReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
