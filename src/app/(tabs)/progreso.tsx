import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAreas } from '@/db/client';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForHabit } from '@/db/logs';
import { todayLocal } from '@/date';
import { computeAreaCompletion, computeStreak } from '@/streaks';
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
        {areasProgress.map(({ area, habits, percentage }) => (
          <View key={area.id} style={styles.areaBlock}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaName}>{area.name}</Text>
              <Text style={styles.areaPercentage}>
                {percentage === null ? '—' : `${percentage} %`}
              </Text>
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
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  areaBlock: { marginBottom: 20 },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
    marginBottom: 6,
  },
  areaName: { fontSize: 16, fontWeight: '700' },
  areaPercentage: { fontSize: 16, fontWeight: '700', color: '#208AEF' },
  empty: { color: '#666', paddingVertical: 4 },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  habitName: { fontSize: 15 },
  streak: { fontSize: 15 },
});
