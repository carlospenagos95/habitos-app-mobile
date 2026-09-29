import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Cat } from '@/cat/Cat';
import { getCatMessage, type CatState } from '@/cat/messages';
import { usePurr } from '@/cat/purr';
import { useCatMood } from '@/cat/useCatAnimation';
import { getAreas } from '@/db/client';
import { listHabitsByArea } from '@/db/habits';
import { getLogsForDate } from '@/db/logs';
import { todayLocal } from '@/date';
import { AREA_STYLE, colors, fonts, radius, spacing } from '@/theme';
import type { Area } from '@/types';
import { SkyHeader } from '@/ui/SkyHeader';

const FOCUS_BG = '#FFF4E2'; // fondo cálido del área foco (canvas)

type AreaCount = { area: Area; active: number; done: number };

/**
 * Área foco: entre las que tienen algún hábito activo pendiente hoy, la de menor
 * proporción hechos / activos. Empate: la primera en el orden de getAreas().
 */
function pickFocus(counts: AreaCount[]): AreaCount | null {
  let focus: AreaCount | null = null;
  for (const c of counts) {
    if (c.active === 0 || c.done >= c.active) continue;
    if (focus == null || c.done / c.active < focus.done / focus.active) focus = c;
  }
  return focus;
}

function areasState(counts: AreaCount[], focus: AreaCount | null): CatState {
  if (focus) {
    return { screen: 'areas', kind: 'foco', areaName: focus.area.name, pending: focus.active - focus.done };
  }
  const anyActive = counts.some((c) => c.active > 0);
  return { screen: 'areas', kind: anyActive ? 'todo-hecho' : 'sin-habitos' };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Orejitas redondeadas sobre la tarjeta, del color del área.
function CardEars({ color }: { color: string }) {
  return (
    <Svg viewBox="0 0 120 20" width={120} height={20} style={styles.ears} pointerEvents="none">
      <Path
        d="M4 20 C8 12 11 4 15 2.5 C18 1.5 22 8 28 20 Z M92 20 C98 8 102 1.5 105 2.5 C109 4 112 12 116 20 Z"
        fill={color}
      />
    </Svg>
  );
}

export default function AreasScreen() {
  const router = useRouter();
  const cat = useCatMood();
  const purr = usePurr();
  const [counts, setCounts] = useState<AreaCount[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);

  const reload = useCallback(() => {
    const doneToday = new Set(getLogsForDate(todayLocal()).map((log) => log.habitId));
    setCounts(
      getAreas().map((area) => {
        const habits = listHabitsByArea(area.id);
        return { area, active: habits.length, done: habits.filter((h) => doneToday.has(h.id)).length };
      })
    );
  }, []);

  // Los conteos cambian al marcar hábitos en Hoy o editarlos en el detalle.
  useFocusEffect(reload);

  const focus = pickFocus(counts);

  const handleCatPress = () => {
    purr();
    setMessageIndex((i) => i + 1);
    cat.trigger('mimado');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SkyHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tus 6 rincones</Text>
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {getCatMessage(areasState(counts, focus), messageIndex)}
            </Text>
          </View>
          <Cat pose="asomado" size={130} {...cat.props} onPress={handleCatPress} style={styles.cat} />
        </View>
      </SkyHeader>

      <View style={styles.grid}>
        {counts.map((c) => {
          const style = AREA_STYLE[c.area.id];
          const isFocus = focus?.area.id === c.area.id;
          const pending = c.active - c.done;
          const summary = isFocus
            ? pending === 1
              ? 'Te falta 1 hoy'
              : `Te faltan ${pending} hoy`
            : `${plural(c.active, 'hábito', 'hábitos')} · ${plural(c.done, 'hecho', 'hechos')}`;
          return (
            <Pressable
              key={c.area.id}
              style={({ pressed }) => [
                styles.card,
                isFocus && { backgroundColor: FOCUS_BG, borderColor: style.color },
                pressed && styles.pressed,
              ]}
              onPress={() => router.push({ pathname: '/area/[id]', params: { id: c.area.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${c.area.name}, ${summary}`}
            >
              <CardEars color={style.color} />
              <View style={[styles.iconBox, { backgroundColor: style.soft }]}>
                <Ionicons name={style.icon} size={24} color={isFocus ? style.ink : style.color} />
              </View>
              <Text style={styles.cardName}>{c.area.name}</Text>
              <Text style={[styles.cardSummary, isFocus && { fontFamily: fonts.bodyHeavy, color: style.ink }]}>
                {summary}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const CARD_BORDER = 2;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.lg },
  // Sin padding inferior: el gato asomado se apoya en el borde de la cabecera.
  header: { paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end' },
  headerText: { flex: 1, gap: 6, paddingBottom: spacing.lg },
  title: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, color: colors.skyInk },
  message: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.skyInkSoft },
  cat: { marginRight: -8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 30,
    paddingHorizontal: spacing.md,
    paddingTop: 30,
  },
  card: {
    width: '48.3%',
    minHeight: 150,
    gap: 10,
    padding: spacing.md - CARD_BORDER,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: CARD_BORDER,
    borderColor: 'transparent',
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  pressed: { opacity: 0.75 },
  ears: { position: 'absolute', left: 24, top: -14 - CARD_BORDER },
  iconBox: { width: 42, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  cardSummary: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },
});
