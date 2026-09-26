# SPEC 03 — Rutina de ejercicio en casa de 1 hora

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-26
> **Objetivo:** Ofrecer cada día una rutina de ejercicio en casa de 60 minutos, sin equipo, que el usuario sigue en una sesión guiada con temporizador, imágenes, sonido y vibración, y que al terminarse marca como hecho el hábito vinculado del área Física.

---

## Por qué existe esta spec

SPEC 01 y SPEC 02 dejaron la rutina de ejercicio en casa (1 h/día) como SPEC 03. El usuario quiere seguirla desde el teléfono sin pensar qué hacer cada día.

Esta spec toca cuatro dominios (datos de rutinas, sesión guiada, assets de imagen y sonido, integración con hábitos). Se ofreció mover imágenes y sonido a una spec aparte. El usuario decidió mantener todo junto.

---

## Alcance

**Dentro:**

- 4 rutinas fijas de 60 minutos exactos, sin equipo, un solo nivel (principiante-intermedio).
- Rotación semanal: lunes y jueves rutina A, martes y viernes rutina B, miércoles y sábado rutina C, domingo rutina D (movilidad).
- Rutinas, secciones, ejercicios y calendario en tablas SQLite sembradas en la migración `v3`. No editables desde la app.
- Todos los bloques son por tiempo (trabajo N s + descanso M s), agrupados en secciones con rondas.
- Nueva sugerencia del plan `fisica-5` "Rutina de ejercicio en casa 1 hora" en el área Física.
- Nueva pestaña **Ejercicio** con la rutina de hoy y botón "Empezar".
- Atajo "Empezar" en Hoy, junto al hábito vinculado (`plan_item_id = 'fisica-5'`), si existe y está activo.
- Pantalla de sesión guiada: ejercicio actual, fase (Trabajo/Descanso), cuenta regresiva, imagen animada, instrucción corta, siguiente ejercicio, progreso, tiempo restante total, botones Pausar/Reanudar, Saltar y Salir.
- Imágenes de free-exercise-db (Unlicense) empaquetadas en `assets/exercises/`. Dos JPG por ejercicio alternando cada 800 ms.
- Instrucción de 1–2 frases en español por ejercicio.
- Sonido al inicio de cada fase (dos WAV generados por script) con `expo-audio`.
- Vibración al inicio de cada fase con `Vibration` de React Native.
- Pantalla encendida durante la sesión con `expo-keep-awake`.
- Pausa automática al pasar la app a segundo plano.
- Al terminar todos los pasos, marcar hecho hoy el hábito vinculado.
- Nuevo development build (EAS) por las dependencias nativas nuevas.

**Fuera de alcance (specs futuras):**

- Historial de sesiones (duración, completadas, parciales).
- Crear, editar o borrar rutinas o ejercicios desde la app.
- Varios niveles de dificultad o elección de rutina distinta a la del día.
- Ejercicios con equipo (mancuernas, bandas, silla, barra).
- Bloques por repeticiones.
- Reanudar una sesión tras cerrar la app.
- Temporizador corriendo en segundo plano o notificaciones durante la sesión.
- Sonidos personalizados, voz, música, cuenta regresiva 3-2-1 audible.
- Recordatorio específico de la sesión (se usa el recordatorio normal del hábito).
- Tema oscuro, check-in emocional, otras frecuencias, nube (siguen fuera).

---

## Modelo de datos

Migración `v3` en `src/db/client.ts`. `PRAGMA user_version` pasa de `2` a `3`. Se ejecuta solo si `user_version < 3`, dentro de una transacción. No borra ni modifica datos existentes.

