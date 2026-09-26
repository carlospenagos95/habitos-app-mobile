import { getDb } from './client';
import { todayLocal } from '../date';
import type { AreaId, Habit } from '../types';

type HabitRow = {
  id: number;
  area_id: string;
  name: string;
  reminder_time: string | null;
  notification_id: string | null;
  archived: number;
  created_at: string;
  plan_item_id: string | null;
};

function rowToHabit(row: HabitRow): Habit {
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

/** Crea un hábito en un área. Rechaza nombres vacíos o solo espacios. */
export function createHabit(areaId: AreaId, name: string): Habit {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('El nombre del hábito no puede estar vacío.');
  }

  const db = getDb();
  const createdAt = todayLocal();
  const result = db.runSync(
    'INSERT INTO habits (area_id, name, reminder_time, notification_id, archived, created_at) VALUES (?, ?, NULL, NULL, 0, ?)',
    [areaId, trimmedName, createdAt]
  );

  return {
    id: result.lastInsertRowId,
    areaId,
    name: trimmedName,
    reminderTime: null,
    notificationId: null,
    archived: false,
    createdAt,
    planItemId: null,
  };
}

/** Renombra un hábito existente. Rechaza nombres vacíos o solo espacios. */
export function renameHabit(id: number, name: string): void {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('El nombre del hábito no puede estar vacío.');
  }

  const db = getDb();
  db.runSync('UPDATE habits SET name = ? WHERE id = ?', [trimmedName, id]);
}

/** Guarda la hora de recordatorio y el id de notificación de un hábito. */
export function setHabitReminder(
  id: number,
  reminderTime: string | null,
  notificationId: string | null
): void {
  const db = getDb();
  db.runSync('UPDATE habits SET reminder_time = ?, notification_id = ? WHERE id = ?', [
    reminderTime,
    notificationId,
    id,
  ]);
}

/** Marca un hábito como archivado. No borra sus logs. */
export function archiveHabit(id: number): void {
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
