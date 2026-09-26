# SPEC 01 — App Android base de hábitos por áreas de vida

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-09-20
> **Objetivo:** Una app Android (React Native + Expo) que permite crear hábitos diarios agrupados en 6 áreas de vida, marcarlos cada día, ver su progreso y recibir recordatorios locales, con todos los datos guardados solo en el teléfono.

---

## Por qué existe esta spec

La idea original incluye 6 áreas, plan de rutina personalizado, ejercicio en casa (1 h/día), control emocional y Android. Es demasiado para una sola spec. Esta spec entrega la **base funcional**; el contenido (plan de rutina, ejercicio) y el control psicológico se montan encima en specs posteriores.

---

## Alcance

**Dentro:**

- Proyecto Expo con TypeScript, ejecutable en Android (Expo Go en desarrollo).
- Las 6 áreas fijas: espiritual, física, intelectual, familiar, laboral, emocional.
- CRUD de hábitos dentro de un área (crear, renombrar, archivar).
- Hábitos siempre diarios. Cada hábito puede tener una hora de recordatorio opcional.
- Notificaciones locales diarias por hábito con recordatorio (Android, permiso `POST_NOTIFICATIONS`).
- Pantalla **Hoy**: checklist del día agrupado por área; marcar/desmarcar hecho.
- Pantalla **Áreas**: lista de las 6 áreas y gestión de sus hábitos.
- Pantalla **Progreso**: racha por hábito y porcentaje de cumplimiento por área en los últimos 7 días.
- Persistencia local con SQLite (`expo-sqlite`).
- UI y textos en español.

**Fuera de alcance (specs futuras):**

- Plan de rutina precargado con hábitos por área (SPEC 02).
- Rutina de ejercicio en casa de 1 hora al día (SPEC 03).
- Check-in emocional/psicológico por área (puntaje, notas) (spec aparte).
- Frecuencias distintas de diaria (días de semana, semanal).
- Nube, cuenta, login, sincronización, exportar/importar.
- iOS, tablet, internacionalización, tema oscuro.
- Generación de planes con IA.
- Publicación en Play Store.

---

## Modelo de datos

SQLite, archivo `habitos.db`. Versión del esquema en `PRAGMA user_version` (esta spec = `1`).

```ts
// src/types.ts
type AreaId =
  | 'espiritual' | 'fisica' | 'intelectual'
  | 'familiar' | 'laboral' | 'emocional';

interface Area {
  id: AreaId;
  name: string;      // "Espiritual", "Física", ...
  sortOrder: number; // 0..5
}

interface Habit {
  id: number;                    // autoincrement
  areaId: AreaId;
  name: string;
  reminderTime: string | null;   // "HH:MM" 24 h, hora local; null = sin recordatorio
  notificationId: string | null; // id devuelto por expo-notifications
  archived: boolean;
  createdAt: string;             // "YYYY-MM-DD"
}

interface HabitLog {
  habitId: number;
  date: string;                  // "YYYY-MM-DD", hora local
}                                // clave primaria (habitId, date); existe fila = hecho
```

```sql
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
```

Convenciones:

- Las 6 áreas se insertan en la migración `v1`; no son editables desde la app.
- Las fechas son siempre la fecha local del dispositivo en formato `YYYY-MM-DD`.
- Archivar no borra logs. Un hábito archivado no aparece en Hoy y no cuenta en Progreso.
- **Racha de un hábito:** días consecutivos con log terminando hoy; si hoy aún no está hecho, se cuenta desde ayer.
- **% de un área (7 días):** logs hechos ÷ (hábitos activos del área × días de la ventana en que el hábito ya existía), ventana = hoy y 6 días atrás. Área sin hábitos muestra `—`.

---

## Plan de implementación

1. Crear proyecto Expo (TypeScript) en la raíz con `expo-router`. Prueba: `npx expo start`, la app abre en Expo Go con una pantalla vacía.
2. Crear `src/types.ts` y `src/db/client.ts` (abre `habitos.db`, corre migración `v1` con `user_version`, siembra las 6 áreas). Prueba: al abrir la app, las 6 áreas existen (log en consola).
3. Crear `src/db/habits.ts`: crear, renombrar, archivar y listar hábitos por área. Prueba: crear un hábito desde un botón temporal y verlo tras recargar.
4. Crear `src/db/logs.ts`: marcar/desmarcar hábito en una fecha y consultar logs por fecha o rango. Prueba: marcar y ver persistir tras recargar.
5. Crear layout de tabs `app/(tabs)/_layout.tsx` con tres pestañas: Hoy, Áreas, Progreso (pantallas vacías con título).
6. Implementar `app/(tabs)/areas.tsx`: lista de 6 áreas; entrar a un área permite crear, renombrar y archivar hábitos. Prueba: crear hábitos en dos áreas distintas.
7. Implementar `app/(tabs)/index.tsx` (Hoy): checklist agrupado por área, tocar marca/desmarca. Áreas sin hábitos no se muestran; sin ningún hábito, mensaje que lleva a Áreas.
8. Crear `src/streaks.ts` (funciones puras de racha y % de 7 días) e implementar `app/(tabs)/progreso.tsx` con racha por hábito y % por área.
9. Crear `src/notifications.ts`: pedir permiso, programar/cancelar notificación diaria por hábito, guardar `notificationId`. Añadir selector de hora opcional en el formulario de hábito. Prueba: hábito con hora a +2 min dispara la notificación.
10. Cancelar la notificación al archivar o quitar la hora; reprogramar al cambiar la hora. Prueba: archivar y verificar que ya no llega.