```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,          -- = id de free-exercise-db, ej. "Pushups"
  name TEXT NOT NULL,           -- nombre en español
  instructions TEXT NOT NULL    -- 1–2 frases en español
);
CREATE TABLE routines (
  id TEXT PRIMARY KEY,          -- "A" | "B" | "C" | "D"
  name TEXT NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE routine_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id TEXT NOT NULL REFERENCES routines(id),
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,           -- "Calentamiento", "Circuito 1", ...
  rounds INTEGER NOT NULL,      -- >= 1
  round_rest_sec INTEGER NOT NULL  -- descanso extra entre rondas (no tras la última)
);
CREATE TABLE section_items (
  section_id INTEGER NOT NULL REFERENCES routine_sections(id),
  sort_order INTEGER NOT NULL,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  work_sec INTEGER NOT NULL,    -- > 0
  rest_sec INTEGER NOT NULL,    -- >= 0; 0 = sin fase de descanso
  PRIMARY KEY (section_id, sort_order)
);
CREATE TABLE routine_days (
  weekday INTEGER PRIMARY KEY,  -- 0 = domingo … 6 = sábado (Date.getDay())
  routine_id TEXT NOT NULL REFERENCES routines(id)
);
INSERT INTO plan_items (id, area_id, name, sort_order)
  VALUES ('fisica-5', 'fisica', 'Rutina de ejercicio en casa 1 hora', 4);
```

```ts
// src/types.ts (nuevos)
interface Exercise { id: string; name: string; instructions: string; }
interface RoutineItem { exerciseId: string; workSec: number; restSec: number; }
interface RoutineSection { name: string; rounds: number; roundRestSec: number; items: RoutineItem[]; }
interface Routine { id: 'A' | 'B' | 'C' | 'D'; name: string; description: string; sections: RoutineSection[]; }

// Paso plano de la sesión, generado por buildSteps(routine)
interface SessionStep {
  kind: 'work' | 'rest';
  durationSec: number;
  exerciseId: string | null;   // null en descanso entre rondas
  sectionName: string;
  round: number;               // 1-based
  totalRounds: number;
}
```

Expansión de una rutina a pasos (`src/exercise/steps.ts`, función pura `buildSteps`):

- Para cada sección, para cada ronda, para cada item: paso `work` (`work_sec`) y, si `rest_sec > 0`, paso `rest` (`rest_sec`) con el mismo `exerciseId`.
- Tras cada ronda salvo la última, si `round_rest_sec > 0`, un paso `rest` con `exerciseId = null`.
- Duración total = suma de `durationSec` = 3600 para las 4 rutinas.

Estructura de las rutinas (segundos):

| Rutina | Sección | Items | Trabajo / descanso | Rondas | Descanso entre rondas | Total |
| --- | --- | --- | --- | --- | --- | --- |
| A, B, C | Calentamiento | 8 | 45 / 15 | 1 | 0 | 480 |
| A, B, C | Circuito 1 | 6 | 40 / 20 | 4 | 60 | 1620 |
| A, B, C | Circuito 2 | 6 | 40 / 20 | 3 | 60 | 1200 |
| A, B, C | Enfriamiento | 5 | 60 / 0 | 1 | 0 | 300 |
| D | Calentamiento | 8 | 45 / 15 | 1 | 0 | 480 |
| D | Flujo de movilidad | 8 | 50 / 10 | 5 | 60 | 2640 |
| D | Estiramientos | 8 | 60 / 0 | 1 | 0 | 480 |

Rutinas:

- **A — Tren superior y core.**
- **B — Tren inferior y glúteo.**
- **C — Cuerpo completo y cardio.**
- **D — Movilidad y estiramiento (domingo).**

Contenido de cada sección (id free-exercise-db — nombre en español), en orden:

**Calentamiento (A, B, C, D):** `Arm_Circles` Círculos de brazos · `Shoulder_Circles` Círculos de hombros · `Standing_Hip_Circles` Círculos de cadera · `Knee_Circles` Círculos de rodillas · `Single_Leg_Butt_Kick` Talones a glúteo · `Star_Jump` Saltos de estrella · `Inchworm` Gusano · `Worlds_Greatest_Stretch` Estiramiento del mundo.

