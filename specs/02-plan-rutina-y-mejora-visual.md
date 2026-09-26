# SPEC 02 — Plan de rutina precargado y mejora visual base

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-25
> **Objetivo:** Ofrecer en cada área un catálogo de 4 hábitos sugeridos que el usuario agrega con un toque, y dar a la app una apariencia coherente con iconos, color por área y tema centralizado, validando las notificaciones en un development build nativo.

---

## Por qué existe esta spec

SPEC 01 dejó la base funcional con pantallas de texto plano y sin contenido inicial. Un usuario nuevo ve 6 áreas vacías y no sabe por dónde empezar. Esta spec agrega el contenido sugerido (el "plan de rutina") y la capa visual mínima para que la app sea usable a diario.

Se agrupan dos dominios (datos de plan + UI) en una sola spec por decisión explícita del usuario. Se ofreció dividirla.

También cierra el riesgo abierto de SPEC 01: las notificaciones se validaron en Expo Go, que tiene soporte limitado. Aquí se configura un development build con EAS para validarlas de forma nativa.

---

## Alcance

**Dentro:**

- Tabla SQLite `plan_items` con 24 hábitos sugeridos (4 por área), sembrada en la migración `v2`.
- Columna `habits.plan_item_id` que vincula un hábito con la sugerencia de la que salió.
- En el detalle de cada área: sección "Sugerencias del plan" con botón "Agregar" por sugerencia.
- Una sugerencia se oculta mientras exista un hábito **activo** con su `plan_item_id`.
- Los hábitos agregados desde el plan se crean sin hora de recordatorio y son editables como cualquier otro.
- Librería de iconos `@expo/vector-icons` (Ionicons).
- Iconos en las 3 pestañas (Hoy, Áreas, Progreso) y en cada una de las 6 áreas.
- Color propio por área, usado en la fila de Áreas, en la cabecera de sección de Hoy y en una barra de % en Progreso.
- Tema centralizado en `src/theme.ts` (colores, espaciados, radios, tamaños de fuente, estilo por área).
- Filas de Áreas, Hoy y Progreso como tarjetas.
- Checkbox de Hoy con icono Ionicons (círculo vacío / círculo con check en color del área).
- Forzar tema claro: `app.json` → `"userInterfaceStyle": "light"`.
- Development build con EAS: `expo-dev-client`, `eas.json` con perfil `development`, `android.package` en `app.json`.
- Guía de validación de notificaciones en el development build (sección al final).

**Fuera de alcance (specs futuras):**

- Rutina de ejercicio en casa de 1 hora al día (SPEC 03).
- Momento del día (mañana/tarde/noche) en hábitos o sugerencias.
- Editar, crear o borrar sugerencias del catálogo desde la app.
- Botón "agregar todas" o carga global del plan.
- Hora de recordatorio sugerida en el plan.
- Tema oscuro.
- Animaciones, fuentes personalizadas, ilustraciones, rediseño del ícono o splash de la app.
- Build de producción, firma para Play Store, publicación.
- Check-in emocional, otras frecuencias, nube (siguen fuera como en SPEC 01).

---

## Modelo de datos

Migración `v2` en `src/db/client.ts`. `PRAGMA user_version` pasa de `1` a `2`. Se ejecuta solo si `user_version < 2`, tanto en instalaciones nuevas (después de `v1`) como en instalaciones existentes. No borra ni modifica datos existentes.

```sql
CREATE TABLE plan_items (
  id TEXT PRIMARY KEY,                 -- estable: "<areaId>-<n>", ej. "fisica-2"
  area_id TEXT NOT NULL REFERENCES areas(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL          -- 0..3 dentro del área
);
ALTER TABLE habits ADD COLUMN plan_item_id TEXT REFERENCES plan_items(id);  -- NULL = hábito manual
```

```ts
// src/types.ts (cambios)
interface PlanItem {
  id: string;        // "espiritual-1"
  areaId: AreaId;
  name: string;
  sortOrder: number;
}

interface Habit {
  // ...campos de SPEC 01
  planItemId: string | null; // nuevo
}
```

```ts
// src/theme.ts (forma, no valores finales obligatorios salvo iconos)
export const colors = { primary, background, surface, text, textMuted, border };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };
export const radius = { md: 12 };
export const fontSize = { sm: 14, md: 16, lg: 18, xl: 24 };
export const AREA_STYLE: Record<AreaId, { icon: IoniconName; color: string }>;
```

Estilo por área (vive en `src/theme.ts`, no en la base de datos):

