<p align="center">
  <img src="assets/images/icon.png" width="160" alt="Ícono de Buenos Hábitos: gato calicó sobre azul cielo" />
</p>

# Buenos Hábitos

App Android (React Native + Expo) para construir hábitos diarios en 6 áreas de vida, seguir una rutina de ejercicio en casa guiada y recibir recordatorios locales. Todos los datos viven solo en el teléfono.

---

## Características

**Hábitos por áreas de vida** (SPEC 01)

- 6 áreas fijas: Espiritual, Física, Intelectual, Familiar, Laboral y Emocional.
- Crear, renombrar y archivar hábitos diarios dentro de cada área.
- Pestaña **Hoy**: checklist del día agrupado por área; tocar para marcar o desmarcar.
- Pestaña **Progreso**: racha por hábito y % de cumplimiento por área en los últimos 7 días.
- Recordatorio diario opcional por hábito (hora local), con notificación local.

**Plan de rutina y diseño** (SPEC 02)

- Catálogo de hábitos sugeridos por área, que se agregan con un toque. Una sugerencia se oculta mientras exista un hábito activo creado a partir de ella.
- Color e ícono (Ionicons) propios por área; tarjetas en todas las listas.
- Tema centralizado en `src/theme.ts`. Tema claro forzado.

**Rutina de ejercicio en casa de 1 hora** (SPEC 03)

- 4 rutinas de 60 min sin equipo, con rotación semanal:

  | Día | Rutina |
  | --- | ------ |
  | Lunes y jueves | A — Tren superior y core |
  | Martes y viernes | B — Tren inferior y glúteo |
  | Miércoles y sábado | C — Cuerpo completo y cardio |
  | Domingo | D — Movilidad y estiramiento |

- Pestaña **Ejercicio** con la rutina del día y atajo "Empezar" en Hoy.
- Sesión guiada: fase Trabajo/Descanso, cuenta regresiva, imagen animada del ejercicio, instrucción corta, siguiente ejercicio, progreso y tiempo restante.
- Pausar, reanudar, saltar y salir. Pausa automática si la app pasa a segundo plano.
- Beep y vibración al inicio de cada fase; pantalla siempre encendida durante la sesión.
- Al terminar, marca como hecho el hábito "Rutina de ejercicio en casa 1 hora" del área Física.

**APK autónomo** (SPEC 04)

- Perfil EAS `preview`: APK instalable que funciona sin PC, sin Metro y sin Expo Go.

**Identidad de gato** (SPEC 05)

- Ícono de gata calicó con collar morado sobre azul cielo con huellitas. Ícono adaptativo y monocromo (íconos temáticos de Android 13+).
- Splash con el gato sobre azul cielo.
- Los recordatorios muestran una cara de gato en la barra de estado y suenan con un maullido.

**Rediseño "Michi compañero"** (SPEC 07)

- Tema nuevo: fondo crema, cabeceras azul cielo con huellitas, morado del collar como acento y fuentes Fredoka (títulos) y Nunito (texto) empaquetadas, sin conexión.
- Gato calicó dibujado en SVG con curvas y degradados, en 4 poses: sentado (Hoy), asomado (Áreas), con trofeo (Progreso) y estirado (Ejercicio).
- Animado con Reanimated: parpadea, respira, mueve la cola y la oreja. Salta con ojos felices al marcar un hábito y celebra con huellitas y corazones al completar el día.
- Al tocarlo ronronea (máx. uno cada 2 s) y cambia su mensaje. Con "Quitar animaciones" de Android queda quieto.
- Hoy con fecha larga, progreso con huella y atajo a la rutina; Áreas en cuadrícula con el área foco del día; Progreso con mejor racha y huellitas de la semana; Ejercicio con la tira "Esta semana".

---

## Stack

