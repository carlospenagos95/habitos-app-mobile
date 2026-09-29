import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cat } from '@/cat/Cat';
import { getCatMessage, type CatState } from '@/cat/messages';
import { usePurr } from '@/cat/purr';
import { useCatMood } from '@/cat/useCatAnimation';
import { getRoutineForWeekday, getWorkoutHabit } from '@/db/exercise';
import { isHabitDone } from '@/db/logs';
import { todayLocal, weekdayNameEs } from '@/date';
import { buildSteps, sectionDurationSec, totalDurationSec } from '@/exercise/steps';
import { AREA_STYLE, colors, fonts, radius, spacing } from '@/theme';
import type { Routine, RoutineId } from '@/types';
import { PawIcon } from '@/ui/PawIcon';
import { SkyHeader } from '@/ui/SkyHeader';
import { SpeechBubble } from '@/ui/SpeechBubble';

const FISICA = AREA_STYLE.fisica;
const STEP_BG = '#E8F5FC'; // círculo de número de sección (canvas)
const STEP_INK = '#1F5F87';

// Tira "Esta semana" de lunes a domingo (getDay: 0 = domingo).
const WEEK_STRIP: { weekday: number; letter: string }[] = [
  { weekday: 1, letter: 'L' },
  { weekday: 2, letter: 'M' },
  { weekday: 3, letter: 'X' },
  { weekday: 4, letter: 'J' },
  { weekday: 5, letter: 'V' },
  { weekday: 6, letter: 'S' },
  { weekday: 0, letter: 'D' },
];

export default function EjercicioScreen() {
  const cat = useCatMood();
  const purr = usePurr();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [doneToday, setDoneToday] = useState(false);
  const [weekRoutines, setWeekRoutines] = useState<(RoutineId | null)[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);

  const today = new Date();
  const todayWeekday = today.getDay();

  const reload = useCallback(() => {
    setRoutine(getRoutineForWeekday(new Date().getDay()));
    const habit = getWorkoutHabit();
    setDoneToday(habit != null && isHabitDone(habit.id, todayLocal()));
    setWeekRoutines(WEEK_STRIP.map(({ weekday }) => getRoutineForWeekday(weekday)?.id ?? null));
  }, []);

  useFocusEffect(reload);

  const catState: CatState =
    routine == null
      ? { screen: 'ejercicio', kind: 'sin-rutina' }
      : { screen: 'ejercicio', kind: doneToday ? 'hecho' : 'pendiente', routineName: routine.name };

  const handleCatPress = () => {
    purr();
    setMessageIndex((i) => i + 1);
    cat.trigger('mimado');
  };

  const startSession = () => {
    if (routine) router.push({ pathname: '/sesion/[routineId]', params: { routineId: routine.id } });
  };

  const totalMin = routine ? Math.round(totalDurationSec(buildSteps(routine)) / 60) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SkyHeader style={styles.header}>
        <Text style={styles.label}>
          {weekdayNameEs(today)}
          {routine ? ` · Rutina ${routine.id}` : ''}
        </Text>
        <Text style={styles.title}>Estírate como michi</Text>
        <View style={styles.catRow}>
          <SpeechBubble text={getCatMessage(catState, messageIndex)} style={styles.bubble} />
          <Cat pose="estirado" size={180} {...cat.props} onPress={handleCatPress} />
        </View>
      </SkyHeader>

      <View style={styles.card}>
        {routine == null ? (
          <Text style={styles.muted}>No hay rutina para hoy.</Text>
        ) : (
          <>
            <View style={styles.routineHeader}>
              <View style={styles.routineText}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.muted}>{routine.description}</Text>
              </View>
              <View style={styles.minutesPill}>
                <Text style={styles.minutesText}>{totalMin} min</Text>
              </View>
            </View>

            {doneToday && (
              <View style={styles.doneRow}>
                <View style={styles.doneBadge}>
                  <PawIcon size={14} color={colors.surface} />
                </View>
                <Text style={styles.doneText}>Hecho hoy</Text>
              </View>
            )}

            <View style={styles.sections}>
              {routine.sections.map((section, index) => (
                <View key={index} style={styles.sectionRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  <Text style={styles.sectionMeta}>
                    {Math.round(sectionDurationSec(section) / 60)} min
                    {section.rounds > 1 ? ` · ${section.rounds} rondas` : ''}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
              onPress={startSession}
              accessibilityRole="button"
            >
              <Ionicons name="play" size={20} color={colors.surface} />
              <Text style={styles.startText}>Empezar sesión</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.week}>
        <Text style={styles.weekTitle}>Esta semana</Text>
        <View style={styles.weekRow}>
          {WEEK_STRIP.map(({ weekday, letter }, i) => {
            const isToday = weekday === todayWeekday;
            const routineId = weekRoutines[i] ?? '—';
            return (
              <View
                key={weekday}
                style={[styles.dayCell, isToday && styles.dayCellToday]}
                accessible
                accessibilityLabel={`${letter}: rutina ${routineId}${isToday ? ', hoy' : ''}`}
              >
                <Text style={[styles.dayLetter, isToday && styles.onAccent]}>{letter}</Text>
                <Text style={[styles.dayRoutine, isToday && styles.onAccent]}>{routineId}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.lg, gap: 20 },
  header: { paddingBottom: 36 },
  label: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.skyInkSoft,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, color: colors.skyInk, marginTop: 2 },
  catRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  bubble: { flex: 1, marginBottom: 40 },
  card: {
    marginHorizontal: spacing.md,
    marginTop: -20 - 20, // sube 20 px sobre la cabecera (descontando el gap del contenido)
    padding: 18,
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  routineHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routineText: { flex: 1, gap: 2 },
  routineName: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  minutesPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: FISICA.soft,
  },
  minutesText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: FISICA.ink },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doneBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.accent },
  sections: { gap: spacing.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: STEP_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: STEP_INK },
  sectionName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  sectionMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  pressed: { opacity: 0.8 },
  startText: { fontFamily: fonts.display, fontSize: 19, color: colors.surface },
  week: { marginHorizontal: spacing.md, gap: spacing.sm },
  weekTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.text },
  weekRow: { flexDirection: 'row', gap: 6 },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  dayCellToday: { backgroundColor: colors.accent },
  dayLetter: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  dayRoutine: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.text },
  onAccent: { color: colors.surface },
});
