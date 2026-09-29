import { getDb } from './client';
import { todayLocal } from '../date';
import type { AreaId, Habit } from '../types';
import { isAreaId, isPositiveInt, isTimeHHMM, normalizeHabitName } from '../validation';

export type HabitRow = {
  id: number;
  area_id: string;
  name: string;
  reminder_time: string | null;
  notification_id: string | null;
  archived: number;
  created_at: string;
  plan_item_id: string | null;
};

export function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    areaId: row.area_id as AreaId,
    name: row.name,
    reminderTime: row.reminder_time,
    notificationId: row.notification_id,
    archived: row.archived === 1,
    createdAt: row.created_at,
    planItemId: row.plan_item_id,
  };
}

function assertHabitId(id: number): void {
  if (!isPositiveInt(id)) throw new Error('Id de hábito inválido.');
}

/** Crea un hábito en un área. Rechaza áreas inexistentes y nombres inválidos. */
export function createHabit(areaId: AreaId, name: string, planItemId: string | null = null): Habit {
  if (!isAreaId(areaId)) throw new Error('Área inválida.');
  const trimmedName = normalizeHabitName(name);

  const db = getDb();
  const createdAt = todayLocal();
  const result = db.runSync(
    'INSERT INTO habits (area_id, name, reminder_time, notification_id, archived, created_at, plan_item_id) VALUES (?, ?, NULL, NULL, 0, ?, ?)',
    [areaId, trimmedName, createdAt, planItemId]
  );

  return {
    id: result.lastInsertRowId,
    areaId,
    name: trimmedName,
    reminderTime: null,
    notificationId: null,
    archived: false,
    createdAt,
    planItemId,
  };
}

/** Renombra un hábito existente. Rechaza ids y nombres inválidos. */
export function renameHabit(id: number, name: string): void {
  assertHabitId(id);
  const trimmedName = normalizeHabitName(name);

  const db = getDb();
  db.runSync('UPDATE habits SET name = ? WHERE id = ?', [trimmedName, id]);
}

/** Guarda la hora de recordatorio y el id de notificación de un hábito. */
export function setHabitReminder(
  id: number,
  reminderTime: string | null,
  notificationId: string | null
): void {
  assertHabitId(id);
  if (reminderTime !== null && !isTimeHHMM(reminderTime)) {
    throw new Error('Hora de recordatorio inválida.');
  }
  const db = getDb();
  db.runSync('UPDATE habits SET reminder_time = ?, notification_id = ? WHERE id = ?', [
    reminderTime,
    notificationId,
    id,
  ]);
}

/** Marca un hábito como archivado. No borra sus logs. */
export function archiveHabit(id: number): void {
  assertHabitId(id);
  const db = getDb();
  db.runSync('UPDATE habits SET archived = 1 WHERE id = ?', [id]);
}

/** Lista los hábitos de un área. Por defecto excluye los archivados. */
export function listHabitsByArea(areaId: AreaId, includeArchived = false): Habit[] {
  const db = getDb();
  const rows = includeArchived
    ? db.getAllSync<HabitRow>('SELECT * FROM habits WHERE area_id = ? ORDER BY created_at, id', [
        areaId,
      ])
    : db.getAllSync<HabitRow>(
        'SELECT * FROM habits WHERE area_id = ? AND archived = 0 ORDER BY created_at, id',
        [areaId]
      );
  return rows.map(rowToHabit);
}
