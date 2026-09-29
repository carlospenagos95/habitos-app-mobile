import * as SQLite from 'expo-sqlite';
import type { Area, AreaId } from '../types';
import { SEED_EXERCISES, SEED_ROUTINE_DAYS, SEED_ROUTINES } from './seedExercise';

const DB_NAME = 'habitos.db';

const SEED_AREAS: Area[] = [
  { id: 'espiritual', name: 'Espiritual', sortOrder: 0 },
  { id: 'fisica', name: 'Física', sortOrder: 1 },
  { id: 'intelectual', name: 'Intelectual', sortOrder: 2 },
  { id: 'familiar', name: 'Familiar', sortOrder: 3 },
  { id: 'laboral', name: 'Laboral', sortOrder: 4 },
  { id: 'emocional', name: 'Emocional', sortOrder: 5 },
];

// Catálogo del plan de rutina (migración v2). id = "<areaId>-<n>", n = sort_order + 1.
const SEED_PLAN: Record<AreaId, string[]> = {
  espiritual: [
    'Meditar 10 minutos',
    'Leer un texto espiritual 10 minutos',
    'Escribir 3 cosas por las que agradezco',
    '5 minutos de silencio antes de dormir',
  ],
  fisica: [
    'Caminar 30 minutos',
    'Tomar 2 litros de agua',
    'Dormir 7 horas o más',
    'Estirar 10 minutos',
  ],
  intelectual: [
    'Leer 20 páginas',
    'Estudiar un tema nuevo 30 minutos',
    'Escuchar un podcast educativo',
    'Escribir un resumen de lo aprendido',
  ],
  familiar: [
    'Comer sin pantallas con la familia',
    'Llamar o escribir a un familiar',
    '15 minutos de conversación sin celular',
    'Planear una actividad familiar semanal',
  ],
  laboral: [
    'Definir las 3 prioridades del día',
    'Trabajar 90 minutos sin distracciones',
    'Revisar pendientes al cerrar el día',
    'Aprender algo de mi oficio 15 minutos',
  ],
  emocional: [
    'Registrar cómo me siento hoy',
    'Respirar profundo 5 minutos',
    'Hacer algo que disfruto 20 minutos',
    'Revisar el día sin juzgarme',
  ],
};

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Abre (o reutiliza) la conexión a habitos.db y corre las migraciones pendientes.
 * `foreign_keys` es por conexión; se activa después de migrar (SPEC 06).
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    migrate(db);
    db.execSync('PRAGMA foreign_keys = ON');
  }
  return db;
}

function migrate(database: SQLite.SQLiteDatabase): void {
  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    database.execSync(`
      CREATE TABLE areas (id TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER NOT NULL);
      CREATE TABLE habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_id TEXT NOT NULL REFERENCES areas(id),
        name TEXT NOT NULL,
        reminder_time TEXT,
        notification_id TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE habit_logs (
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        date TEXT NOT NULL,
        PRIMARY KEY (habit_id, date)
      );
    `);

    const insertArea = database.prepareSync(
      'INSERT INTO areas (id, name, sort_order) VALUES ($id, $name, $sortOrder)'
    );
    try {
      for (const area of SEED_AREAS) {
        insertArea.executeSync({ $id: area.id, $name: area.name, $sortOrder: area.sortOrder });
      }
    } finally {
      insertArea.finalizeSync();
    }

    database.execSync('PRAGMA user_version = 1');
  }

  if (currentVersion < 2) {
    // En una transacción: si algo falla, la base queda en v1 y se reintenta en el próximo arranque.
    database.withTransactionSync(() => {
      database.execSync(`
        CREATE TABLE plan_items (
          id TEXT PRIMARY KEY,
          area_id TEXT NOT NULL REFERENCES areas(id),
          name TEXT NOT NULL,
          sort_order INTEGER NOT NULL
        );
        ALTER TABLE habits ADD COLUMN plan_item_id TEXT REFERENCES plan_items(id);
      `);

      const insertPlanItem = database.prepareSync(
        'INSERT INTO plan_items (id, area_id, name, sort_order) VALUES ($id, $areaId, $name, $sortOrder)'
      );
      try {
        for (const [areaId, names] of Object.entries(SEED_PLAN)) {
          names.forEach((name, sortOrder) => {
            insertPlanItem.executeSync({
              $id: `${areaId}-${sortOrder + 1}`,
              $areaId: areaId,
              $name: name,
              $sortOrder: sortOrder,
            });
          });
        }
      } finally {
        insertPlanItem.finalizeSync();
      }

      database.execSync('PRAGMA user_version = 2');
    });
  }

  if (currentVersion < 3) {
    database.withTransactionSync(() => {
      database.execSync(`
        CREATE TABLE exercises (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          instructions TEXT NOT NULL
        );
        CREATE TABLE routines (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL
        );
        CREATE TABLE routine_sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id TEXT NOT NULL REFERENCES routines(id),
          sort_order INTEGER NOT NULL,
          name TEXT NOT NULL,
          rounds INTEGER NOT NULL,
          round_rest_sec INTEGER NOT NULL
        );
        CREATE TABLE section_items (
          section_id INTEGER NOT NULL REFERENCES routine_sections(id),
          sort_order INTEGER NOT NULL,
          exercise_id TEXT NOT NULL REFERENCES exercises(id),
          work_sec INTEGER NOT NULL,
          rest_sec INTEGER NOT NULL,
          PRIMARY KEY (section_id, sort_order)
        );
        CREATE TABLE routine_days (
          weekday INTEGER PRIMARY KEY,
          routine_id TEXT NOT NULL REFERENCES routines(id)
        );
        INSERT INTO plan_items (id, area_id, name, sort_order)
          VALUES ('fisica-5', 'fisica', 'Rutina de ejercicio en casa 1 hora', 4);
      `);

      for (const e of SEED_EXERCISES) {
        database.runSync('INSERT INTO exercises (id, name, instructions) VALUES (?, ?, ?)', [
          e.id,
          e.name,
          e.instructions,
        ]);
      }

      for (const routine of SEED_ROUTINES) {
        database.runSync('INSERT INTO routines (id, name, description) VALUES (?, ?, ?)', [
          routine.id,
          routine.name,
          routine.description,
        ]);
        routine.sections.forEach((section, sectionOrder) => {
          const { lastInsertRowId: sectionId } = database.runSync(
            'INSERT INTO routine_sections (routine_id, sort_order, name, rounds, round_rest_sec) VALUES (?, ?, ?, ?, ?)',
            [routine.id, sectionOrder, section.name, section.rounds, section.roundRestSec]
          );
          section.exerciseIds.forEach((exerciseId, itemOrder) => {
            database.runSync(
              'INSERT INTO section_items (section_id, sort_order, exercise_id, work_sec, rest_sec) VALUES (?, ?, ?, ?, ?)',
              [sectionId, itemOrder, exerciseId, section.workSec, section.restSec]
            );
          });
        });
      }

      for (const [weekday, routineId] of SEED_ROUTINE_DAYS) {
        database.runSync('INSERT INTO routine_days (weekday, routine_id) VALUES (?, ?)', [weekday, routineId]);
      }

      database.execSync('PRAGMA user_version = 3');
    });
  }
}

/** Devuelve las 6 áreas fijas, ordenadas por sortOrder. */
export function getAreas(): Area[] {
  const database = getDb();
  const rows = database.getAllSync<{ id: string; name: string; sort_order: number }>(
    'SELECT id, name, sort_order FROM areas ORDER BY sort_order'
  );
  return rows.map((r) => ({ id: r.id as Area['id'], name: r.name, sortOrder: r.sort_order }));
}
