import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleTaskReminder(
  title: string,
  subject: string,
  dueDate: Date
): Promise<string | null> {
  try {
    // Programamos el recordatorio para 1 hora antes de la fecha de vencimiento
    const reminderDate = new Date(dueDate.getTime() - 60 * 60 * 1000);

    // Si la fecha de recordatorio ya paso, no programamos nada
    if (reminderDate.getTime() <= Date.now()) {
      console.log('La fecha de recordatorio ya paso, no se programa notificacion');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Recordatorio de tarea',
        body: `${title} (${subject}) vence pronto`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error al programar notificacion:', error);
    return null;
  }
}