---

## Criterios de aceptación

- [X] La app arranca en un dispositivo Android (Expo Go) sin errores en consola.
- [X] Existen exactamente 6 áreas: espiritual, física, intelectual, familiar, laboral, emocional, en ese orden.
- [X] Se puede crear un hábito en cualquier área con nombre no vacío; nombre vacío es rechazado.
- [X] Un hábito nuevo aparece en Hoy bajo su área.
- [X] Tocar un hábito en Hoy lo marca hecho; tocarlo otra vez lo desmarca.
- [X] Cerrar y reabrir la app conserva hábitos y marcas del día.
- [X] Archivar un hábito lo quita de Hoy y de Progreso, sin borrar sus logs de la base.
- [X] Un hábito hecho hoy y ayer muestra racha 2; si hoy no está hecho y ayer sí, la racha cuenta desde ayer.
- [X] El % de un área con 2 hábitos, ambos creados hace 7 días o más, y 7 logs en total, muestra 50 %.
- [X] Un área sin hábitos activos muestra `—` en Progreso.
- [X] Un hábito con hora de recordatorio dispara una notificación local a esa hora, todos los días.
- [X] Al archivar un hábito o quitarle la hora, deja de llegar su notificación.
- [X] Si el usuario niega el permiso de notificaciones, los hábitos se guardan igual y la app avisa que los recordatorios están desactivados.
- [X] Todos los textos visibles están en español.
- [X] `PRAGMA user_version` devuelve `1` tras la primera ejecución.

---

## Decisiones

- **Sí:** dividir en specs. Base ahora; plan de rutina (SPEC 02) y ejercicio en casa (SPEC 03) después. Una sola spec era inverificable.
- **Sí:** React Native + Expo. JS/TS, iteración rápida con Expo Go, APK vía EAS cuando toque.
- **No:** Flutter, Kotlin nativo, PWA. Toolchain más pesado o notificaciones/offline más limitados.
- **Sí:** TypeScript. Tipado ayuda con un modelo de datos que crecerá en specs posteriores.
- **Sí:** SQLite local (`expo-sqlite`). Datos personales y emocionales quedan en el dispositivo, sin backend ni cuenta.
- **No:** nube/login. Mucho más alcance y riesgo de privacidad.
- **Sí:** `PRAGMA user_version` para migraciones futuras sin perder datos.
- **Sí:** notificaciones locales en esta spec, por decisión explícita del usuario (se ofreció posponerlas).
- **Sí:** solo hábitos diarios. Otras frecuencias en spec futura.
- **Sí:** check-in psicológico fuera de esta spec. Se diseña aparte para no inflar la base.
- **Sí:** las 6 áreas fijas y no editables. Coinciden con el marco definido por el usuario.
- **Sí:** log = fila existente (sin fila = no hecho). Modelo simple, sin estados intermedios.
- **Sí:** el plan de rutina lo redacta Claude y se precarga (SPEC 02), editable por el usuario. Sin IA en tiempo de ejecución.
- **Sí:** UI en español, sin i18n.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Android 13+ exige permiso `POST_NOTIFICATIONS` en tiempo de ejecución | Pedirlo al guardar el primer recordatorio; si se niega, guardar el hábito y avisar. |
| Optimización de batería del fabricante retrasa o mata notificaciones | Usar notificaciones programadas del sistema (`expo-notifications`), no timers en la app. Documentar limitación. |
| Cambio de zona horaria u hora del sistema desfasa las fechas | Fechas siempre en hora local del dispositivo; recordatorios con trigger diario por hora local. |
| Esquema cambia en specs futuras | `user_version` y migraciones numeradas en `src/db/client.ts`. |
| Notificaciones de Expo Go limitadas en algunas versiones de SDK | Si fallan, validar con development build antes de dar por cumplido el criterio. |

---

## Qué **no** está en esta spec

- Plan de rutina precargado por área (SPEC 02).
- Rutina de ejercicio en casa de 1 hora diaria (SPEC 03).
- Check-in emocional o psicológico.
- Frecuencias no diarias.
- Nube, cuenta, exportar/importar.
- iOS, tema oscuro, otros idiomas.
- IA dentro de la app.
- Publicación en Play Store.

Cada uno, si llega, va en su propia spec.
