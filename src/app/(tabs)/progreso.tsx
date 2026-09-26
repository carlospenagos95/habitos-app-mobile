import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAreas } from '@/db/client';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForHabit } from '@/db/logs';
import { todayLocal } from '@/date';
import { computeAreaCompletion, computeStreak } from '@/streaks';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';
import type { Area, Habit } from '@/types';

const TODAY = todayLocal();

type HabitProgress = { habit: Habit; streak: number };
type AreaProgress = { area: Area; habits: HabitProgress[]; percentage: number | null };

export default function ProgresoScreen() {
  const [areasProgress, setAreasProgress] = useState<AreaProgress[]>([]);

  const reload = useCallback(() => {
    const result = getAreas().map((area) => {
      const habits = listHabitsByArea(area.id);
      const doneDatesByHabit = new Map(habits.map((h) => [h.id, getLogsForHabit(h.id)]));

      const habitProgress: HabitProgress[] = habits.map((habit) => ({
        habit,
        streak: computeStreak(doneDatesByHabit.get(habit.id) ?? [], TODAY),
      }));

      const percentage = computeAreaCompletion(habits, doneDatesByHabit, TODAY);

      return { area, habits: habitProgress, percentage };
    });
    setAreasProgress(result);
  }, []);

  useFocusEffect(reload);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progreso</Text>
      <ScrollView>
        {areasProgress.map(({ area, habits, percentage }) => {
          const { icon, color } = AREA_STYLE[area.id];
          return (
            <View key={area.id} style={styles.card}>
              <View style={styles.areaHeader}>
                <Ionicons name={icon} size={22} color={color} />
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaPercentage}>
                  {percentage === null ? '—' : `${percentage} %`}
                </Text>
              </View>
              <View style={styles.barTrack}>
                {percentage !== null && (
                  <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
                )}
              </View>
              {habits.length === 0 ? (
                <Text style={styles.empty}>Sin hábitos activos.</Text>
              ) : (
                habits.map(({ habit, streak }) => (
                  <View key={habit.id} style={styles.habitRow}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.streak}>🔥 {streak}</Text>
                  </View>
                ))
              )}
            </View>
          );
        })}
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
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  areaName: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  areaPercentage: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barFill: { height: '100%' },
  empty: { color: colors.textMuted, paddingVertical: spacing.xs },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  habitName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  streak: { fontSize: fontSize.sm, color: colors.text },
});