| Área | Icono Ionicons | Color |
| --- | --- | --- |
| espiritual | `sparkles-outline` | `#7C5CFF` |
| fisica | `barbell-outline` | `#E4572E` |
| intelectual | `book-outline` | `#2A7FFF` |
| familiar | `people-outline` | `#F2A541` |
| laboral | `briefcase-outline` | `#2E9E6B` |
| emocional | `heart-outline` | `#E0527E` |

Iconos de pestañas: Hoy `today-outline`, Áreas `grid-outline`, Progreso `stats-chart-outline`.

Catálogo sembrado en `v2` (id = `<areaId>-<n>`, n = sort_order + 1):

| Área | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| espiritual | Meditar 10 minutos | Leer un texto espiritual 10 minutos | Escribir 3 cosas por las que agradezco | 5 minutos de silencio antes de dormir |
| fisica | Caminar 30 minutos | Tomar 2 litros de agua | Dormir 7 horas o más | Estirar 10 minutos |
| intelectual | Leer 20 páginas | Estudiar un tema nuevo 30 minutos | Escuchar un podcast educativo | Escribir un resumen de lo aprendido |
| familiar | Comer sin pantallas con la familia | Llamar o escribir a un familiar | 15 minutos de conversación sin celular | Planear una actividad familiar semanal |
| laboral | Definir las 3 prioridades del día | Trabajar 90 minutos sin distracciones | Revisar pendientes al cerrar el día | Aprender algo de mi oficio 15 minutos |
| emocional | Registrar cómo me siento hoy | Respirar profundo 5 minutos | Hacer algo que disfruto 20 minutos | Revisar el día sin juzgarme |

Convenciones:

- Sugerencia visible en un área = fila de `plan_items` del área sin hábito con `plan_item_id` igual y `archived = 0`.
- Renombrar un hábito del plan conserva el vínculo; la sugerencia sigue oculta.
- Archivar un hábito del plan hace que la sugerencia vuelva a aparecer. Agregarla de nuevo crea un hábito nuevo; los logs del archivado no se transfieren.
- Colores hex solo en `src/theme.ts`. Las pantallas importan tokens.

---

## Plan de implementación

1. Instalar `@expo/vector-icons` (`npx expo install @expo/vector-icons`). Crear `src/theme.ts` con tokens y `AREA_STYLE`. Cambiar `app.json` a `"userInterfaceStyle": "light"`. Prueba: la app arranca igual que antes.
2. Añadir iconos a las pestañas en `src/app/(tabs)/_layout.tsx` (`tabBarIcon`, `tabBarActiveTintColor = colors.primary`). Prueba: las 3 pestañas muestran icono.
3. Rediseñar `src/app/(tabs)/areas.tsx`: tarjeta por área con icono y color de `AREA_STYLE`, estilos desde tokens. Prueba: 6 tarjetas con icono y color distintos.
4. Rediseñar `src/app/(tabs)/index.tsx` (Hoy): cabecera de sección con icono y color del área; tarjetas; checkbox con Ionicons (`ellipse-outline` / `checkmark-circle` en color del área). Prueba: marcar y desmarcar sigue funcionando.
5. Rediseñar `src/app/(tabs)/progreso.tsx`: tarjeta por área con icono, barra horizontal de % en color del área (vacía si `—`). Prueba: % y rachas iguales a antes.
6. Aplicar tokens y tarjetas a `src/app/area/[id].tsx` (cabecera con icono y color del área). Prueba: CRUD de hábitos sigue funcionando.
7. Migración `v2` en `src/db/client.ts`: crear `plan_items`, `ALTER TABLE habits ADD COLUMN plan_item_id`, sembrar las 24 sugerencias, `user_version = 2`. Actualizar `src/types.ts` y `rowToHabit` en `src/db/habits.ts`. Prueba: en una instalación con datos de v1, los hábitos y logs siguen ahí y `user_version` es `2`.
8. Crear `src/db/plan.ts`: `listSuggestions(areaId)` y `addHabitFromPlan(planItemId)` (usa `createHabit` con `planItemId`). Prueba: llamar desde consola/botón temporal y ver el hábito creado con `plan_item_id`.
9. Sección "Sugerencias del plan" en `src/app/area/[id].tsx` con botón "Agregar" por sugerencia; se refresca al agregar y al archivar. Sin sugerencias restantes: texto "Ya agregaste todas las sugerencias de esta área."
10. Development build: `npx expo install expo-dev-client`, `eas build:configure`, `eas.json` con perfil `development` (`developmentClient: true`, `distribution: "internal"`, `android.buildType: "apk"`), `android.package: "com.buenoshabitos.app"` en `app.json`. Generar APK con `eas build --profile development --platform android`. Prueba: el APK instala y conecta con `npx expo start --dev-client`.
11. Revalidar notificaciones de SPEC 01 en el development build siguiendo la guía de abajo. Si algo falla, corregir en `src/notifications.ts`.

