import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cat } from '@/cat/Cat';
import { getCatMessage, type CatState } from '@/cat/messages';
import { usePurr } from '@/cat/purr';
import { useCatMood } from '@/cat/useCatAnimation';
import { getAreas } from '@/db/client';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForHabit } from '@/db/logs';
import { addDays, todayLocal } from '@/date';
import { computeAreaCompletion, computeStreak } from '@/streaks';
import { AREA_STYLE, colors, fonts, radius, spacing } from '@/theme';
import type { Area, Habit } from '@/types';
import { PawIcon } from '@/ui/PawIcon';
import { SkyHeader } from '@/ui/SkyHeader';

const TODAY = todayLocal();
// Ventana de las huellitas: de hace 6 días (izquierda) a hoy (derecha).
const WEEK = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6));
const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const PAW_OFF = '#EADFD2';

type HabitProgress = { habit: Habit; area: Area; streak: number; week: boolean[] };
type AreaProgress = { area: Area; percentage: number | null };

const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`);

function weekdayLetter(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return DAY_LETTERS[new Date(y, m - 1, d).getDay()];
}

/** Mayor racha actual; empate: el primero en orden de área y luego de creación. */
function pickBest(habits: HabitProgress[]): HabitProgress | null {
  let best: HabitProgress | null = null;
  for (const h of habits) {
    if (h.streak > 0 && (best == null || h.streak > best.streak)) best = h;
  }
  return best;
}

export default function ProgresoScreen() {
  const cat = useCatMood();
  const purr = usePurr();
  const [areasProgress, setAreasProgress] = useState<AreaProgress[]>([]);
  const [habitsProgress, setHabitsProgress] = useState<HabitProgress[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);

  const reload = useCallback(() => {
    const areaRows: AreaProgress[] = [];
    const habitRows: HabitProgress[] = [];
    for (const area of getAreas()) {
      const habits = listHabitsByArea(area.id);
      const doneDatesByHabit = new Map(habits.map((h) => [h.id, getLogsForHabit(h.id)]));
      areaRows.push({ area, percentage: computeAreaCompletion(habits, doneDatesByHabit, TODAY) });
      for (const habit of habits) {
        const dates = new Set(doneDatesByHabit.get(habit.id) ?? []);
        habitRows.push({
          habit,
          area,
          streak: computeStreak(dates, TODAY),
          week: WEEK.map((date) => dates.has(date)),
        });
      }
    }
    setAreasProgress(areaRows);
    setHabitsProgress(habitRows);
  }, []);

  useFocusEffect(reload);

  const best = pickBest(habitsProgress);
  const catState: CatState = best
    ? { screen: 'progreso', kind: 'con-racha', streak: best.streak, habitName: best.habit.name }
    : { screen: 'progreso', kind: 'sin-racha' };

  const handleCatPress = () => {
    purr();
    setMessageIndex((i) => i + 1);
    cat.trigger('mimado');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SkyHeader style={styles.header}>
        <Text style={styles.title}>Tu racha gatuna</Text>
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {getCatMessage(catState, messageIndex)}
        </Text>
      </SkyHeader>

      <View style={styles.bestCard}>
        <View style={styles.bestText}>
          <Text style={styles.bestLabel}>Mejor racha</Text>
          <Text style={styles.bestValue}>{dias(best?.streak ?? 0)}</Text>
          <Text style={styles.bestHabit} numberOfLines={2}>
            {best ? best.habit.name : 'Aún no hay rachas'}
          </Text>
        </View>
        <Cat pose="trofeo" size={100} {...cat.props} onPress={handleCatPress} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Por área <Text style={styles.cardTitleMuted}>· últimos 7 días</Text>
        </Text>
        {areasProgress.map(({ area, percentage }) => {
          const style = AREA_STYLE[area.id];
          return (
            <View
              key={area.id}
              style={styles.areaRow}
              accessible
              accessibilityLabel={`${area.name}: ${percentage === null ? 'sin hábitos' : `${percentage} %`}`}
            >
              <Text style={styles.areaName} numberOfLines={1}>
                {area.name}
              </Text>
              <View style={styles.barTrack}>
                {percentage !== null && (
                  <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: style.color }]} />
                )}
              </View>
              <Text style={styles.areaPercentage}>{percentage === null ? '—' : `${percentage}%`}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Huellitas de la semana</Text>
        {habitsProgress.length === 0 ? (
          <Text style={styles.empty}>Sin hábitos activos.</Text>
        ) : (
          <>
            <View style={styles.pawRow}>
              <View style={styles.pawName} />
              <View style={styles.paws}>
                {WEEK.map((date) => (
                  <Text key={date} style={[styles.dayLetter, date === TODAY && styles.dayLetterToday]}>
                    {weekdayLetter(date)}
                  </Text>
                ))}
              </View>
              <View style={styles.streakCol} />
            </View>
            {habitsProgress.map(({ habit, area, streak, week }) => {
              const style = AREA_STYLE[area.id];
              const doneCount = week.filter(Boolean).length;
              return (
                <View
                  key={habit.id}
                  style={styles.pawRow}
                  accessible
                  accessibilityLabel={`${habit.name}: ${doneCount} de 7 días, racha de ${dias(streak)}`}
                >
                  <Text style={styles.pawName} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <View style={styles.paws}>
                    {week.map((done, i) => (
                      <PawIcon key={i} size={PAW_SIZE} color={done ? style.color : PAW_OFF} />
                    ))}
                  </View>
                  <Text style={[styles.streakCol, styles.streak, { color: style.ink }]}>{streak} d</Text>
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const PAW_SIZE = 18;
const PAW_GAP = 3;

const cardShadow = {
  shadowColor: colors.text,
  shadowOpacity: 0.07,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.lg, gap: spacing.md },
  // Deja espacio para que la tarjeta morada suba sobre la cabecera.
  header: { paddingBottom: 72, gap: 6 },
  title: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, color: colors.skyInk },
  message: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.skyInkSoft },
  bestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: -72,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 150,
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  bestText: { flex: 1, gap: 2 },
  bestLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#E6D3F2',
  },
  bestValue: { fontFamily: fonts.displayBold, fontSize: 48, lineHeight: 52, color: colors.surface },
  bestHabit: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#F3E8FA' },
  card: {
    marginHorizontal: spacing.md,
    padding: 18,
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  cardTitleMuted: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaName: { width: 92, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  barTrack: { flex: 1, height: 12, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: radius.pill },
  areaPercentage: { width: 40, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  pawRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pawName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  paws: { flexDirection: 'row', gap: PAW_GAP },
  dayLetter: {
    width: PAW_SIZE,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  dayLetterToday: { fontFamily: fonts.bodyHeavy, color: colors.accent },
  streakCol: { width: 34 },
  streak: { textAlign: 'right', fontFamily: fonts.bodyHeavy, fontSize: 13 },
});
