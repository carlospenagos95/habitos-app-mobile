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
}

export interface HabitLog {
  habitId: number;
  date: string; // "YYYY-MM-DD", hora local
} // clave primaria (habitId, date); existe fila = hecho
