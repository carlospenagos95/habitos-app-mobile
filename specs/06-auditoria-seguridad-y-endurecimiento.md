# SPEC 06 — Auditoría de seguridad y endurecimiento de la app

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 03, SPEC 04
> **Fecha:** 2026-09-28
> **Objetivo:** Auditar el código y corregir las vulnerabilidades encontradas para que ninguna entrada del usuario ni ningún deep link pueda escribir datos inválidos o sacar datos del teléfono, entregado en un nuevo APK `preview`.

---

## Por qué existe esta spec

La app es 100 % local: sin servidor, sin cuentas, sin red en tiempo de ejecución. La superficie de ataque es pequeña pero no nula.

Entradas que llegan a la app desde fuera del flujo normal:

- Texto libre del usuario (nombre de hábito al crear y renombrar).
- Deep links del esquema `buenoshabitos://`. Cualquier app o página web del teléfono puede abrir `buenoshabitos://area/<cualquier-cosa>` o `buenoshabitos://sesion/<cualquier-cosa>`.
- Backups de Android (Google o `adb backup`) que copian `habitos.db` fuera del teléfono.
- Dependencias npm de terceros.

La auditoría inicial (2026-09-28) encontró lo siguiente.

### Hallazgos de la auditoría

| # | Hallazgo | Ubicación | Severidad |
| - | -------- | --------- | --------- |
| H1 | Deep link `buenoshabitos://area/<x>` abre la pantalla con `areaId` sin validar. Permite crear hábitos con un área inexistente. | `src/app/area/[id].tsx` | Media |
| H2 | SQLite no aplica llaves foráneas (`PRAGMA foreign_keys` apagado por defecto). Filas huérfanas posibles en `habits` y `habit_logs`. | `src/db/client.ts` | Media |
| H3 | `android.allowBackup` activo por defecto. `habitos.db` sale del teléfono en backups. Contradice "datos solo en el teléfono". | `app.json` | Media |
| H4 | `TextInput` sin `maxLength`. Nombres de tamaño arbitrario en DB, UI y cuerpo de notificación. | `src/app/area/[id].tsx` | Baja |
| H5 | La capa `src/db/` no valida formatos: `reminderTime` "HH:MM", fechas "YYYY-MM-DD", `areaId`. Confía en la UI. | `src/db/habits.ts`, `src/db/logs.ts`, `src/notifications.ts` | Baja |
| H6 | Nombres aceptan caracteres de control y de dirección bidi (U+202A–U+202E, U+2066–U+2069). Permiten texto engañoso en UI y notificación. | `src/db/habits.ts` | Baja |
| H7 | Deep link `buenoshabitos://sesion/<x>` castea `routineId` sin validar. Ya muestra "Rutina no encontrada", pero consulta la DB con un valor arbitrario. | `src/app/sesion/[routineId].tsx` | Baja |
| H8 | `npm audit`: 15 vulnerabilidades moderadas, todas transitivas (`uuid`, `query-string`, `decode-uri-component`, `xcode`, `@expo/*`). Mayoría solo en build. | `package-lock.json` | Baja |
| H9 | Dependencias sin uso: `expo-web-browser`, `expo-device`. Superficie innecesaria. | `package.json` | Informativa |
| H10 | `.claude/settings.local.json` versionado en git, con permisos de otros proyectos. | Repo | Informativa |

### Verificado sin hallazgos

- **Inyección SQL:** todas las consultas usan parámetros (`?` o `$nombre`). Ninguna concatena entradas en SQL.
- **Red en tiempo de ejecución:** la app no hace `fetch`. Solo `scripts/fetch-exercise-images.mjs` descarga, en el PC del desarrollador, una sola vez.
- **Notificaciones:** no hay listener de respuesta (`addNotificationResponseReceivedListener`). Tocar una notificación solo abre la app.
- **Secretos:** no hay llaves ni tokens en el repo. `extra.eas.projectId` es público por diseño.
- **Permisos Android:** solo `VIBRATE` más los que agrega `expo-notifications`.

---

## Alcance

**Dentro:**

- Nuevo módulo puro `src/validation.ts` con validadores y normalización de nombres.
- Validación en la capa de datos (`src/db/habits.ts`, `src/db/logs.ts`) y en `src/notifications.ts`. La DB rechaza datos inválidos aunque la UI falle.
- `PRAGMA foreign_keys = ON` en cada apertura de la conexión.
- `maxLength={120}` en los dos `TextInput` de nombre de hábito.
- Validación de parámetros de ruta en `area/[id].tsx` y `sesion/[routineId].tsx`. Parámetro inválido → pantalla "no encontrado" sin formularios ni escritura.
- `android.allowBackup: false` en `app.json`.
- Desinstalar `expo-web-browser` y `expo-device`.
- Actualizar dependencias a los parches más recientes de SDK 57 (`npx expo install --fix`). Documentar lo que quede de `npm audit`.
- Sacar `.claude/settings.local.json` de git y agregarlo a `.gitignore`.
- `SECURITY.md` en la raíz: modelo de amenazas, hallazgos, correcciones y riesgos aceptados.
- Sección "Seguridad" corta en `README.md` que enlaza a `SECURITY.md`.
- Nuevo build `eas build --profile preview --platform android` y pruebas de deep links con `adb`.

