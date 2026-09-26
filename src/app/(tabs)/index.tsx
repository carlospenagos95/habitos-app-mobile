import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
import { todayLocal } from '@/date';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';
import type { Area, Habit } from '@/types';

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
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => {
            const { icon, color } = AREA_STYLE[section.area.id];
            return (
              <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={18} color={color} />
                <Text style={[styles.sectionHeaderText, { color }]}>{section.title}</Text>
              </View>
            );
          }}
          renderItem={({ item, section }) => {
            const done = doneIds.has(item.id);
            const areaColor = AREA_STYLE[section.area.id].color;
            return (
              <TouchableOpacity style={styles.habitCard} onPress={() => handleToggle(item.id)}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={done ? areaColor : colors.textMuted}
                />
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
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  habitName: { flex: 1, fontSize: fontSize.md, color: colors.text },
  habitNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyButtonText: { color: colors.surface, fontWeight: '600' },
});
