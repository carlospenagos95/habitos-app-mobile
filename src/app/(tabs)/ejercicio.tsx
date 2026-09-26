import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRoutineForWeekday, getWorkoutHabit } from '@/db/exercise';
import { isHabitDone } from '@/db/logs';
import { todayLocal } from '@/date';
import { buildSteps, sectionDurationSec, totalDurationSec } from '@/exercise/steps';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';
import type { Routine } from '@/types';

const FISICA = AREA_STYLE.fisica;

export default function EjercicioScreen() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [doneToday, setDoneToday] = useState(false);

  const reload = useCallback(() => {
    setRoutine(getRoutineForWeekday(new Date().getDay()));
    const habit = getWorkoutHabit();
    setDoneToday(habit != null && isHabitDone(habit.id, todayLocal()));
  }, []);

  useFocusEffect(reload);

  if (routine == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ejercicio</Text>
        <Text style={styles.muted}>No hay rutina para hoy.</Text>
      </View>
    );
  }

  const totalMin = Math.round(totalDurationSec(buildSteps(routine)) / 60);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ejercicio</Text>
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="fitness-outline" size={24} color={FISICA.color} />
            <View style={styles.headerText}>
              <Text style={styles.label}>Rutina de hoy · {routine.id}</Text>
              <Text style={styles.routineName}>{routine.name}</Text>
            </View>
          </View>
          <Text style={styles.description}>{routine.description}</Text>
          <Text style={styles.muted}>{totalMin} min · sin equipo</Text>
          {doneToday && (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color={FISICA.color} />
              <Text style={[styles.doneText, { color: FISICA.color }]}>Hecho hoy</Text>
            </View>
          )}
        </View>

        {routine.sections.map((section, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionName}>{section.name}</Text>
              <Text style={styles.muted}>{Math.round(sectionDurationSec(section) / 60)} min</Text>
            </View>
            <Text style={styles.muted}>
              {section.items.length} ejercicios
              {section.rounds > 1 ? ` · ${section.rounds} rondas` : ''}
            </Text>
          </View>
        ))}

        <Pressable
          style={[styles.startButton, { backgroundColor: FISICA.color }]}
          onPress={() => router.push({ pathname: '/sesion/[routineId]', params: { routineId: routine.id } })}
        >
          <Ionicons name="play" size={20} color={colors.surface} />
          <Text style={styles.startText}>Empezar</Text>
        </Pressable>
      </ScrollView>
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
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  headerText: { flex: 1 },
  label: { fontSize: fontSize.sm, color: colors.textMuted },
  routineName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  description: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.xs },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  doneText: { fontSize: fontSize.md, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  sectionName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
  },
  startText: { fontSize: fontSize.md, fontWeight: '700', color: colors.surface },
});