**Fuera de alcance (para futuras specs):**

- Cifrado de `habitos.db` (SQLCipher). Datos no sensibles y app sin cuentas.
- Bloqueo de la app con PIN o biometría.
- Migración v4 con `CHECK` constraints o limpieza de filas huérfanas. La UI normal no las genera.
- Exportar o respaldar datos manualmente (compensaría `allowBackup: false`).
- Framework de tests (Jest) y tests automatizados.
- Eliminar el esquema `buenoshabitos://` o bloquear todos los deep links entrantes.
- `overrides` forzados en `package.json` o `npm audit fix --force`.
- Subir de SDK de Expo.
- Análisis estático automatizado (ESLint security, Semgrep) o CI.
- Target web (`web.output: static`). La app se usa solo en Android.
- Ofuscación del bundle JS o detección de root.

---

## Modelo de datos

Esta feature no cambia el esquema SQLite ni `PRAGMA user_version`. Sigue en v3.

Nuevo módulo `src/validation.ts` (dominio puro, sin React ni DB, como `date.ts`):

```ts
export const HABIT_NAME_MAX_LENGTH = 120;

export const AREA_IDS: readonly AreaId[] =
  ['espiritual', 'fisica', 'intelectual', 'familiar', 'laboral', 'emocional'];
export const ROUTINE_IDS: readonly RoutineId[] = [/* ids de SEED_ROUTINES */];

export function isAreaId(value: unknown): value is AreaId;
export function isRoutineId(value: unknown): value is RoutineId;
export function isTimeHHMM(value: unknown): value is string;   // /^([01]\d|2[0-3]):[0-5]\d$/
export function isDateYMD(value: unknown): value is string;    // /^\d{4}-\d{2}-\d{2}$/ + fecha real
export function isPositiveInt(value: unknown): value is number;

/** Quita control y bidi, colapsa espacios, recorta. Lanza Error si queda vacío o > 120. */
export function normalizeHabitName(name: string): string;
```

Reglas de `normalizeHabitName`:

1. Eliminar caracteres de control U+0000–U+001F y U+007F–U+009F.
2. Eliminar marcas de dirección bidi U+200E, U+200F, U+202A–U+202E, U+2066–U+2069.
3. Colapsar secuencias de espacios en un solo espacio y recortar extremos.
4. Vacío → `Error('El nombre del hábito no puede estar vacío.')` (mensaje actual).
5. Más de 120 caracteres → `Error('El nombre del hábito no puede superar 120 caracteres.')`.

Dónde se aplica cada validador:

| Función | Validación | Si falla |
| ------- | ---------- | -------- |
| `createHabit` | `isAreaId(areaId)`, `normalizeHabitName(name)` | Lanza `Error` |
| `renameHabit` | `isPositiveInt(id)`, `normalizeHabitName(name)` | Lanza `Error` |
| `setHabitReminder` | `isPositiveInt(id)`, `reminderTime` null o `isTimeHHMM` | Lanza `Error` |
| `archiveHabit` | `isPositiveInt(id)` | Lanza `Error` |
| `markHabitDone`, `unmarkHabitDone`, `toggleHabitDone`, `isHabitDone` | `isPositiveInt(habitId)`, `isDateYMD(date)` | Lanza `Error` |
| `getLogsForDate`, `getLogsInRange` | `isDateYMD` | Lanza `Error` |
| `scheduleHabitReminder` | `isTimeHHMM(time)` | Lanza `Error` |
| `AreaDetailScreen` | `isAreaId(id)` | Pantalla "Área no encontrada." + Volver |
| `SesionScreen` | `isRoutineId(routineId)` antes de `getRoutine` | Pantalla "Rutina no encontrada." (existente) |

Cambio en `src/db/client.ts`:

```ts
db = SQLite.openDatabaseSync(DB_NAME);
migrate(db);
db.execSync('PRAGMA foreign_keys = ON');
```

Cambio en `app.json`:

```json
"android": { "allowBackup": false, "...": "resto igual" }
```

Conventions:

- La validación vive en `src/db/` y `src/notifications.ts`. La UI además limita con `maxLength`, pero no es la barrera de seguridad.
- Los mensajes de error siguen en español y se muestran con el `setError` existente.
- `PRAGMA foreign_keys` es por conexión. Se activa después de `migrate` para no alterar migraciones ya probadas.

