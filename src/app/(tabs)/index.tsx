import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAreas } from '@/db/client';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForDate, toggleHabitDone } from '@/db/logs';
import type { Area, Habit } from '@/types';

function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TODAY = todayLocal();

type Section = { title: string; area: Area; data: Habit[] };

export default function HoyScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());

  const reload = useCallback(() => {
    const grouped = getAreas()
      .map((area) => ({ title: area.name, area, data: listHabitsByArea(area.id) }))
      .filter((section) => section.data.length > 0);
    setSections(grouped);

    const done = new Set(
      getLogsForDate(TODAY)
        .map((log) => log.habitId)
    );
    setDoneIds(done);
  }, []);

  // Recarga cada vez que la pestaña Hoy vuelve a tener foco (p. ej. tras crear un hábito en Áreas).
  useFocusEffect(reload);

  const handleToggle = (habitId: number) => {
    toggleHabitDone(habitId, TODAY);
    reload();
  };

  const isEmpty = sections.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoy</Text>
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Todavía no tienes hábitos.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push({ pathname: '/areas' })}
          >
            <Text style={styles.emptyButtonText}>Ir a Áreas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(habit) => String(habit.id)}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const done = doneIds.has(item.id);
            return (
              <TouchableOpacity style={styles.habitRow} onPress={() => handleToggle(item.id)}>
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.habitName, done && styles.habitNameDone]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#208AEF' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  habitName: { fontSize: 16 },
  habitNameDone: { textDecorationLine: 'line-through', color: '#999' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#666' },
  emptyButton: {
    backgroundColor: '#208AEF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
});
