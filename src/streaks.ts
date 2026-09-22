import { addDays } from './date';

/**
 * Racha de un hábito: días consecutivos con log terminando hoy.
 * Si hoy aún no está hecho, se cuenta desde ayer (no resetea a 0 por eso).
 */
export function computeStreak(doneDates: Iterable<string>, today: string): number {
  const dates = doneDates instanceof Set ? doneDates : new Set(doneDates);

  let streak = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export interface HabitForCompletion {
  id: number;
  createdAt: string; // "YYYY-MM-DD"
}

/**
 * % de cumplimiento de un área en una ventana de días (por defecto 7: hoy y 6 días atrás).
 * = logs hechos ÷ (hábitos activos del área × días de la ventana en que el hábito ya existía).
 * Un área sin hábitos activos devuelve null (se muestra "—").
 */
export function computeAreaCompletion(
  habits: HabitForCompletion[],
  doneDatesByHabit: Map<number, Iterable<string>>,
  today: string,
  windowDays = 7
): number | null {
  if (habits.length === 0) {
    return null;
  }

  const windowDates: string[] = [];
  for (let i = windowDays - 1; i >= 0; i -= 1) {
    windowDates.push(addDays(today, -i));
  }

  let possible = 0;
  let done = 0;

  for (const habit of habits) {
    const doneSet = new Set(doneDatesByHabit.get(habit.id) ?? []);
    for (const date of windowDates) {
      if (date < habit.createdAt) {
        continue; // el hábito todavía no existía ese día
      }
      possible += 1;
      if (doneSet.has(date)) {
        done += 1;
      }
    }
  }

  if (possible === 0) {
    return null;
  }

  return Math.round((done / possible) * 100);
}