---

## Plan de implementación

1. Crear `src/validation.ts` con las constantes y funciones del modelo. `ROUTINE_IDS` se deriva de `SEED_ROUTINES`. Prueba: `npx tsc --noEmit` sin errores.
2. Usar los validadores en `src/db/habits.ts` (`createHabit`, `renameHabit`, `setHabitReminder`, `archiveHabit`). Prueba: tsc; en el dev build, crear un hábito con espacios dobles y ver el nombre normalizado.
3. Usar los validadores en `src/db/logs.ts` y en `scheduleHabitReminder` de `src/notifications.ts`. Prueba: tsc; marcar y desmarcar un hábito en Hoy sigue funcionando.
4. Activar `PRAGMA foreign_keys = ON` en `getDb()`. Prueba: la app abre, lista áreas, crea hábitos y marca logs sin errores.
5. Agregar `maxLength={HABIT_NAME_MAX_LENGTH}` a los dos `TextInput` de `src/app/area/[id].tsx`. Prueba: no se pueden escribir más de 120 caracteres.
6. Validar `id` en `src/app/area/[id].tsx`. Si no es `AreaId`, mostrar "Área no encontrada." y botón Volver, sin formulario ni sugerencias. Prueba: tsc.
7. Validar `routineId` con `isRoutineId` en `src/app/sesion/[routineId].tsx` antes de `getRoutine`. Prueba: tsc.
8. Agregar `"allowBackup": false` en `android` de `app.json`. Prueba: `npx expo config --type public` lo muestra.
9. `npm uninstall expo-web-browser expo-device`, luego `npx expo install --fix`. Prueba: `npx expo-doctor` sin errores nuevos; `npx tsc --noEmit` sin errores; anotar resultado de `npm audit --omit=dev`.
10. `git rm --cached .claude/settings.local.json` y agregar `.claude/settings.local.json` a `.gitignore`. El archivo local se conserva.
11. Crear `SECURITY.md`: modelo de amenazas, tabla de hallazgos H1–H10 con su corrección, riesgos aceptados y resultado final de `npm audit`.
12. Agregar sección "Seguridad" en `README.md` (3–5 viñetas + enlace a `SECURITY.md`) y fila de SPEC 06 en la tabla de specs.
13. Prueba local de prebuild: `npx expo prebuild --platform android --no-install` en copia desechable. Verificar `android:allowBackup="false"` en `AndroidManifest.xml`. No commitear `android/`.
14. `eas build --profile preview --platform android`, instalar encima y ejecutar las pruebas de deep links de la guía.

---

## Criterios de aceptación

- [ ] `src/validation.ts` existe y no importa React ni `expo-sqlite`.
- [ ] `npx tsc --noEmit` termina sin errores.
- [ ] Ninguna consulta en `src/` concatena variables dentro del SQL (revisión con `grep` de `` `SELECT ``/`` `INSERT ``/`` `UPDATE ``/`` `DELETE `` con `${`).
- [ ] `createHabit('xyz', 'a')` lanza error y no inserta fila.
- [ ] `setHabitReminder(1, '25:99', null)` lanza error.
- [ ] `markHabitDone(1, '2026-13-45')` lanza error.
- [ ] Crear un hábito con nombre `"  Leer   20‮ páginas  "` guarda `"Leer 20 páginas"`.
- [ ] El campo de nombre no acepta más de 120 caracteres al crear ni al renombrar.
- [ ] `PRAGMA foreign_keys` devuelve `1` en la conexión abierta.
- [ ] `adb shell am start -W -a android.intent.action.VIEW -d "buenoshabitos://area/hackeo" com.buenoshabitos.app` muestra "Área no encontrada." sin formulario.
- [ ] `adb shell am start -W -a android.intent.action.VIEW -d "buenoshabitos://sesion/X" com.buenoshabitos.app` muestra "Rutina no encontrada.".
- [ ] `buenoshabitos://area/fisica` sigue abriendo el área Física con normalidad.
- [ ] `npx expo config --type public` muestra `android.allowBackup: false`.
- [ ] El `AndroidManifest.xml` del prebuild contiene `android:allowBackup="false"`.
- [ ] `expo-web-browser` y `expo-device` no aparecen en `package.json`.
- [ ] `npm audit --omit=dev` no reporta vulnerabilidades `high` ni `critical`; las moderadas restantes están listadas en `SECURITY.md`.
- [ ] `.claude/settings.local.json` no está en `git ls-files` y sí en `.gitignore`.
- [ ] `SECURITY.md` existe y cubre H1–H10.
- [ ] `README.md` tiene sección "Seguridad" con enlace a `SECURITY.md`.
- [ ] `eas build --profile preview --platform android` termina con éxito y el APK se instala encima sin borrar datos.
- [ ] Tras instalar: crear, renombrar, archivar hábitos, marcar en Hoy, recordatorio con maullido y sesión de ejercicio funcionan igual que antes.

