import * as SQLite from 'expo-sqlite';
import type { Area, AreaId } from '../types';

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

/** Abre (o reutiliza) la conexión a habitos.db y corre las migraciones pendientes. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    migrate(db);
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
}

/** Devuelve las 6 áreas fijas, ordenadas por sortOrder. */
export function getAreas(): Area[] {
  const database = getDb();
  const rows = database.getAllSync<{ id: string; name: string; sort_order: number }>(
    'SELECT id, name, sort_order FROM areas ORDER BY sort_order'
  );
  return rows.map((r) => ({ id: r.id as Area['id'], name: r.name, sortOrder: r.sort_order }));
}
