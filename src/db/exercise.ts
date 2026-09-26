import { getDb } from './client';
import { rowToHabit, type HabitRow } from './habits';
import type { Exercise, Habit, Routine, RoutineId, RoutineSection } from '../types';

/** Sugerencia del plan que vincula un hábito con la rutina de ejercicio. */
export const WORKOUT_PLAN_ITEM_ID = 'fisica-5';

type SectionRow = { id: number; name: string; rounds: number; round_rest_sec: number };
type ItemRow = { exercise_id: string; work_sec: number; rest_sec: number };

/** Rutina completa con sus secciones e items, o null si no existe. */
export function getRoutine(id: RoutineId): Routine | null {
  const db = getDb();
  const routine = db.getFirstSync<{ id: string; name: string; description: string }>(
    'SELECT id, name, description FROM routines WHERE id = ?',
    [id]
  );
  if (routine == null) return null;

  const sectionRows = db.getAllSync<SectionRow>(
    'SELECT id, name, rounds, round_rest_sec FROM routine_sections WHERE routine_id = ? ORDER BY sort_order',
    [id]
  );
  const sections: RoutineSection[] = sectionRows.map((s) => {
    const items = db.getAllSync<ItemRow>(
      'SELECT exercise_id, work_sec, rest_sec FROM section_items WHERE section_id = ? ORDER BY sort_order',
      [s.id]
    );
    return {
      name: s.name,
      rounds: s.rounds,
      roundRestSec: s.round_rest_sec,
      items: items.map((i) => ({ exerciseId: i.exercise_id, workSec: i.work_sec, restSec: i.rest_sec })),
    };
  });

  return { id: routine.id as RoutineId, name: routine.name, description: routine.description, sections };
}

/** Rutina asignada a un día de la semana (0 = domingo … 6 = sábado). */
export function getRoutineForWeekday(weekday: number): Routine | null {
  const row = getDb().getFirstSync<{ routine_id: string }>(
    'SELECT routine_id FROM routine_days WHERE weekday = ?',
    [weekday]
  );
  return row == null ? null : getRoutine(row.routine_id as RoutineId);
}

export function getExercise(id: string): Exercise | null {
  return getDb().getFirstSync<Exercise>('SELECT id, name, instructions FROM exercises WHERE id = ?', [id]);
}

/** Hábito activo vinculado a la rutina de ejercicio, o null si el usuario no lo agregó. */
export function getWorkoutHabit(): Habit | null {
  const row = getDb().getFirstSync<HabitRow>(
    'SELECT * FROM habits WHERE plan_item_id = ? AND archived = 0 LIMIT 1',
    [WORKOUT_PLAN_ITEM_ID]
  );
  return row == null ? null : rowToHabit(row);
}