---

## Criterios de aceptación

**Plan de rutina**

- [ ] `PRAGMA user_version` devuelve `2` tras abrir la app, tanto en instalación nueva como en una que venía de `1`.
- [ ] Tras actualizar desde `v1`, todos los hábitos y logs previos siguen presentes.
- [ ] `plan_items` tiene exactamente 24 filas, 4 por área.
- [ ] En un área sin hábitos del plan, la sección "Sugerencias del plan" muestra 4 sugerencias.
- [ ] Tocar "Agregar" crea un hábito con ese nombre, `plan_item_id` asignado y `reminder_time` nulo; la sugerencia desaparece de la lista.
- [ ] El hábito agregado aparece en Hoy bajo su área.
- [ ] Renombrar un hábito del plan no hace reaparecer su sugerencia.
- [ ] Archivar un hábito del plan hace reaparecer su sugerencia.
- [ ] Con las 4 sugerencias agregadas se muestra "Ya agregaste todas las sugerencias de esta área."
- [ ] Agregar sugerencias no solicita permiso de notificaciones.

**Mejora visual**

- [ ] Las pestañas Hoy, Áreas y Progreso muestran su icono; la activa usa `colors.primary`.
- [ ] Cada una de las 6 áreas muestra su icono y color de la tabla en Áreas, Hoy, Progreso y detalle de área.
- [ ] En Hoy, un hábito no hecho muestra `ellipse-outline`; hecho muestra `checkmark-circle` en el color de su área.
- [ ] En Progreso, cada área con % muestra una barra de ancho proporcional al % en el color del área; área con `—` muestra barra vacía.
- [ ] `grep -rE "#[0-9A-Fa-f]{3,8}\b" src/app` no devuelve resultados (colores solo en `src/theme.ts`).
- [ ] Con el teléfono en modo oscuro, la app se ve en tema claro.
- [ ] Todos los textos nuevos están en español.

**Development build y notificaciones (validar en el APK de desarrollo, no en Expo Go)**

- [ ] `eas build --profile development --platform android` termina con éxito y el APK se instala en el teléfono.
- [ ] El APK abre la app conectada a `npx expo start --dev-client` sin errores en consola.
- [ ] Hábito con recordatorio a +2 min: la notificación llega con la app en primer plano.
- [ ] Ídem con la app en segundo plano.
- [ ] Ídem con la app cerrada (deslizada fuera de recientes).
- [ ] La notificación vuelve a llegar al día siguiente a la misma hora.
- [ ] Al archivar el hábito o quitar la hora, la notificación deja de llegar.
- [ ] Con el permiso de notificaciones denegado, el hábito se guarda y la app avisa que los recordatorios están desactivados.

---

## Guía: validar notificaciones con un development build (EAS)

Expo Go no es la app real: comparte permisos y canal de notificaciones con el propio Expo Go. El development build es un APK con tu `applicationId`, tu manifiesto y tus módulos nativos. Así se comporta igual que la app final.

**Preparación (una vez)**

1. Crear cuenta gratis en expo.dev.
2. `npm install -g eas-cli`
3. `eas login`
4. En el proyecto: `npx expo install expo-dev-client`
5. `eas build:configure` (crea `eas.json` y vincula el proyecto; confirmar `android.package`).
6. Verificar en `eas.json` el perfil `development` con `developmentClient: true`, `distribution: "internal"` y `android.buildType: "apk"`.

**Generar e instalar**

7. `eas build --profile development --platform android` (compila en la nube, 10–20 min).
8. Al terminar, abrir en el teléfono el enlace o QR que imprime EAS y descargar el APK.
9. Instalar el APK. Android pedirá permitir "instalar apps de origen desconocido" para el navegador.
10. Solo se recompila el APK si cambian dependencias nativas o `app.json`. Cambios de JS/TS no requieren nuevo build.

**Ejecutar**

11. En la PC: `npx expo start --dev-client`.
12. Teléfono y PC en la misma red Wi-Fi. Abrir "Buenos Hábitos" (no Expo Go) y conectar al servidor (escanear QR o elegirlo en la lista).
13. Si la red bloquea la conexión: `npx expo start --dev-client --tunnel`.

**Pruebas de notificaciones**

