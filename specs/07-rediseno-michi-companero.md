# SPEC 07 — Rediseño "Michi compañero" con gato animado

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 05
> **Fecha:** 2026-09-28
> **Objetivo:** Rediseñar la interfaz según la Idea 1 "Michi compañero" del canvas de diseño, con un gato calicó más realista dibujado en SVG, animado con Reanimated, que habla, reacciona y ronronea al tocarlo.

---

## Por qué existe esta spec

La UI actual usa el tema genérico de SPEC 02 (fondo gris, azul `#208AEF`, fuente del sistema). SPEC 05 dio identidad de gato solo al ícono, splash y notificaciones.

El canvas "Pantallas con alma gatuna" (https://claude.ai/artifact/BWsLfsReYmn1yWyLPjji5N) propone tres ideas. El usuario eligió la **Idea 1 · Michi compañero**: artboards `Main.dc.html` (Hoy), `A_Areas.dc.html`, `A_Progreso.dc.html` y `A_Ejercicio.dc.html`.

Único cambio pedido sobre el diseño: los gatos del canvas son de polígonos rectos y trazo grueso. Se quieren gatos más realistas (curvas suaves, degradados de pelaje, sombras) y animados.

`react-native-svg` y las fuentes empaquetadas son nativos. Solo llegan al teléfono con un APK nuevo (perfil `preview` de SPEC 04).

---

## Alcance

**Dentro:**

- Tema nuevo en `src/theme.ts` con la paleta, radios y tipografía de la Idea 1.
- Fuentes Fredoka (títulos) y Nunito (texto) empaquetadas con `@expo-google-fonts/fredoka` y `@expo-google-fonts/nunito`. El splash se mantiene hasta que cargan.
- Gato calicó dibujado con `react-native-svg`: curvas Bézier, degradados radiales en pelaje, sombra bajo el cuerpo, ojos verdes con brillo, collar morado. Mismo gato de SPEC 05 (crema, parche naranja, parche gris).
- 4 poses que comparten piezas (cabeza, ojos, orejas, cola):
  - `sentado`: de frente, cabeza y cuerpo. Pantalla Hoy.
  - `asomado`: cabeza y patas delanteras sobre un borde. Pantalla Áreas.
  - `trofeo`: sentado sosteniendo un trofeo. Tarjeta "Mejor racha" de Progreso.
  - `estirado`: pose de estiramiento "gato" en cuadrupedia. Cabecera de Ejercicio.
- Animaciones con `react-native-reanimated`:
  - Idle continuo: parpadeo cada 3–6 s aleatorio, respiración (escala 1 → 1.02), vaivén de cola, giro breve de oreja cada 5–9 s.
  - Reacción al marcar un hábito como hecho en Hoy: salto corto y ojos felices (arcos) durante ~800 ms.
  - Celebración al pasar a 100 % del día en Hoy: ojos felices, salto doble y 6–8 huellitas/corazones que suben y se desvanecen (~1.5 s). Solo en la transición, no al abrir la pantalla ya en 100 %.
  - Toque al gato (las 4 pestañas): reacción (cierra ojos, orejas atrás, leve vibración de escala), sonido de ronroneo y rota el mensaje del globo.
- Con "Reducir movimiento" activo en Android (`useReducedMotion`), el gato queda estático. El ronroneo y el cambio de mensaje siguen funcionando.
- Globo de diálogo con frases fijas por pantalla y estado. Al tocar al gato rota a otra frase del mismo estado.
- Ronroneo real CC0 de freesound.org en `assets/sounds/ronroneo.wav`, ≤ 2 s. Crédito en `assets/sounds/CREDITS.md`. Reproducido con `expo-audio`. No se solapa; como máximo uno cada 2 s.
- Componentes de UI compartidos: cabecera azul cielo con huellitas, globo de diálogo, ícono de huella, fila de hábito con check de huella, barra de progreso con huella, barra de pestañas con píldora activa.
- Pantalla **Hoy**: fecha larga en español, saludo, globo, gato sentado, tarjeta "Progreso de hoy" (X / Y y barra con huella), atajo a la rutina de hoy (si hay rutina y no está hecha), hábitos agrupados por área con check de huella.
- Pantalla **Áreas**: título "Tus 6 rincones", texto con el área foco, gato asomado, cuadrícula 2×3 de tarjetas con orejitas del color del área. Cada tarjeta: "N hábitos · M hechos". El área foco usa fondo cálido, borde de su color y "Te falta K hoy".
- Pantalla **Progreso**: "Tu racha gatuna", tarjeta morada "Mejor racha" con gato trofeo, tarjeta "Por área" (barras de 7 días, cálculo actual), tarjeta "Huellitas de la semana" con todos los hábitos activos: 7 huellas (hecho/no hecho) y su racha actual.
- Pantalla **Ejercicio**: cabecera con gato estirado y globo, tarjeta de la rutina de hoy con secciones y botón "Empezar sesión", tira "Esta semana" con la letra de rutina de cada día (L–D) y el día actual resaltado.
- Detalle de área (`area/[id].tsx`) y sesión guiada (`sesion/[routineId].tsx`): tema nuevo (colores, fuentes, tarjetas, botones). Sin gato.
- Nuevo APK `eas build --profile preview --platform android` instalado encima. Sin reset de datos.
- README: sección SPEC 06 en características, stack actualizado y fila en la tabla de specs.

**Fuera de alcance (para futuras specs):**

- Ideas 2 y 3 del canvas.
- Gato en detalle de área y en la sesión guiada.
- Rediseñar ícono de app, splash o ícono de notificación (quedan los de SPEC 05).
- Modo oscuro. Se mantiene tema claro forzado.
- Lottie o ilustraciones raster.
- Mensajes del gato generados por IA, personalizables o guardados.
- Ajuste para silenciar el ronroneo o desactivar animaciones desde la app.
- Nombre personalizado del gato.
- Récord histórico de racha.
- Nuevas tablas o migraciones SQLite.
- Cambiar la lógica de rutinas, temporizador o notificaciones.

---

## Modelo de datos

Esta feature no introduce tablas ni migraciones SQLite. Reutiliza el modelo de SPEC 01–03. Lee datos con las funciones existentes (`getLogsForDate`, `getLogsInRange`, `getLogsForHabit`, `getRoutineForWeekday`, `computeStreak`, `computeAreaCompletion`).

Tokens de tema en `src/theme.ts`:

```ts
export const colors = {
  background: '#FFF8EE', // crema
  surface: '#FFFFFF',
  sky: '#8ECDEB',        // cabeceras
  skyInk: '#13354A',     // títulos sobre cielo
  skyInkSoft: '#1F4E6B', // subtítulos sobre cielo
  accent: '#6E3B8C',     // morado collar: progreso, botón principal, pestaña activa
  accentSoft: '#EFE3F6', // píldora de pestaña activa
  text: '#2B2523',
  textMuted: '#6B625C',
  textDone: '#8A817A',   // hábito hecho (tachado)
  track: '#F1EADF',      // fondo de barras
  border: '#EFE6D8',
  error: '#CC0000',
  warning: '#B06500',
};

export const radius = { sm: 14, md: 18, lg: 22, xl: 26, pill: 99 };

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
};
// AREA_STYLE conserva color e ícono Ionicons; se agrega `soft` (fondo claro de la tarjeta)
// y `ink` (texto legible sobre soft), tomados del canvas.
```

Paleta del gato en `src/cat/palette.ts`: crema `#FCF5EA`, naranja `#E08A3C`, gris `#6B5B57`, ojos `#9BC53D`, nariz `#E07A7A`, interior de oreja `#F1B0A0`, mejillas `#F4B6B6`, collar `#7B3F8C`, contorno `#2B2523` (trazo fino ≤ 1.5, no el trazo grueso del canvas).

Estado del gato y mensajes:

```ts
// src/cat/types.ts
export type CatPose = 'sentado' | 'asomado' | 'trofeo' | 'estirado';
export type CatMood = 'idle' | 'feliz' | 'celebra' | 'mimado';

// src/cat/messages.ts
export type CatScreen = 'hoy' | 'areas' | 'progreso' | 'ejercicio';
export type CatState =
  | { screen: 'hoy'; kind: 'sin-habitos' | 'cero' | 'progreso' | 'completo'; done: number; total: number }
  | { screen: 'areas'; kind: 'foco' | 'todo-hecho' | 'sin-habitos'; areaName?: string; pending?: number }
  | { screen: 'progreso'; kind: 'con-racha' | 'sin-racha'; streak?: number; habitName?: string }
  | { screen: 'ejercicio'; kind: 'pendiente' | 'hecho' | 'sin-rutina'; routineName?: string };

export function getCatMessage(state: CatState, index: number): string;
// 2–4 frases por (screen, kind), con {done}/{total}/{areaName}/... interpolados.
// index se incrementa al tocar al gato; se usa módulo la cantidad de frases.
```

Regla del área foco (Áreas): entre áreas con al menos un hábito activo pendiente hoy, la de menor proporción `hechos / activos` hoy. Empate: orden fijo de `getAreas()`. Si ninguna tiene pendientes: sin foco, estado `todo-hecho` (o `sin-habitos` si no hay hábitos activos).

"Mejor racha" (Progreso): hábito activo con mayor `computeStreak` actual. Empate: el primero en orden de área y luego de creación. Si todas son 0: estado `sin-racha`.

Fecha larga (Hoy): `formatLongDateEs(date)` en `src/date.ts` con arreglos propios de días y meses en español ("Lunes 28 de septiembre"). No depende de `Intl`.

Assets nuevos:

| Archivo | Contenido |
| ------- | --------- |
| `assets/sounds/ronroneo.wav` | ≤ 2 s, mono, 44.1 kHz, 16 bit, normalizado, con fundido de entrada y salida |
| `assets/sounds/CREDITS.md` | Nueva entrada: URL de freesound, autor, licencia CC0 |

Dependencias nuevas (vía `npx expo install`): `react-native-svg`, `@expo-google-fonts/fredoka`, `@expo-google-fonts/nunito`.

Archivos nuevos:

```
src/cat/
├── palette.ts          Colores del gato
├── types.ts            CatPose, CatMood
├── parts.tsx           Cabeza, ojos (abiertos/cerrados/felices), orejas, cola, cuerpo, collar, defs de degradados
├── Cat.tsx             <Cat pose mood size onPress /> compone la pose y aplica animaciones
├── useCatAnimation.ts  Idle, reacción, celebración y mimo; respeta useReducedMotion
├── Celebration.tsx     Huellitas/corazones que suben y se desvanecen
├── messages.ts         getCatMessage
└── purr.ts             usePurr(): reproduce ronroneo.wav con anti-spam de 2 s
src/ui/
├── SkyHeader.tsx       Cabecera azul con huellitas, esquinas inferiores redondeadas
├── SpeechBubble.tsx    Globo con cola hacia el gato
├── PawIcon.tsx         Huella SVG (fill configurable)
├── HabitCheckRow.tsx   Fila de hábito con check de huella / círculo punteado
├── PawProgressBar.tsx  Barra con huella en el extremo
└── TabBarIcon.tsx      Ícono con píldora cuando está activo
```

---

## Plan de implementación

1. Instalar `react-native-svg`, `@expo-google-fonts/fredoka` y `@expo-google-fonts/nunito` con `npx expo install`. Cargar fuentes en `src/app/_layout.tsx` con `useFonts` y mantener el splash (`SplashScreen.preventAutoHideAsync`) hasta que carguen. Prueba: `npx tsc --noEmit` sin errores.
2. Reescribir `src/theme.ts` con los tokens nuevos (`colors`, `radius`, `fonts`, `AREA_STYLE` con `soft` e `ink`). Ajustar los usos rotos (`colors.primary` y similares) para que compile. Prueba: `npx tsc --noEmit`.
3. Crear `src/ui/PawIcon.tsx`, `SkyHeader.tsx`, `SpeechBubble.tsx`, `PawProgressBar.tsx`, `HabitCheckRow.tsx`, `TabBarIcon.tsx`.
4. Aplicar la barra de pestañas nueva en `src/app/(tabs)/_layout.tsx`: fondo blanco, borde `border`, activo `accent` con píldora `accentSoft`, fuente Nunito, íconos Ionicons (`calendar-outline`, `grid-outline`, `stats-chart-outline`, `barbell-outline`), sin header nativo.
5. Crear `src/cat/palette.ts`, `types.ts` y `parts.tsx` con las piezas estáticas. Crear `Cat.tsx` con la pose `sentado` sin animación. Prueba visual en dev build.
6. Agregar poses `asomado`, `trofeo` y `estirado` en `Cat.tsx`, reutilizando piezas. Prueba visual de las 4.
7. Crear `useCatAnimation.ts` con idle (parpadeo, respiración, cola, oreja) usando `useSharedValue` y `useAnimatedProps` sobre componentes SVG animados. Respetar `useReducedMotion`.
8. Agregar a `useCatAnimation.ts` los moods `feliz`, `celebra` y `mimado`. Crear `Celebration.tsx`.
9. Descargar ronroneo CC0 de freesound a `scripts/_tmp/`. Extender `scripts/trim-meow.py` para aceptar `entrada salida segundos` por argumentos, conservando el comportamiento actual sin argumentos. Generar `assets/sounds/ronroneo.wav` y registrar el crédito. Crear `src/cat/purr.ts`.
10. Crear `src/cat/messages.ts` con frases por (pantalla, estado). Agregar `formatLongDateEs` en `src/date.ts`.
11. Rediseñar `src/app/(tabs)/index.tsx` (Hoy): cabecera, globo, gato sentado con toque, tarjeta de progreso, atajo de rutina, hábitos con `HabitCheckRow`. Disparar `feliz` al marcar y `celebra` solo en la transición a 100 %.
12. Rediseñar `src/app/(tabs)/areas.tsx` con cuadrícula, orejitas, conteos por área y regla de área foco.
13. Rediseñar `src/app/(tabs)/progreso.tsx`: Mejor racha con gato trofeo, Por área, Huellitas de la semana con racha.
14. Rediseñar `src/app/(tabs)/ejercicio.tsx`: cabecera con gato estirado, tarjeta de rutina, botón "Empezar sesión", tira "Esta semana".
15. Aplicar el tema nuevo a `src/app/area/[id].tsx` y `src/app/sesion/[routineId].tsx` sin cambiar su lógica.
16. Actualizar `README.md`: características SPEC 07, stack (`react-native-svg`, fuentes), script de sonido y fila en la tabla de specs.
17. Lanzar `eas build --profile preview --platform android` e instalar encima del APK de SPEC 05.

---

## Criterios de aceptación

- [X] `npx tsc --noEmit` termina sin errores.
- [X] `eas build --profile preview --platform android` termina con éxito y el APK se instala encima sin perder hábitos ni registros.
- [X] Títulos se ven en Fredoka y textos en Nunito, también sin conexión.
- [X] El fondo de las pantallas es `#FFF8EE` y las cabeceras de las 4 pestañas son azul cielo con huellitas.
- [ ] La pestaña activa se muestra en morado con píldora de fondo.
- [X] Ningún gato usa triángulos rectos ni trazo grueso: orejas, cabeza y cuerpo son curvas y el pelaje tiene degradado.
- [X] Hoy muestra el gato sentado, Áreas el asomado, Progreso el de trofeo y Ejercicio el estirado.
- [X] Con la app abierta, el gato parpadea, respira y mueve la cola sin interacción.
- [X] Con "Quitar animaciones" activo en Android, el gato no se mueve.
- [X] Marcar un hábito en Hoy hace saltar al gato con ojos felices.
- [X] Marcar el último hábito pendiente del día muestra la celebración con huellitas/corazones.
- [X] Abrir Hoy con el día ya al 100 % no dispara la celebración.
- [X] Tocar al gato en cualquiera de las 4 pestañas reproduce el ronroneo y cambia el mensaje del globo.
- [X] Tocar al gato 5 veces seguidas en 1 s produce un solo ronroneo.
- [X] `assets/sounds/ronroneo.wav` dura ≤ 2 s y `CREDITS.md` indica licencia CC0 y URL de origen.
- [X] `python scripts/trim-meow.py` sin argumentos sigue generando `maullido.wav` igual que antes.
- [X] El globo de Hoy muestra "X de Y" coherente con la tarjeta de progreso.
- [X] Hoy muestra la fecha con formato "Lunes 28 de septiembre".
- [X] En Áreas, el área destacada es la de menor proporción hecha hoy entre las que tienen pendientes, y muestra "Te falta K hoy".
- [X] En Áreas, con todos los hábitos hechos, ninguna tarjeta se destaca.
- [X] Tocar una tarjeta de Áreas abre su detalle.
- [X] Progreso muestra en "Mejor racha" el hábito con mayor racha actual y su número de días.
- [X] Progreso lista todos los hábitos activos con 7 huellas y su racha actual.
- [X] Los porcentajes de "Por área" coinciden con los de la versión anterior de Progreso.
- [X] Ejercicio muestra la tira L–D con A, B, C, A, B, C, D y resalta el día actual.
- [X] "Empezar sesión" abre la sesión guiada de la rutina del día.
- [X] Detalle de área y sesión guiada usan colores y fuentes nuevas y conservan todas sus funciones.
- [X] Los recordatorios siguen sonando con el maullido de SPEC 05.
- [X] README incluye SPEC 07 en características y en la tabla de specs.

---

## Decisiones

- **Sí:** Idea 1 "Michi compañero" del canvas. Elección del usuario.
- **Sí:** gato en `react-native-svg` con curvas y degradados, animado con Reanimated. Nítido a cualquier tamaño, sin assets externos, permite animar partes por separado.
- **No:** Lottie. Difícil crear y personalizar un gato calicó propio sin After Effects.
- **No:** ilustraciones PNG. Solo permiten animar la imagen entera; sin parpadeo ni cola.
- **No:** trazo grueso y polígonos del canvas. Pedido explícito del usuario: más realista.
- **Sí:** 4 poses con piezas compartidas. Variedad por pantalla sin duplicar animaciones.
- **Sí:** idle, reacción al marcar, celebración al 100 % y toque. Elección del usuario.
- **Sí:** celebración solo en la transición a 100 %. Evita repetirla cada vez que se abre Hoy.
- **Sí:** respetar "Reducir movimiento". Accesibilidad; el sonido y el mensaje siguen.
- **Sí:** ronroneo CC0 de freesound al tocar. Elección del usuario en lugar del maullido.
- **No:** maullido al tocar. El maullido queda para recordatorios.
- **Sí:** extender `trim-meow.py` con argumentos. Reutiliza el procesamiento de SPEC 05 sin duplicar código.
- **Sí:** anti-spam de 2 s en el ronroneo. Evita sonidos solapados.
- **Sí:** frases fijas por pantalla y estado, rotando al tocar. Vivo sin persistencia ni IA.
- **Sí:** fecha en español con arreglos propios. No depende del soporte de `Intl` de Hermes.
- **Sí:** Fredoka + Nunito empaquetadas. Funciona offline y fiel al diseño.
- **Sí:** área foco = menor proporción hecha hoy entre las que tienen pendientes. Útil para el día a día.
- **Sí:** "Mejor racha" = mayor racha actual. Reusa `computeStreak`; sin cálculo nuevo.
- **No:** récord histórico. Otra spec si llega.
- **Sí:** Huellitas de la semana para todos los hábitos con su racha. No se pierde la info de racha por hábito de la versión actual.
- **Sí:** íconos de área y pestañas con Ionicons. Ya instalados y coherentes con SPEC 02; los trazos del canvas son equivalentes.
- **Sí:** azul de cabecera `#8ECDEB` del canvas. Se mantiene `#87CEEB` en ícono y splash de SPEC 05; la diferencia es imperceptible.
- **Sí:** tema nuevo en detalle y sesión, sin gato. Consistencia visual sin ampliar el trabajo de dibujo.
- **No:** modo oscuro. Fuera de alcance; tema claro forzado como hasta ahora.
- **Sí:** APK `preview` sin reset de datos. No hay migraciones ni canales nuevos.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Animaciones SVG con Reanimated consumen batería o bajan FPS | Animar solo transformaciones y opacidad de pocas piezas. Pausar idle cuando la pestaña pierde foco (`useIsFocused`). |
| `useAnimatedProps` sobre componentes de `react-native-svg` falla con alguna versión | Usar `Animated.createAnimatedComponent` sobre `G`/`Path`. Si falla una propiedad, animar `transform` del `G` contenedor. |
| El gato "realista" en SVG se ve pobre o recargado a 96–150 px | Revisión visual en el paso 5 antes de hacer las otras poses. Ajustar detalle a tamaño real. |
| Fuentes no cargan y la app queda en splash | Si `useFonts` devuelve error, ocultar splash y usar fuente del sistema. |
| Freesound exige cuenta para descargar | El usuario lo descarga a mano a `scripts/_tmp/`, como en SPEC 05. |
| El ronroneo suena con el teléfono en silencio | `expo-audio` respeta el modo silencio por defecto en Android. No se fuerza. |
| Nombres de hábito largos rompen filas de huellitas | Texto con `numberOfLines={1}` y huellas de ancho fijo. |
| Textos de color sobre fondos suaves con poco contraste | `AREA_STYLE.ink` oscurecido para 4.5:1, como en el canvas. |

---

## Qué **no** está en esta spec

- Ideas 2 y 3 del canvas.
- Gato en detalle de área y sesión guiada.
- Cambios en ícono, splash o notificaciones.
- Modo oscuro.
- Lottie o imágenes raster del gato.
- Mensajes con IA, nombre del gato o ajustes de sonido/animación.
- Récord histórico de racha.
- Migraciones SQLite o cambios de lógica de rutinas y recordatorios.

Cada uno de esos, si llega, va en su propia spec.
