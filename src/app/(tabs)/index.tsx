import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cat } from '@/cat/Cat';
import { getCatMessage, type CatState } from '@/cat/messages';
import { usePurr } from '@/cat/purr';
import { useCatMood } from '@/cat/useCatAnimation';
import { getAreas } from '@/db/client';
import { getRoutineForWeekday, getWorkoutHabit, WORKOUT_PLAN_ITEM_ID } from '@/db/exercise';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForDate, isHabitDone, toggleHabitDone } from '@/db/logs';
import { formatLongDateEs, todayLocal } from '@/date';
import { buildSteps, totalDurationSec } from '@/exercise/steps';
import { AREA_STYLE, colors, fonts, radius, spacing } from '@/theme';
import type { Area, Habit, Routine } from '@/types';
import { HabitCheckRow } from '@/ui/HabitCheckRow';
import { PawProgressBar } from '@/ui/PawProgressBar';
import { SkyHeader } from '@/ui/SkyHeader';
import { SpeechBubble } from '@/ui/SpeechBubble';

const TODAY = todayLocal();
const FISICA = AREA_STYLE.fisica;

type Section = { area: Area; habits: Habit[] };

function greeting(hour: number): string {
  if (hour < 12) return '¡Miau, buenos días!';
  if (hour < 19) return '¡Miau, buenas tardes!';
  return '¡Miau, buenas noches!';
}

function hoyState(done: number, total: number): CatState {
  const kind = total === 0 ? 'sin-habitos' : done === 0 ? 'cero' : done === total ? 'completo' : 'progreso';
  return { screen: 'hoy', kind, done, total };
}

export default function HoyScreen() {
  const router = useRouter();
  const cat = useCatMood();
  const purr = usePurr();
  const [sections, setSections] = useState<Section[]>([]);
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineDone, setRoutineDone] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const reload = useCallback(() => {
    const grouped = getAreas()
      .map((area) => ({ area, habits: listHabitsByArea(area.id) }))
      .filter((section) => section.habits.length > 0);
    setSections(grouped);
    setDoneIds(new Set(getLogsForDate(TODAY).map((log) => log.habitId)));

    setRoutine(getRoutineForWeekday(new Date().getDay()));
    const workout = getWorkoutHabit();
    setRoutineDone(workout != null && isHabitDone(workout.id, TODAY));
  }, []);

  // Recarga cada vez que la pestaña Hoy vuelve a tener foco (p. ej. tras crear un hábito en Áreas).
  useFocusEffect(reload);

  const habits = sections.flatMap((section) => section.habits);
  const total = habits.length;
  const done = habits.filter((habit) => doneIds.has(habit.id)).length;

  const handleToggle = (habitId: number) => {
    const wasDone = doneIds.has(habitId);
    toggleHabitDone(habitId, TODAY);
    reload();
    // Solo al marcar: celebración únicamente en la transición a 100 %.
    if (!wasDone) cat.trigger(done + 1 === total ? 'celebra' : 'feliz');
  };

  const handleCatPress = () => {
    purr();
    setMessageIndex((i) => i + 1);
    cat.trigger('mimado');
  };

  const startWorkout = () => {
    if (routine) router.push({ pathname: '/sesion/[routineId]', params: { routineId: routine.id } });
  };

  const routineMin = routine ? Math.round(totalDurationSec(buildSteps(routine)) / 60) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SkyHeader style={styles.header}>
        <Text style={styles.date}>{formatLongDateEs(new Date())}</Text>
        <Text style={styles.title}>{greeting(new Date().getHours())}</Text>
        <View style={styles.catRow}>
          <SpeechBubble text={getCatMessage(hoyState(done, total), messageIndex)} style={styles.bubble} />
          <Cat pose="sentado" size={140} {...cat.props} onPress={handleCatPress} />
        </View>
      </SkyHeader>

      {total === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>Todavía no tienes hábitos.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push({ pathname: '/areas' })}>
            <Text style={styles.primaryButtonText}>Ir a Áreas</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Progreso de hoy</Text>
            <Text style={styles.progressCount}>
              {done} / {total}
            </Text>
          </View>
          <PawProgressBar value={done / total} />
        </View>
      )}

      <View style={styles.body}>
        {routine != null && !routineDone && (
          <Pressable
            style={({ pressed }) => [styles.routineCard, pressed && styles.pressed]}
            onPress={startWorkout}
            accessibilityRole="button"
            accessibilityLabel={`Empezar rutina ${routine.id}, ${routine.name}`}
          >
            <View style={styles.routineIcon}>
              <Ionicons name="barbell-outline" size={24} color={colors.surface} />
            </View>
            <View style={styles.routineText}>
              <Text style={styles.routineName} numberOfLines={1}>
                Rutina {routine.id} · {routine.name}
              </Text>
              <Text style={styles.routineMeta}>{routineMin} min · sin equipo</Text>
            </View>
            <View style={styles.routineButton}>
              <Text style={styles.routineButtonText}>Empezar</Text>
            </View>
          </Pressable>
        )}

        {sections.map(({ area, habits: areaHabits }) => {
          const style = AREA_STYLE[area.id];
          return (
            <View key={area.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name={style.icon} size={18} color={style.color} />
                <Text style={[styles.sectionTitle, { color: style.ink }]}>{area.name}</Text>
              </View>
              {areaHabits.map((habit) => (
                <HabitCheckRow
                  key={habit.id}
                  name={habit.name}
                  done={doneIds.has(habit.id)}
                  color={style.color}
                  onPress={() => handleToggle(habit.id)}
                  right={
                    habit.planItemId === WORKOUT_PLAN_ITEM_ID && routine ? (
                      <Pressable onPress={startWorkout} hitSlop={spacing.sm} accessibilityLabel="Empezar rutina">
                        <Ionicons name="play-circle-outline" size={30} color={FISICA.color} />
                      </Pressable>
                    ) : undefined
                  }
                />
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const cardShadow = {
  shadowColor: colors.text,
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.lg },
  header: { paddingBottom: 40 },
  date: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.skyInkSoft,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, color: colors.skyInk, marginTop: 2 },
  catRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  bubble: { flex: 1, marginBottom: 56 },
  card: {
    marginHorizontal: spacing.md,
    marginTop: -28,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  emptyCard: { alignItems: 'center', gap: spacing.md },
  emptyText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMuted },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButtonText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.surface },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  progressCount: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.accent },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: 14 },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: FISICA.soft,
    borderRadius: 20,
  },
  pressed: { opacity: 0.7 },
  routineIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: FISICA.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineText: { flex: 1 },
  routineName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  routineMeta: { fontFamily: fonts.body, fontSize: 13, color: FISICA.ink },
  routineButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  routineButtonText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.surface },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: 16 },
});