**A — Circuito 1:** `Pushups` Flexiones · `Superman` Superman · `Push-Up_Wide` Flexiones abiertas · `Plank` Plancha · `Push-Ups_-_Close_Triceps_Position` Flexiones cerradas de tríceps · `Spider_Crawl` Gateo araña.
**A — Circuito 2:** `Crunches` Abdominales · `Dead_Bug` Bicho muerto · `Side_Bridge` Plancha lateral · `Reverse_Crunch` Abdominal inverso · `Flutter_Kicks` Patadas alternas · `Cross-Body_Crunch` Abdominal cruzado.
**A — Enfriamiento:** `Childs_Pose` Postura del niño · `Cat_Stretch` Estiramiento del gato · `Shoulder_Stretch` Estiramiento de hombro · `Triceps_Stretch` Estiramiento de tríceps · `Upper_Back_Stretch` Estiramiento de espalda alta.

**B — Circuito 1:** `Bodyweight_Squat` Sentadilla · `Bodyweight_Walking_Lunge` Zancadas caminando · `Butt_Lift_Bridge` Puente de glúteo · `Split_Squats` Sentadilla dividida · `Glute_Kickback` Patada de glúteo · `Single_Leg_Glute_Bridge` Puente a una pierna.
**B — Circuito 2:** `Freehand_Jump_Squat` Sentadilla con salto · `Side_Leg_Raises` Elevación lateral de pierna · `Mountain_Climbers` Escaladores · `Flutter_Kicks` Patadas alternas · `Bent-Knee_Hip_Raise` Elevación de cadera con rodillas flexionadas · `Plank` Plancha.
**B — Enfriamiento:** `Hamstring_Stretch` Estiramiento de isquiotibiales · `On_Your_Side_Quad_Stretch` Estiramiento de cuádriceps de lado · `Kneeling_Hip_Flexor` Flexor de cadera de rodillas · `Calf_Stretch_Hands_Against_Wall` Estiramiento de pantorrilla en pared · `Childs_Pose` Postura del niño.

**C — Circuito 1:** `Star_Jump` Saltos de estrella · `Pushups` Flexiones · `Bodyweight_Squat` Sentadilla · `Mountain_Climbers` Escaladores · `Split_Jump` Zancada con salto · `Superman` Superman.
**C — Circuito 2:** `Knee_Tuck_Jump` Salto con rodillas al pecho · `Spider_Crawl` Gateo araña · `Fast_Skipping` Skipping rápido · `Russian_Twist` Giro ruso · `Scissors_Jump` Saltos de tijera · `Plank` Plancha.
**C — Enfriamiento:** `Hamstring_Stretch` Estiramiento de isquiotibiales · `Childs_Pose` Postura del niño · `Standing_Lateral_Stretch` Estiramiento lateral de pie · `Runners_Stretch` Estiramiento del corredor · `Cat_Stretch` Estiramiento del gato.

**D — Flujo de movilidad:** `Worlds_Greatest_Stretch` Estiramiento del mundo · `Cat_Stretch` Estiramiento del gato · `Inchworm` Gusano · `Hip_Circles_prone` Círculos de cadera en cuadrupedia · `Groiners` Aperturas de ingle · `Dynamic_Back_Stretch` Estiramiento dinámico de espalda · `Kneeling_Hip_Flexor` Flexor de cadera de rodillas · `Upward_Stretch` Estiramiento hacia arriba.
**D — Estiramientos:** `90_90_Hamstring` Isquiotibiales 90/90 · `Seated_Floor_Hamstring_Stretch` Isquiotibiales sentado · `Knee_Across_The_Body` Rodilla cruzada · `Hug_Knees_To_Chest` Rodillas al pecho · `Childs_Pose` Postura del niño · `Side_Lying_Groin_Stretch` Ingle de lado · `Chin_To_Chest_Stretch` Barbilla al pecho · `Side_Neck_Stretch` Cuello lateral.

Total: 57 ejercicios únicos. Los 57 ids existen en `dist/exercises.json` de free-exercise-db con 2 imágenes cada uno (verificado el 2026-09-26).

Assets:

