import * as SQLite from 'expo-sqlite';
import type { Area } from '../types';

const DB_NAME = 'habitos.db';
const SCHEMA_VERSION = 1;

const SEED_AREAS: Area[] = [
  { id: 'espiritual', name: 'Espiritual', sortOrder: 0 },
  { id: 'fisica', name: 'Física', sortOrder: 1 },
  { id: 'intelectual', name: 'Intelectual', sortOrder: 2 },
  { id: 'familiar', name: 'Familiar', sortOrder: 3 },
  { id: 'laboral', name: 'Laboral', sortOrder: 4 },
  { id: 'emocional', name: 'Emocional', sortOrder: 5 },
];

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

    database.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
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