| Capa | Tecnología |
| ---- | ---------- |
| Framework | Expo SDK 57, React Native 0.86, React 19, TypeScript |
| Navegación | `expo-router` (rutas por archivos, pestañas) |
| Persistencia | `expo-sqlite` (síncrono, migraciones con `PRAGMA user_version`) |
| Notificaciones | `expo-notifications` (locales, diarias) |
| Audio | `expo-audio` |
| Gráficos y animación | `react-native-svg`, `react-native-reanimated` |
| Tipografía | `@expo-google-fonts/fredoka`, `@expo-google-fonts/nunito` (empaquetadas con `expo-font`) |
| Imágenes | `expo-image` |
| Otros nativos | `expo-keep-awake`, `Vibration`, `@react-native-community/datetimepicker` |
| Build | EAS Build (`development`, `preview`) |

---

## Arquitectura

```
src/
├── app/                       Pantallas (expo-router)
│   ├── _layout.tsx            Stack raíz; carga de fuentes con splash
│   ├── (tabs)/
│   │   ├── _layout.tsx        Barra de pestañas
│   │   ├── index.tsx          Hoy
│   │   ├── areas.tsx          Áreas
│   │   ├── ejercicio.tsx      Ejercicio
│   │   └── progreso.tsx       Progreso
│   ├── area/[id].tsx          Detalle de área: hábitos y sugerencias
│   └── sesion/[routineId].tsx Sesión guiada de ejercicio
├── db/                        Acceso a datos (SQLite)
│   ├── client.ts              Conexión, migraciones v1–v3, semillas de áreas y plan
│   ├── habits.ts              CRUD de hábitos
│   ├── logs.ts                Registros diarios (hecho / no hecho)
│   ├── plan.ts                Sugerencias del plan
│   ├── exercise.ts            Rutinas, ejercicios y rotación semanal
│   └── seedExercise.ts        Datos semilla de ejercicios y rutinas
├── exercise/                  Lógica de la sesión guiada
│   ├── steps.ts               Rutina → lista plana de pasos (trabajo/descanso)
│   ├── useSessionTimer.ts     Temporizador con pausa y salto
│   ├── cues.ts                Sonido + vibración por fase
│   ├── ExerciseImage.tsx      Animación de 2 imágenes por ejercicio
│   └── images.ts              Mapa estático de require() (generado)
├── cat/                       El gato (SPEC 07)
│   ├── Cat.tsx                <Cat pose mood size onPress />: 4 poses
│   ├── parts.tsx              Piezas SVG compartidas (cabeza, ojos, orejas, cola…)
│   ├── useCatAnimation.ts     Idle, reacciones y useCatMood; respeta "Reducir movimiento"
│   ├── Celebration.tsx        Huellitas y corazones al completar el día
│   ├── messages.ts            Frases por pantalla y estado
│   ├── purr.ts                Ronroneo con anti-spam de 2 s
│   └── palette.ts, types.ts   Colores y tipos del gato
├── ui/                        Componentes compartidos: cabecera, globo, huella, fila de hábito, barra, pestaña
├── notifications.ts           Permisos, canal Android y recordatorios diarios
├── streaks.ts                 Rachas y % de cumplimiento
├── date.ts                    Fechas locales "YYYY-MM-DD" y fecha larga en español
├── theme.ts                   Colores, radios, fuentes, estilo por área
└── types.ts                   Tipos de dominio
```

**Capas**

- **Pantallas** (`src/app/`): leen y escriben mediante funciones de `src/db/`. No escriben SQL.
- **Datos** (`src/db/`): funciones síncronas sobre una única conexión SQLite (`getDb()`). Convierten filas a tipos de `src/types.ts`.
- **Dominio puro** (`streaks.ts`, `exercise/steps.ts`, `date.ts`): sin dependencias de React ni de la base.
- **Nativo** (`notifications.ts`, `exercise/cues.ts`): envuelven módulos de Expo. `expo-notifications` se importa de forma dinámica para que la app no falle en Expo Go.

**Modelo de datos (SQLite)**