- `assets/exercises/<exerciseId>/0.jpg` y `1.jpg`, copiados de `exercises/<id>/` del repo `yuhonas/free-exercise-db` (rama `main`).
- `src/exercise/images.ts`: mapa estático `EXERCISE_IMAGES: Record<string, [ImageSource, ImageSource]>` con `require(...)` (Metro no admite `require` dinámico). La base de datos no guarda rutas.
- `assets/sounds/trabajo.wav` (tono agudo, ~880 Hz, 300 ms) y `assets/sounds/descanso.wav` (tono grave, ~440 Hz, 300 ms), generados por `scripts/gen-beeps.mjs`.
- `scripts/fetch-exercise-images.mjs`: descarga las 114 imágenes y genera `src/exercise/images.ts`. Se ejecuta una vez; los archivos resultantes se commitean.

Convenciones:

- Rutina del día = `routine_days.weekday = new Date().getDay()` al abrir la pestaña o empezar la sesión.
- Hábito vinculado = hábito con `plan_item_id = 'fisica-5'` y `archived = 0`. Como máximo uno (lo garantiza SPEC 02: la sugerencia se oculta mientras exista).
- La fecha registrada al completar es la fecha local en que **empezó** la sesión, no la de fin.
- Marcar al completar usa `markHabitDone` (idempotente). Si ya estaba hecho, no cambia nada.
- Instrucciones en español redactadas por Claude al implementar, a partir de las instrucciones en inglés de free-exercise-db. `Side_Bridge` no tiene instrucciones en el origen; se redacta desde cero.

---

## Plan de implementación

1. Migración `v3` en `src/db/client.ts`: crear las 5 tablas, sembrar 57 ejercicios, 4 rutinas, secciones, items, 7 filas de `routine_days` y `plan_items` `fisica-5`. `user_version = 3`. Actualizar `src/types.ts`. Prueba: en instalación con datos de v2, hábitos y logs siguen y `user_version` es `3`.
2. Crear `src/db/exercise.ts`: `getRoutine(id)`, `getRoutineForWeekday(weekday)`, `getExercise(id)`, `getWorkoutHabit()`. Crear `src/exercise/steps.ts` con `buildSteps` y `totalDurationSec`. Prueba: log en consola de `totalDurationSec` = 3600 para A, B, C y D.
3. Añadir pestaña **Ejercicio** (`src/app/(tabs)/ejercicio.tsx`, icono `fitness-outline`) en `_layout.tsx`: nombre y descripción de la rutina de hoy, lista de secciones con duración, estado "Hecho hoy" si el hábito vinculado tiene log hoy, botón "Empezar". Prueba: la pestaña muestra la rutina que corresponde al día.
4. Crear `src/app/sesion/[routineId].tsx` con temporizador basado en timestamps: paso actual, fase, cuenta regresiva, nombre e instrucción, siguiente ejercicio, "Paso x de y", tiempo restante total, Pausar/Reanudar, Saltar (termina la fase actual), Salir (confirma y vuelve sin marcar). Sin imágenes ni sonido aún. Prueba: una sesión avanza sola de paso en paso.
5. Pausa automática con `AppState` al pasar a `background`/`inactive`; el usuario reanuda manualmente. `useKeepAwake` de `expo-keep-awake` en la pantalla de sesión. Prueba: pulsar Inicio y volver deja la sesión en pausa en el mismo segundo.
6. Al terminar el último paso: si existe hábito vinculado, `markHabitDone(habit.id, fechaInicio)` y pantalla "¡Rutina completada!" con "Registrado en Hoy". Si no existe: pantalla "¡Rutina completada!" con texto "Agrega el hábito 'Rutina de ejercicio en casa 1 hora' en Física para registrar tus sesiones" y botón que abre `area/fisica`. Prueba: con el hábito, aparece marcado en Hoy.
7. Atajo en Hoy (`src/app/(tabs)/index.tsx`): el hábito vinculado muestra un botón `play-circle-outline` en el color de Física que abre la sesión de la rutina de hoy. Tocar la fila sigue marcando/desmarcando. Prueba: el botón solo aparece en ese hábito.
8. Crear `scripts/fetch-exercise-images.mjs`, ejecutarlo, commitear `assets/exercises/` y `src/exercise/images.ts`. Mostrar en la sesión la imagen del ejercicio alternando `0.jpg`/`1.jpg` cada 800 ms; en descanso entre rondas, sin imagen y texto "Descanso". Prueba: los 57 ejercicios muestran imagen.
9. Crear `scripts/gen-beeps.mjs`, generar los 2 WAV. `npx expo install expo-audio expo-keep-awake` (keep-awake ya usado en paso 5; si no estaba instalado, instalarlo ahí). `src/exercise/cues.ts`: al iniciar fase `work` sonar `trabajo.wav` y `Vibration.vibrate(400)`; al iniciar fase `rest` sonar `descanso.wav` y `Vibration.vibrate([0, 150, 100, 150])`. Sin sonido ni vibración al pausar, reanudar o saltar manualmente. Verificar `android.permission.VIBRATE` en el manifiesto del build; añadirlo a `android.permissions` en `app.json` si falta.
10. Nuevo development build: `eas build --profile development --platform android`. Instalar y validar sonido, vibración y pantalla encendida en el APK.

