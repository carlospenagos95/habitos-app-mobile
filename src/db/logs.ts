import { getDb } from './client';
import type { HabitLog } from '../types';

type HabitLogRow = {
  habit_id: number;
  date: string;
};

function rowToLog(row: HabitLogRow): HabitLog {
  return { habitId: row.habit_id, date: row.date };
}

/** ¿Está hecho el hábito en esa fecha? (existe fila = hecho) */
export function isHabitDone(habitId: number, date: string): boolean {
  const db = getDb();
  const row = db.getFirstSync<{ habit_id: number }>(
    'SELECT habit_id FROM habit_logs WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
  return row != null;
}

/** Marca un hábito como hecho en una fecha. No hace nada si ya estaba marcado. */
export function markHabitDone(habitId: number, date: string): void {
  const db = getDb();
  db.runSync('INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?, ?)', [habitId, date]);
}

/** Desmarca un hábito en una fecha. No hace nada si no estaba marcado. */
export function unmarkHabitDone(habitId: number, date: string): void {
  const db = getDb();
  db.runSync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [habitId, date]);
}

/** Alterna el estado de un hábito en una fecha. Devuelve el nuevo estado (true = hecho). */
export function toggleHabitDone(habitId: number, date: string): boolean {
  if (isHabitDone(habitId, date)) {
    unmarkHabitDone(habitId, date);
    return false;
  }
  markHabitDone(habitId, date);
  return true;
}

/** Todos los logs (de cualquier hábito) en una fecha exacta. */
export function getLogsForDate(date: string): HabitLog[] {
  const db = getDb();
  const rows = db.getAllSync<HabitLogRow>('SELECT * FROM habit_logs WHERE date = ?', [date]);
  return rows.map(rowToLog);
}

/** Todas las fechas ("YYYY-MM-DD") en que un hábito fue marcado como hecho. */
export function getLogsForHabit(habitId: number): string[] {
  const db = getDb();
  const rows = db.getAllSync<{ date: string }>(
    'SELECT date FROM habit_logs WHERE habit_id = ? ORDER BY date',
    [habitId]
  );
  return rows.map((r) => r.date);
}

/** Todos los logs (de cualquier hábito) en un rango de fechas [startDate, endDate], inclusive. */
export function getLogsInRange(startDate: string, endDate: string): HabitLog[] {
  const db = getDb();
  const rows = db.getAllSync<HabitLogRow>(
    'SELECT * FROM habit_logs WHERE date >= ? AND date <= ? ORDER BY date',
    [startDate, endDate]
  );
  return rows.map(rowToLog);
}