| Versión | Tablas |
| ------- | ------ |
| v1 | `areas`, `habits`, `habit_logs` (existe fila = hábito hecho ese día) |
| v2 | `plan_items`; columna `habits.plan_item_id` |
| v3 | `exercises`, `routines`, `routine_sections`, `section_items`, `routine_days`; sugerencia `fisica-5` |

Las migraciones corren al abrir la base, en transacción, y solo si `PRAGMA user_version` es menor que la versión destino. No borran datos existentes.

**Notificaciones**

- Canal Android `habitos-maullido` con sonido `maullido.wav` e importancia `DEFAULT`.
- Un recordatorio diario por hábito; su id se guarda en `habits.notification_id` para cancelarlo al archivar o cambiar la hora.

---

## Assets y scripts

| Script | Genera |
| ------ | ------ |
| `scripts/fetch-exercise-images.mjs` | `assets/exercises/<id>/{0,1}.jpg` (free-exercise-db, Unlicense) y `src/exercise/images.ts` |
| `scripts/gen-beeps.mjs` | `assets/sounds/trabajo.wav`, `assets/sounds/descanso.wav` |
| `scripts/gen-cat-icons.py` | Íconos de app, adaptativos, monocromo, splash, notificación y favicon (requiere Pillow) |
| `scripts/trim-meow.py` | Sin argumentos: `assets/sounds/maullido.wav`. Con `entrada salida inicio fin`: cualquier recorte, p. ej. `assets/sounds/ronroneo.wav` (WAV CC0 de freesound) |

Créditos de sonidos en `assets/sounds/CREDITS.md`.

---

## Desarrollo

```bash
npm install
npx expo start --dev-client     # con el development build instalado en el teléfono
npx tsc --noEmit                # chequeo de tipos
```

Las notificaciones no funcionan en Expo Go (SDK 53+). Usar el development build.

## Builds (EAS)

| Perfil | Uso | Comando |
| ------ | --- | ------- |
| `development` | APK con dev client; carga el JS desde Metro | `eas build --profile development --platform android` |
| `preview` | APK autónomo para uso diario | `eas build --profile preview --platform android` |

Ambos usan el package `com.buenoshabitos.app` y se instalan uno encima del otro. `versionCode` lo gestiona EAS en remoto.

---

## Seguridad

- Datos solo en el teléfono: sin red en tiempo de ejecución y `allowBackup: false` (no hay backups de Google ni `adb backup`).
- La capa `src/db/` valida todo lo que escribe (`src/validation.ts`): áreas, ids, fechas, horas y nombres de hábito (máx. 120 caracteres, sin caracteres de control ni bidi).
- Deep links `buenoshabitos://area/<x>` y `buenoshabitos://sesion/<x>` validan el parámetro; un valor inválido muestra "no encontrado" sin escribir nada.
- SQLite con `PRAGMA foreign_keys = ON` y consultas siempre parametrizadas.
- Modelo de amenazas, hallazgos y riesgos aceptados en [SECURITY.md](SECURITY.md).

---

## Metodología: specs

Cada funcionalidad se define primero en una spec en `specs/` y luego se implementa en una rama `spec-NN-slug`.

| Spec | Tema |
| ---- | ---- |
| [01](specs/01-base-app-habitos.md) | App base de hábitos por áreas de vida |
| [02](specs/02-plan-rutina-y-mejora-visual.md) | Plan de rutina precargado y mejora visual |
| [03](specs/03-rutina-ejercicio-en-casa.md) | Rutina de ejercicio en casa de 1 hora |
| [04](specs/04-apk-autonomo-preview.md) | APK autónomo con perfil `preview` |
| [05](specs/05-identidad-gato-icono-y-maullido.md) | Identidad de gato: ícono, splash y maullido |
| [06](specs/06-auditoria-seguridad-y-endurecimiento.md) | Auditoría de seguridad y endurecimiento |
| [07](specs/07-rediseno-michi-companero.md) | Rediseño "Michi compañero" con gato animado |
