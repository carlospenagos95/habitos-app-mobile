import { getDb } from './client';
import { createHabit } from './habits';
import type { AreaId, Habit, PlanItem } from '../types';

type PlanItemRow = {
  id: string;
  area_id: string;
  name: string;
  sort_order: number;
};

function rowToPlanItem(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    areaId: row.area_id as AreaId,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

/** Sugerencias visibles de un área: las que no tienen un hábito activo vinculado. */
export function listSuggestions(areaId: AreaId): PlanItem[] {
  const db = getDb();
  const rows = db.getAllSync<PlanItemRow>(
    `SELECT p.id, p.area_id, p.name, p.sort_order
     FROM plan_items p
     WHERE p.area_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM habits h WHERE h.plan_item_id = p.id AND h.archived = 0
       )
     ORDER BY p.sort_order`,
    [areaId]
  );
  return rows.map(rowToPlanItem);
}

/** Crea un hábito sin recordatorio a partir de una sugerencia del plan. */
export function addHabitFromPlan(planItemId: string): Habit {
  const db = getDb();
  const row = db.getFirstSync<PlanItemRow>(
    'SELECT id, area_id, name, sort_order FROM plan_items WHERE id = ?',
    [planItemId]
  );
  if (row == null) {
    throw new Error('La sugerencia no existe.');
  }
  const item = rowToPlanItem(row);
  return createHabit(item.areaId, item.name, item.id);
}
