import { Platform } from 'react-native';
import Constants, { AppOwnership } from 'expo-constants';

// `expo-notifications` deja de estar disponible en Expo Go (SDK 53+): con solo importarlo
// en Expo Go, el módulo arroja un error a nivel de módulo. Por eso el import es dinámico y
// solo se ejecuta fuera de Expo Go (dev build o build standalone); en Expo Go degradamos con
// gracia: no se agenda nada y se avisa al usuario que los recordatorios están desactivados.
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

const ANDROID_CHANNEL_ID = 'habitos-recordatorios';

let handlerConfigured = false;

async function loadNotifications() {
  if (isExpoGo) return null;

  const Notifications = await import('expo-notifications');

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de hábitos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return Notifications;
}

/** Pide permiso de notificaciones. Devuelve true si quedó concedido. */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Programa una notificación diaria para un hábito a la hora dada ("HH:MM", 24 h, hora local).
 * Devuelve el id de la notificación programada (para poder cancelarla después), o null si no
 * se pudo programar (p. ej. corriendo en Expo Go).
 */
export async function scheduleHabitReminder(
  habitName: string,
  time: string
): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

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

/** Cancela una notificación programada por su id. No falla si ya no existe o es null. */
export async function cancelHabitReminder(notificationId: string | null): Promise<void> {
  if (notificationId == null) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** true si el entorno actual (Expo Go) no soporta notificaciones locales programadas. */
export function isNotificationSchedulingUnsupported(): boolean {
  return isExpoGo;
}
