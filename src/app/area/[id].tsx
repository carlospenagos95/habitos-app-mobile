import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
  isNotificationSchedulingUnsupported,
  requestNotificationPermission,
  scheduleHabitReminder,
} from '@/notifications';
import { addHabitFromPlan, listSuggestions } from '@/db/plan';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';
import type { AreaId, Habit, PlanItem } from '@/types';

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const EXPO_GO_WARNING =
  'Los recordatorios locales no funcionan en Expo Go (SDK 53+). La hora queda guardada; usa un development build para que suenen.';
const PERMISSION_DENIED_WARNING =
  'Los recordatorios están desactivados: no diste permiso de notificaciones.';

/** Agenda (o no) el recordatorio de un hábito y devuelve el aviso a mostrar, si aplica. */
async function trySetReminder(
  habit: { id: number; name: string },
  time: string
): Promise<string | null> {
  if (isNotificationSchedulingUnsupported()) {
    setHabitReminder(habit.id, time, null);
    return EXPO_GO_WARNING;
  }

  const granted = await requestNotificationPermission();
  if (granted) {
    const notificationId = await scheduleHabitReminder(habit.name, time);
    setHabitReminder(habit.id, time, notificationId);
    return null;
  }

  setHabitReminder(habit.id, time, null);
  return PERMISSION_DENIED_WARNING;
}

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const areaId = id as AreaId;
  const router = useRouter();
  const area = getAreas().find((a) => a.id === areaId);
  const areaStyle = AREA_STYLE[areaId];

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reminderWarning, setReminderWarning] = useState<string | null>(null);
  const [reminderEditingId, setReminderEditingId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<PlanItem[]>([]);

  const reload = () => {
    setHabits(listHabitsByArea(areaId));
    setSuggestions(listSuggestions(areaId));
  };

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
        const warning = await trySetReminder(habit, formatTime(reminderDate));
        setReminderWarning(warning);
        setReminderDate(null);
      }

      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el hábito.');
    }
  };

  const handleAddSuggestion = (planItemId: string) => {
    try {
      addHabitFromPlan(planItemId);
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar la sugerencia.');
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

    if (habit.notificationId != null) {
      await cancelHabitReminder(habit.notificationId);
    }

    const warning = await trySetReminder(habit, formatTime(date));
    setReminderWarning(warning);
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
      <View style={styles.header}>
        {areaStyle != null && (
          <Ionicons name={areaStyle.icon} size={28} color={areaStyle.color} />
        )}
        <Text style={styles.title}>{area?.name ?? ''}</Text>
      </View>

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
        ListFooterComponent={
          <View style={styles.suggestions}>
            <Text style={styles.sectionTitle}>Sugerencias del plan</Text>
            {suggestions.length === 0 ? (
              <Text style={styles.empty}>Ya agregaste todas las sugerencias de esta área.</Text>
            ) : (
              suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <Text style={styles.habitName}>{suggestion.name}</Text>
                  <TouchableOpacity onPress={() => handleAddSuggestion(suggestion.id)}>
                    <Text style={styles.action}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        }
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
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  back: { fontSize: fontSize.md, color: colors.primary, marginBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  form: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addButtonText: { color: colors.surface, fontWeight: '600' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  error: { color: colors.error, marginBottom: spacing.sm },
  warning: { color: colors.warning, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, marginTop: spacing.md },
  habitBlock: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  habitInfo: { flex: 1 },
  habitName: { fontSize: fontSize.md, color: colors.text },
  habitReminder: { fontSize: fontSize.sm, color: colors.textMuted },
  editInput: { paddingVertical: spacing.xs },
  action: { color: colors.primary, fontWeight: '600' },
  suggestions: { marginTop: spacing.lg, paddingBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
});