14. Antes de probar: Ajustes > Apps > Buenos Hábitos > Batería > "Sin restricciones". En Xiaomi/Huawei/Samsung activar también "Inicio automático" si existe.
15. Primer plano: crear hábito con hora a +2 min y esperar con la app abierta.
16. Segundo plano: repetir y pulsar Inicio.
17. App cerrada: repetir y deslizar la app fuera de recientes.
18. Repetición diaria: dejar el hábito y comprobar al día siguiente.
19. Cancelación: archivar un hábito con hora próxima (o quitarle la hora) y comprobar que no llega.
20. Permiso denegado: desinstalar y reinstalar el APK (o Ajustes > Apps > Buenos Hábitos > Notificaciones > desactivar), crear un recordatorio, denegar el permiso y verificar el aviso.
21. Opcional: reiniciar el teléfono y comprobar que la notificación del día siguiente llega igual.

---

## Decisiones

- **Sí:** una sola spec para plan y visual, por decisión explícita del usuario. Se ofreció dividirla.
- **Sí:** ejercicio en casa sigue como SPEC 03, igual que en SPEC 01.
- **Sí:** catálogo en tabla `plan_items` con migración `v2`. Permite vincular hábitos con su origen.
- **No:** constante TS con comparación por nombre. Renombrar rompía la detección de "ya agregado".
- **Sí:** columna `habits.plan_item_id` nullable. Hábitos manuales quedan con `NULL`; no cambia nada para ellos.
- **Sí:** ids de sugerencia estables tipo `fisica-2`. Legibles y fáciles de referenciar en migraciones futuras.
- **Sí:** carga opt-in por sugerencia en el detalle de área. El usuario elige; no se inflan áreas con hábitos que no quiere.
- **No:** carga automática al primer arranque ni botón global. Invasivo y difícil de deshacer.
- **Sí:** sugerencias sin hora de recordatorio. Evita pedir permiso y programar 24 notificaciones de golpe.
- **Sí:** 4 sugerencias por área redactadas por Claude y fijadas en esta spec. El usuario las revisa antes de aprobar.
- **No:** momento del día en la rutina. Cambia la agrupación de Hoy; va en spec aparte.
- **Sí:** `@expo/vector-icons` (Ionicons). Estándar de Expo, funciona igual en Expo Go y dev build.
- **No:** `expo-symbols`. SF Symbols orientado a iOS.
- **Sí:** icono y color por área en `src/theme.ts`, no en la base. Es presentación; cambiarlo no requiere migración.
- **Sí:** solo tema claro, forzado en `app.json`. Tema oscuro sigue fuera como en SPEC 01.
- **Sí:** development build con EAS en la nube. No requiere Android Studio ni SDK local.
- **No:** `npx expo run:android` local. Requiere Android Studio, SDK y JDK.
- **Sí:** `android.package = "com.buenoshabitos.app"`. Valor propuesto; cambiarlo antes de aprobar si se prefiere otro, porque después de instalar no se puede cambiar sin reinstalar.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Migración `v2` falla a mitad y deja la base inconsistente | Ejecutar `v2` dentro de una transacción; `user_version = 2` solo al final. |
| `ALTER TABLE ... REFERENCES` no aplica la FK en SQLite | Aceptado: la integridad la asegura `src/db/plan.ts`. Solo inserta ids existentes. |
| Colores de área con poco contraste sobre blanco | Usar el color en iconos, bordes y barras, no como color de texto largo. |
| Ahorro de batería del fabricante retrasa o bloquea notificaciones | Paso 14 de la guía. Documentar que no es un fallo de la app si llega tras desactivarlo. |
| Android 12+ programa alarmas inexactas; la notificación llega con minutos de retraso | Tolerancia aceptada de hasta 5 min en la validación. Alarmas exactas en spec futura si hace falta. |
| Cuenta EAS gratis con cola de builds lenta | Aceptado. Solo se recompila al cambiar dependencias nativas o `app.json`. |
| Cambiar `android.package` después de instalar | Decidirlo antes de aprobar la spec. |

---

## Qué **no** está en esta spec

- Rutina de ejercicio en casa (SPEC 03).
- Momento del día en hábitos o sugerencias.
- Editar el catálogo del plan desde la app, o botón "agregar todas".
- Hora de recordatorio sugerida.
- Tema oscuro, animaciones, fuentes personalizadas, nuevo ícono de app.
- Build de producción y publicación en Play Store.
- Check-in emocional, otras frecuencias, nube.

Cada uno, si llega, va en su propia spec.