---

## Criterios de aceptación

**Datos**

- [ ] `PRAGMA user_version` devuelve `3` tanto en instalación nueva como en una que venía de `2`.
- [ ] Tras actualizar desde `v2`, todos los hábitos, logs y vínculos `plan_item_id` previos siguen presentes.
- [ ] `exercises` tiene 57 filas; `routines` 4; `routine_days` 7.
- [ ] `routine_days` asigna A a lunes y jueves, B a martes y viernes, C a miércoles y sábado, D a domingo.
- [ ] `totalDurationSec(buildSteps(r))` devuelve `3600` para A, B, C y D.
- [ ] `plan_items` tiene 25 filas; Física tiene 5 sugerencias, las demás áreas 4.

**Pestaña Ejercicio y atajo**

- [ ] La pestaña Ejercicio aparece como cuarta pestaña con icono `fitness-outline`.
- [ ] La pestaña muestra la rutina correspondiente al día de la semana del dispositivo.
- [ ] Si el hábito vinculado tiene log hoy, la pestaña muestra "Hecho hoy".
- [ ] En Hoy, el hábito vinculado muestra el botón de empezar; ningún otro hábito lo muestra.
- [ ] Sin hábito vinculado activo, Hoy no muestra el botón y la pestaña Ejercicio sigue permitiendo empezar.

**Sesión guiada**

- [ ] La sesión avanza sola por todos los pasos en el orden definido por `buildSteps`.
- [ ] La cuenta regresiva y el tiempo restante total bajan de uno en uno por segundo.
- [ ] Pausar detiene la cuenta; Reanudar continúa desde el mismo segundo.
- [ ] Saltar termina la fase actual y pasa a la siguiente.
- [ ] Pasar la app a segundo plano pausa la sesión; al volver sigue en pausa.
- [ ] Salir pide confirmación y no marca el hábito.
- [ ] La pantalla no se apaga durante una sesión de al menos 5 minutos sin tocarla.
- [ ] Cada ejercicio muestra su imagen alternando dos fotos, su nombre y su instrucción en español.
- [ ] Al iniciar cada fase de trabajo suena `trabajo.wav` y el teléfono vibra; al iniciar cada descanso suena `descanso.wav` y vibra con el patrón doble.
- [ ] Llegar al final de la sesión (con o sin saltos) con hábito vinculado lo marca hecho en la fecha de inicio y aparece marcado en Hoy.
- [ ] Llegar al final sin hábito vinculado muestra el aviso y el botón que abre el área Física.
- [ ] Completar una sesión con el hábito ya marcado hoy no produce error ni lo desmarca.

**Build y general**

- [ ] `eas build --profile development --platform android` termina con éxito y el APK instalado reproduce sonido y vibra.
- [ ] La app funciona sin conexión a internet, incluidas las imágenes.
- [ ] `grep -rE "#[0-9A-Fa-f]{3,8}\b" src/app` no devuelve resultados.
- [ ] Todos los textos nuevos están en español.

---

## Decisiones

