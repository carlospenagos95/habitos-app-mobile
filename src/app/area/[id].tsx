import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAreas } from '@/db/client';
import {
  archiveHabit,
  createHabit,
  listHabitsByArea,
  renameHabit,
  setHabitReminder,
} from '@/db/habits';
import {
  cancelHabitReminder,
  requestNotificationPermission,
  scheduleHabitReminder,
} from '@/notifications';
import type { AreaId, Habit } from '@/types';

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const areaId = id as AreaId;
  const router = useRouter();
  const area = getAreas().find((a) => a.id === areaId);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reminderWarning, setReminderWarning] = useState<string | null>(null);
  const [reminderEditingId, setReminderEditingId] = useState<number | null>(null);

  const reload = () => setHabits(listHabitsByArea(areaId));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  const handleCreate = async () => {
    try {
      const habit = createHabit(areaId, newHabitName);
      setNewHabitName('');
      setError(null);

      if (reminderDate != null) {
        const time = formatTime(reminderDate);
        const granted = await requestNotificationPermission();
        if (granted) {
          const notificationId = await scheduleHabitReminder(habit.name, time);
          setHabitReminder(habit.id, time, notificationId);
          setReminderWarning(null);
        } else {
          setHabitReminder(habit.id, time, null);
          setReminderWarning(
            'Los recordatorios están desactivados: no diste permiso de notificaciones.'
          );
        }
        setReminderDate(null);
      }

      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el hábito.');
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingId(habit.id);
    setEditingName(habit.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const confirmRename = () => {
    if (editingId == null) return;
    try {
      renameHabit(editingId, editingName);
      setEditingId(null);
      setEditingName('');
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al renombrar el hábito.');
    }
  };

  const handleArchive = async (habit: Habit) => {
    if (habit.notificationId != null) {
      await cancelHabitReminder(habit.notificationId);
      setHabitReminder(habit.id, habit.reminderTime, null);
    }
    archiveHabit(habit.id);
    reload();
  };

  const openReminderPicker = (habit: Habit) => {
    setReminderEditingId(habit.id);
    setError(null);
  };

  const handleReminderChange = async (habit: Habit, date: Date) => {
    setReminderEditingId(null);
    const time = formatTime(date);

    if (habit.notificationId != null) {
      await cancelHabitReminder(habit.notificationId);
    }

    const granted = await requestNotificationPermission();
    if (granted) {
      const notificationId = await scheduleHabitReminder(habit.name, time);
      setHabitReminder(habit.id, time, notificationId);
      setReminderWarning(null);
    } else {
      setHabitReminder(habit.id, time, null);
      setReminderWarning(
        'Los recordatorios están desactivados: no diste permiso de notificaciones.'
      );
    }
    reload();
  };

  const handleRemoveReminder = async (habit: Habit) => {
    if (habit.notificationId != null) {
      await cancelHabitReminder(habit.notificationId);
    }
    setHabitReminder(habit.id, null, null);
    reload();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Áreas</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{area?.name ?? ''}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del nuevo hábito"
          value={newHabitName}
          onChangeText={setNewHabitName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.reminderRow}>
        <TouchableOpacity onPress={() => setShowTimePicker(true)}>
          <Text style={styles.action}>
            {reminderDate != null
              ? `⏰ Recordatorio a las ${formatTime(reminderDate)}`
              : 'Agregar hora de recordatorio (opcional)'}
          </Text>
        </TouchableOpacity>
        {reminderDate != null && (
          <TouchableOpacity onPress={() => setReminderDate(null)}>
            <Text style={styles.action}>Quitar</Text>
          </TouchableOpacity>
        )}
      </View>
      {showTimePicker && (
        <DateTimePicker
          value={reminderDate ?? new Date()}
          mode="time"
          is24Hour
          onChange={(_event, date) => {
            setShowTimePicker(false);
            if (date != null) setReminderDate(date);
          }}
        />
      )}
      {error != null && <Text style={styles.error}>{error}</Text>}
      {reminderWarning != null && <Text style={styles.warning}>{reminderWarning}</Text>}

      <FlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        ListEmptyComponent={<Text style={styles.empty}>Sin hábitos todavía.</Text>}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <View style={styles.habitBlock}>
              <View style={styles.habitRow}>
                <TextInput
                  style={[styles.input, styles.editInput]}
                  value={editingName}
                  onChangeText={setEditingName}
                  autoFocus
                />
                <TouchableOpacity onPress={confirmRename}>
                  <Text style={styles.action}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEditing}>
                  <Text style={styles.action}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.habitBlock}>
              <View style={styles.habitRow}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{item.name}</Text>
                </View>
                <TouchableOpacity onPress={() => startEditing(item)}>
                  <Text style={styles.action}>Renombrar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleArchive(item)}>
                  <Text style={styles.action}>Archivar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reminderRow}>
                <TouchableOpacity onPress={() => openReminderPicker(item)}>
                  <Text style={styles.habitReminder}>
                    {item.reminderTime != null
                      ? `⏰ ${item.reminderTime} · cambiar hora`
                      : 'Agregar hora de recordatorio'}
                  </Text>
                </TouchableOpacity>
                {item.reminderTime != null && (
                  <TouchableOpacity onPress={() => handleRemoveReminder(item)}>
                    <Text style={styles.action}>Quitar hora</Text>
                  </TouchableOpacity>
                )}
              </View>
              {reminderEditingId === item.id && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour
                  onChange={(_event, date) => {
                    if (date != null) {
                      handleReminderChange(item, date);
                    } else {
                      setReminderEditingId(null);
                    }
                  }}
                />
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  back: { fontSize: 16, color: '#208AEF', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  form: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: '#208AEF',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  error: { color: '#c00', marginBottom: 8 },
  warning: { color: '#b06500', marginBottom: 8 },
  empty: { color: '#666', marginTop: 16 },
  habitBlock: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16 },
  habitReminder: { fontSize: 13, color: '#666' },
  editInput: { paddingVertical: 4 },
  action: { color: '#208AEF', fontWeight: '600' },
});
