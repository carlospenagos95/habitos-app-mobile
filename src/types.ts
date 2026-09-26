export type AreaId =
  | 'espiritual'
  | 'fisica'
  | 'intelectual'
  | 'familiar'
  | 'laboral'
  | 'emocional';

export interface Area {
  id: AreaId;
  name: string; // "Espiritual", "Física", ...
  sortOrder: number; // 0..5
}

export interface Habit {
  id: number; // autoincrement
  areaId: AreaId;
  name: string;
  reminderTime: string | null; // "HH:MM" 24 h, hora local; null = sin recordatorio
  notificationId: string | null; // id devuelto por expo-notifications
  archived: boolean;
  createdAt: string; // "YYYY-MM-DD"
  planItemId: string | null; // sugerencia del plan de la que salió; null = hábito manual
}

export interface PlanItem {
  id: string; // "<areaId>-<n>", ej. "espiritual-1"
  areaId: AreaId;
  name: string;
  sortOrder: number; // 0..3 dentro del área (0..4 en física desde v3)
}

export interface Exercise {
  id: string; // = id de free-exercise-db, ej. "Pushups"
  name: string; // nombre en español
  instructions: string; // 1–2 frases en español
}

export interface RoutineItem {
  exerciseId: string;
  workSec: number; // > 0
  restSec: number; // >= 0; 0 = sin fase de descanso
}

export interface RoutineSection {
  name: string; // "Calentamiento", "Circuito 1", ...
  rounds: number; // >= 1
  roundRestSec: number; // descanso extra entre rondas (no tras la última)
  items: RoutineItem[];
}

export type RoutineId = 'A' | 'B' | 'C' | 'D';

export interface Routine {
  id: RoutineId;
  name: string;
  description: string;
  sections: RoutineSection[];
}

/** Paso plano de la sesión, generado por buildSteps(routine). */
export interface SessionStep {
  kind: 'work' | 'rest';
  durationSec: number;
  exerciseId: string | null; // null en descanso entre rondas
  sectionName: string;
  round: number; // 1-based
  totalRounds: number;
}

export interface HabitLog {
  habitId: number;
  date: string; // "YYYY-MM-DD", hora local
} // clave primaria (habitId, date); existe fila = hecho