- **Sí:** una sola spec con datos, sesión, imágenes y sonido, por decisión explícita del usuario. Se ofreció mover imágenes y sonido a SPEC 04.
- **Sí:** rotación semanal fija A/B/C ×2 + D domingo. Variedad sin complejidad; ningún día queda sin rutina.
- **No:** domingo sin rutina. El hábito es diario (SPEC 01) y rompería la racha.
- **No:** rutinas editables. CRUD y UI de edición es otra spec.
- **Sí:** rutinas en tablas SQLite (migración `v3`), por decisión del usuario. Prepara edición futura.
- **No:** constantes TS para rutinas. Más simple, pero el usuario prefirió la base.
- **Sí:** sin equipo, un nivel principiante-intermedio. Se descartaron silla y banco para no depender de muebles.
- **Sí:** todos los bloques por tiempo. Garantiza 60 minutos exactos y la sesión avanza sola.
- **No:** bloques por repeticiones. Duración variable, requiere tocar "Hecho".
- **Sí:** sesión guiada con temporizador, entrada desde pestaña nueva y desde Hoy.
- **Sí:** hábito vinculado como sugerencia `fisica-5`, opt-in como el resto del plan (SPEC 02).
- **No:** crear el hábito solo al terminar la primera sesión. Crea hábitos sin pedirlo.
- **Sí:** marcar hecho solo al llegar al final; saltar pasos está permitido. Salir no marca. El usuario puede marcar a mano en Hoy.
- **No:** umbral de 80 % del tiempo. Requiere medir tiempo real y añade casos borde.
- **Sí:** fecha de log = fecha de inicio de la sesión. Evita que una sesión que cruza medianoche se registre al día siguiente.
- **Sí:** pausa al ir a segundo plano; cerrar la app pierde la sesión. Sin estado persistente.
- **No:** temporizador en segundo plano o reanudar tras cierre. Más estado y casos borde.
- **Sí:** temporizador por timestamps (`Date.now()`), no por conteo de `setInterval`. Evita deriva.
- **Sí:** imágenes de free-exercise-db (Unlicense, dominio público) empaquetadas. Offline y sin atribución obligatoria.
- **No:** imágenes remotas. Rompe el enfoque offline de SPEC 01.
- **Sí:** mapa `require` estático en `src/exercise/images.ts` generado por script. Metro no resuelve `require` dinámico.
- **Sí:** sonido con `expo-audio` y 2 beeps WAV generados por script. Sin licencias de audio que gestionar.
- **Sí:** vibración con `Vibration` de React Native. Sin módulo nativo nuevo.
- **Sí:** `expo-keep-awake` para mantener la pantalla encendida.
- **Sí:** instrucciones en español redactadas por Claude al implementar, basadas en las de free-exercise-db. Nombres en español fijados en esta spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| 114 JPG aumentan el tamaño del APK (~7 MB) | Aceptado. Si supera 10 MB, redimensionar a 480 px de ancho en `fetch-exercise-images.mjs`. |
| Migración `v3` falla a mitad | Transacción; `user_version = 3` solo al final. |
| `expo-audio` o `expo-keep-awake` no funcionan en el dev build anterior | Paso 10: nuevo build. Cambios de JS no requieren rebuild. |
| Modo silencio del teléfono impide el sonido | Aceptado. La vibración sigue funcionando como aviso. |
| Ejercicios de salto molestan a vecinos o son exigentes | Aceptado en esta spec. Variantes de bajo impacto en spec futura. |
| Imágenes de free-exercise-db no coinciden bien con el nombre en español | Revisar las 57 al implementar el paso 8; ajustar el nombre, no el id. |
| El repo de origen cambia o desaparece | Imágenes commiteadas en `assets/exercises/`; el script solo se usa una vez. |
| `setInterval` se ralentiza con la app en primer plano bajo carga | Cuenta calculada desde timestamps; el intervalo solo refresca la UI. |
| Sesión cruzando medianoche | Log con la fecha de inicio. |

---

## Qué **no** está en esta spec

- Historial de sesiones.
- Editar rutinas o ejercicios desde la app.
- Niveles de dificultad, ejercicios con equipo, bloques por repeticiones.
- Reanudar tras cerrar la app, temporizador o notificaciones en segundo plano.
- Voz, música, sonidos personalizados.
- Tema oscuro, check-in emocional, otras frecuencias, nube.

Cada uno, si llega, va en su propia spec.
