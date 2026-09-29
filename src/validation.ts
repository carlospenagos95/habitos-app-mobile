// Validadores de dominio (SPEC 06). Puro: sin React ni DB, como date.ts.
import { SEED_ROUTINES } from './db/seedExercise';
import type { AreaId, RoutineId } from './types';

export const HABIT_NAME_MAX_LENGTH = 120;

export const AREA_IDS: readonly AreaId[] =
  ['espiritual', 'fisica', 'intelectual', 'familiar', 'laboral', 'emocional'];
export const ROUTINE_IDS: readonly RoutineId[] = SEED_ROUTINES.map((r) => r.id as RoutineId);

const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;
// Control C0/C1 y marcas de dirección bidi.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const BIDI_CHARS = /[‎‏‪-‮⁦-⁩]/g;

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && (AREA_IDS as readonly string[]).includes(value);
}

export function isRoutineId(value: unknown): value is RoutineId {
  return typeof value === 'string' && (ROUTINE_IDS as readonly string[]).includes(value);
}

export function isTimeHHMM(value: unknown): value is string {
  return typeof value === 'string' && TIME_HHMM.test(value);
}

/** "YYYY-MM-DD" que además es una fecha real del calendario. */
export function isDateYMD(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_YMD.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

export function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Quita control y bidi, colapsa espacios, recorta. Lanza Error si queda vacío o > 120. */
export function normalizeHabitName(name: string): string {
  const clean = String(name)
    .replace(CONTROL_CHARS, '')
    .replace(BIDI_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) throw new Error('El nombre del hábito no puede estar vacío.');
  if (clean.length > HABIT_NAME_MAX_LENGTH) {
    throw new Error(`El nombre del hábito no puede superar ${HABIT_NAME_MAX_LENGTH} caracteres.`);
  }
  return clean;
}
