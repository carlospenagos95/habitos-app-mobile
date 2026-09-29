# Seguridad

Documento de la auditoría de seguridad de **Buenos Hábitos** (SPEC 06, 2026-09-28): modelo de amenazas, hallazgos, correcciones y riesgos aceptados.

---

## Modelo de amenazas

La app es 100 % local: sin servidor, sin cuentas, sin red en tiempo de ejecución. Los datos (hábitos, logs, recordatorios) viven en `habitos.db` (SQLite) dentro del almacenamiento privado de la app.

**Qué se protege**

- Integridad de `habitos.db`: que ninguna entrada escriba datos inválidos.
- Confidencialidad: que los datos no salgan del teléfono.

**Entradas desde fuera del flujo normal**

| Entrada | Quién la controla | Defensa |
| ------- | ----------------- | ------- |
| Texto libre (nombre de hábito) | Usuario | `maxLength` en UI + `normalizeHabitName` en `src/db/` |
| Deep links `buenoshabitos://area/<x>` y `buenoshabitos://sesion/<x>` | Cualquier app o página web del teléfono | Validación de parámetros de ruta; valor inválido → pantalla "no encontrado", sin escritura |
| Backups de Android (Google, `adb backup`) | Cuenta de Google / quien tenga el teléfono con depuración USB | `android.allowBackup: false` |
| Dependencias npm | Terceros | Parches de SDK 57, `npm audit`, dependencias sin uso eliminadas |

**Fuera del modelo**

- Teléfono con root o malware con acceso al almacenamiento privado de la app.
- Acceso físico al teléfono desbloqueado.
- Ingeniería inversa del APK (el código no guarda secretos).

---

## Hallazgos y correcciones

| # | Hallazgo | Severidad | Corrección |
| - | -------- | --------- | ---------- |
| H1 | Deep link `buenoshabitos://area/<x>` abría la pantalla con `areaId` sin validar; permitía crear hábitos en un área inexistente. | Media | `src/app/area/[id].tsx` valida con `isAreaId`; si falla muestra "Área no encontrada." sin formulario ni sugerencias. `createHabit` también rechaza áreas inválidas. |
| H2 | SQLite no aplicaba llaves foráneas. | Media | `PRAGMA foreign_keys = ON` en `getDb()` tras `migrate` (`src/db/client.ts`). |
| H3 | `android.allowBackup` activo por defecto; `habitos.db` salía del teléfono en backups. | Media | `"allowBackup": false` en `app.json` → `android:allowBackup="false"` en el manifest. |
| H4 | `TextInput` de nombre sin límite de longitud. | Baja | `maxLength={120}` en crear y renombrar; `normalizeHabitName` rechaza > 120 en la capa de datos. |
| H5 | `src/db/` no validaba formatos (`reminderTime`, fechas, `areaId`, ids). | Baja | Nuevo `src/validation.ts`; `habits.ts`, `logs.ts` y `scheduleHabitReminder` lanzan `Error` ante datos inválidos. |
| H6 | Nombres aceptaban caracteres de control y bidi (texto engañoso en UI y notificaciones). | Baja | `normalizeHabitName` elimina U+0000–U+001F, U+007F–U+009F, U+200E, U+200F, U+202A–U+202E, U+2066–U+2069; colapsa espacios. |
| H7 | Deep link `buenoshabitos://sesion/<x>` consultaba la DB con un `routineId` arbitrario. | Baja | `isRoutineId` antes de `getRoutine`; si falla, "Rutina no encontrada." sin consultar. |
| H8 | `npm audit`: 15 vulnerabilidades moderadas transitivas. | Baja | `npx expo install --fix` (parches SDK 57). Residuo documentado abajo como riesgo aceptado. |
| H9 | Dependencias sin uso: `expo-web-browser`, `expo-device`. | Informativa | Desinstaladas. |
| H10 | `.claude/settings.local.json` versionado en git. | Informativa | `git rm --cached` y agregado a `.gitignore`. Sigue existiendo en el historial de git. |

### Verificado sin hallazgos

- **Inyección SQL:** todas las consultas usan parámetros (`?` o `$nombre`).
- **Red en tiempo de ejecución:** la app no hace `fetch`. Solo `scripts/fetch-exercise-images.mjs` descarga, en el PC del desarrollador.
- **Notificaciones:** sin listener de respuesta; tocar una notificación solo abre la app.
- **Secretos:** ninguno en el repo. `extra.eas.projectId` es público por diseño.
- **Permisos Android:** solo `VIBRATE` más los que agrega `expo-notifications`.

---

## Resultado de `npm audit --omit=dev`

Tras SPEC 06: **0 critical, 0 high, 15 moderate**. Las 15 derivan de dos vulnerabilidades raíz:

| Paquete raíz | Cadena | Cuándo se usa | Impacto en la app |
| ------------ | ------ | ------------- | ----------------- |
| `uuid@7.0.3` (falta de chequeo de límites de buffer en v3/v5/v6 con `buf`) | `xcode` → `@expo/config-plugins` → `@expo/config`, `@expo/cli`, `@expo/prebuild-config`, `@expo/metro-config`, `@expo/inline-modules`, `@expo/local-build-cache-provider`, `expo`, `expo-splash-screen`, `@react-native-community/datetimepicker` | Solo en build (prebuild / config plugins) | Ninguno en el APK. |
| `decode-uri-component@0.2.2` (DoS por decodificación exponencial de `%` malformados) | `query-string@7.1.3` → `expo-router` | Tiempo de ejecución (parseo de URLs) | Un deep link malicioso podría congelar la app. Sin pérdida ni fuga de datos. |

El "fix" que propone `npm audit` baja a versiones de SDK antiguas (`expo@46`, `expo-router@5`), incompatible con SDK 57. Se acepta el riesgo hasta que Expo publique las dependencias corregidas.

---

## Riesgos aceptados

- **Moderadas de `npm audit`** listadas arriba, sin parche dentro de SDK 57. No se usan `overrides` ni `npm audit fix --force` para no romper el build de Expo.
- **Sin backups**: con `allowBackup: false`, cambiar de teléfono o desinstalar pierde los datos. Exportar datos queda para otra spec.
- **Transferencia entre dispositivos (Android 12+)**: `allowBackup="false"` desactiva el backup a la nube, pero la transferencia dispositivo a dispositivo al configurar un teléfono nuevo puede seguir copiando `habitos.db`. Bloquearla exige `android:dataExtractionRules` vía config plugin; se acepta porque la copia va a otro teléfono del mismo usuario y los datos no son sensibles.
- **DB sin cifrar**: `habitos.db` está en el almacenamiento privado de la app, sin SQLCipher. Datos no sensibles y app sin cuentas.
- **Filas huérfanas previas**: no se migran ni se limpian. La UI normal no las genera.
- **Nombres existentes** de más de 120 caracteres o con control/bidi: no se migran; se normalizan al renombrarlos.
- **Esquema `buenoshabitos://` activo**: se mantiene (lo usan `expo-router` y el dev client); se validan los parámetros en lugar de bloquearlo.
- **`.claude/settings.local.json` en el historial de git**: des-versionado, pero no se reescribe el historial.
- **`expo-doctor`** reporta `expo-asset` como peer faltante de `expo-audio` (existente desde SPEC 05; se resuelve de forma transitiva vía `expo`).

---

## Reportar un problema

Proyecto personal. Si encuentras una vulnerabilidad, abre un issue en el repositorio sin incluir detalles explotables, o contacta al autor directamente.