---

## Decisiones

- **Sí:** auditoría y correcciones en la misma spec. App pequeña (~2.500 líneas); los fixes son acotados.
- **Sí:** mantener el esquema `buenoshabitos://` y validar parámetros. `expo-router` y el dev client lo usan.
- **No:** eliminar el esquema. Rompe el dev client por URL y no aporta más que validar.
- **No:** bloquear todo deep link entrante con `+native-intent`. Validar es suficiente con rutas de solo lectura por defecto.
- **Sí:** `allowBackup: false`. Coherente con "datos solo en el teléfono".
- **No:** mantener backups de Google. Aceptado perder datos al cambiar de teléfono; exportar va en otra spec.
- **Sí:** parches de SDK 57 con `npx expo install --fix` y documentar el residuo. Las moderadas son transitivas y casi todas de build.
- **No:** `overrides` o `npm audit fix --force`. Riesgo alto de romper el build de Expo.
- **Sí:** límite de 120 caracteres. Elección del usuario; holgado frente a ~40 de las sugerencias.
- **Sí:** validar en `src/db/`, no solo en la UI. La capa de datos es la última barrera.
- **Sí:** `PRAGMA foreign_keys = ON` sin migración. La UI normal no genera huérfanos.
- **No:** migración v4 con `CHECK` o limpieza. Recrear tablas en SQLite es riesgoso para el beneficio.
- **Sí:** eliminar caracteres de control y bidi en nombres. Evita texto engañoso en UI y notificaciones.
- **Sí:** verificación con tsc, `npm audit`, `adb` y APK `preview`. `allowBackup` es nativo y exige build.
- **No:** agregar Jest. Amplía alcance; otra spec si llega.
- **Sí:** quitar `expo-web-browser` y `expo-device`. Sin uso en `src/` ni en plugins.
- **No:** quitar `expo-linking`, `expo-symbols`, `expo-glass-effect`, `@expo/ui`, `react-native-web`, `react-dom`. Son peer de `expo-router`.
- **Sí:** des-versionar `.claude/settings.local.json`. Es config local de la herramienta, con permisos ajenos al proyecto.
- **Sí:** `SECURITY.md` y sección en README. Deja registro del modelo de amenazas y riesgos aceptados.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `foreign_keys = ON` hace fallar operaciones sobre datos huérfanos ya existentes | Las operaciones actuales solo usan ids leídos de la DB. Si aparece un error, se captura con el `setError` existente y se documenta. |
| Validar en `db/` rompe un llamado existente con formato inesperado | Revisar todos los llamadores con `grep` en los pasos 2–3. `todayLocal()` y `formatTime()` ya producen los formatos exigidos. |
| `npx expo install --fix` sube una versión que rompe algo nativo | Probar en el dev build antes del APK. Si falla, revertir ese paquete y documentarlo. |
| Moderadas de `npm audit` sin parche dentro de SDK 57 | Aceptado. Son de build o de rutas no usadas; listadas en `SECURITY.md`. |
| `allowBackup: false` elimina la única forma de recuperar datos en un teléfono nuevo | Aceptado por el usuario. Exportar datos queda para otra spec. |
| El usuario pierde permisos locales de Claude Code al des-versionar | `git rm --cached` conserva el archivo en disco. |
| Nombres existentes de más de 120 caracteres o con control/bidi | No se migran. Al renombrarlos se normalizan. Se muestran igual que hoy. |

---

## Guía: pruebas de deep links

1. Instalar el APK `preview` y abrir la app una vez.
2. Con el teléfono conectado por USB y depuración activa:
   - `adb shell am start -W -a android.intent.action.VIEW -d "buenoshabitos://area/hackeo" com.buenoshabitos.app` → "Área no encontrada."
   - `adb shell am start -W -a android.intent.action.VIEW -d "buenoshabitos://area/fisica" com.buenoshabitos.app` → área Física normal.
   - `adb shell am start -W -a android.intent.action.VIEW -d "buenoshabitos://sesion/X" com.buenoshabitos.app` → "Rutina no encontrada."
3. Ir a Áreas y comprobar que no existe ningún hábito nuevo creado por las pruebas.

---

## Qué **no** está en esta spec

- Cifrado de la base de datos.
- PIN o biometría.
- Migración de esquema v4 o limpieza de huérfanos.
- Exportar o respaldar datos.
- Jest, tests automatizados, CI o análisis estático.
- Eliminar el esquema de deep links.
- `overrides` forzados o subir de SDK.
- Target web, ofuscación, detección de root.

Cada uno de esos, si llega, va en su propia spec.
