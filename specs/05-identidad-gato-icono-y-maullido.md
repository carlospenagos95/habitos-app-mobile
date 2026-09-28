# SPEC 05 — Identidad de gato: ícono, splash y notificación con maullido

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 04
> **Fecha:** 2026-09-27
> **Objetivo:** Reemplazar el ícono y splash por defecto de Expo por un gato calicó vectorial sobre azul cielo, y hacer que los recordatorios muestren una cara de gato y suenen con un maullido, entregado en un nuevo APK `preview`.

---

## Por qué existe esta spec

La app aún usa los assets de plantilla de Expo (`icon.png`, `android-icon-*.png`, `splash-icon.png`). El usuario quiere una identidad propia inspirada en su gata Murrunga (calicó, ojos verdes, collar morado con huellitas).

Los recordatorios de SPEC 01 usan el ícono y el sonido por defecto del sistema. Se quiere un ícono de cara de gato y un maullido llamativo.

Ícono, sonido de canal y splash son configuración nativa. Solo llegan al teléfono con un build nuevo. Se usa el perfil `preview` de SPEC 04.

En Android, el sonido de un canal de notificación no se puede cambiar después de creado. Por eso se crea un canal nuevo. El usuario elige hacer un reset manual de los datos de la app tras instalar, en lugar de migrar recordatorios por código.

---

## Alcance

**Dentro:**

- Script `scripts/gen-cat-icons.py` (Python 3.11 + Pillow, ya instalados) que dibuja el gato en vector plano y genera todos los PNG. Dibuja a 4× y reduce para antialiasing.
- Diseño del gato: cabeza calicó (blanco crema, parche naranja, parche gris), ojos verdes entrecerrados, nariz rosa, bigotes, collar morado con huellitas. Sin placa ni texto.
- Fondo del ícono: azul cielo `#87CEEB` con trama suave de huellitas.
- Ícono adaptativo Android: foreground (gato transparente), background (azul + trama), monochrome (silueta blanca para íconos temáticos Android 13+).
- `icon.png` 1024×1024 con fondo y gato combinados (fallback y web).
- `favicon.png` regenerado con el mismo gato.
- Splash: gato sobre azul cielo sólido `#87CEEB`.
- Ícono de notificación: silueta blanca de cara de gato sobre transparente, 96×96, tinte `#87CEEB`.
- Maullido real CC0 de freesound.org, recortado a ≤ 2 s, en `assets/sounds/maullido.wav`. Fuente y licencia en `assets/sounds/CREDITS.md`.
- Script `scripts/trim-meow.py` (stdlib `wave`, sin dependencias) que recorta, pasa a mono 44.1 kHz 16 bit y normaliza el WAV descargado.
- Canal Android nuevo `habitos-maullido` con sonido `maullido.wav`.
- `shouldPlaySound: true`: el maullido suena también con la app abierta.
- Nuevo build `eas build --profile preview --platform android` e instalación encima del APK de SPEC 04.
- Guía de reset manual de datos tras instalar.

**Fuera de alcance (para futuras specs):**

- Botón "Reiniciar datos" dentro de la app.
- Migración automática de recordatorios existentes al canal nuevo.
- Borrar por código el canal viejo `habitos-recordatorios`.
- Elegir sonido o desactivar el maullido desde la app.
- Maullido en los sonidos de la sesión de ejercicio (SPEC 03 queda igual).
- Cambiar nombre de la app, colores o tema de la UI interna.
- Limpiar los assets de plantilla de Expo que no se usan (`expo-logo.png`, `react-logo*.png`, etc.).
- Notificaciones push remotas (servidor, FCM). Los recordatorios siguen siendo locales.
- Build de iOS y publicación en Google Play.

---

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas ni migraciones SQLite. Solo cambia assets y configuración.

Assets generados:

| Archivo | Tamaño | Contenido |
| ------- | ------ | --------- |
| `assets/images/icon.png` | 1024×1024 | Fondo azul + trama + gato, sin transparencia |
| `assets/images/android-icon-foreground.png` | 1024×1024 | Gato sobre transparente, dentro del círculo seguro de 66 % |
| `assets/images/android-icon-background.png` | 1024×1024 | Azul `#87CEEB` + trama de huellitas en tono más claro |
| `assets/images/android-icon-monochrome.png` | 1024×1024 | Silueta blanca de la cabeza sobre transparente |
| `assets/images/splash-icon.png` | 1024×1024 | Gato sobre transparente |
| `assets/images/notification-icon.png` | 96×96 | Silueta blanca de cara de gato sobre transparente |
| `assets/images/favicon.png` | 48×48 | Igual que `icon.png` reducido |
| `assets/sounds/maullido.wav` | ≤ 2 s | Mono, 44.1 kHz, 16 bit, normalizado |
| `assets/sounds/CREDITS.md` | — | URL de freesound, autor, licencia CC0 |

Cambios en `app.json`:

```json
"adaptiveIcon": { "backgroundColor": "#87CEEB", "...": "mismas rutas" },

["expo-splash-screen", {
  "backgroundColor": "#87CEEB",
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200
}],

["expo-notifications", {
  "icon": "./assets/images/notification-icon.png",
  "color": "#87CEEB",
  "sounds": ["./assets/sounds/maullido.wav"]
}]
```

Cambios en `src/notifications.ts`:

```ts
const ANDROID_CHANNEL_ID = 'habitos-maullido';
// canal: name 'Recordatorios de hábitos', importance DEFAULT, sound: 'maullido.wav'
// handler: shouldPlaySound: true
// scheduleNotificationAsync content: sound: 'maullido.wav'
```

Conventions:

- Paleta del gato: crema `#F7E3C0`, naranja `#E08A3C`, gris `#6B5E5A`, ojos `#A8C94A`, collar `#7B3F8C`, contorno `#2B2522`.
- El nombre del sonido en el canal es el nombre de archivo con extensión (`maullido.wav`), como exige `expo-notifications`.
- El canal viejo `habitos-recordatorios` no se toca por código. Desaparece con el reset manual.

---

## Plan de implementación

1. Crear `scripts/gen-cat-icons.py` que dibuja la cabeza del gato y genera los 7 PNG de la tabla. Prueba: `python scripts/gen-cat-icons.py` escribe los archivos; abrirlos y ver el gato legible a 48 px.
2. Descargar de freesound.org un maullido CC0 en WAV a `scripts/_tmp/`. Registrar URL, autor y licencia en `assets/sounds/CREDITS.md`. Si la descarga requiere cuenta, el usuario lo descarga a mano.
3. Crear `scripts/trim-meow.py` y generar `assets/sounds/maullido.wav`. Prueba: el archivo dura ≤ 2 s y se reproduce bien en el PC.
4. Actualizar `app.json`: `adaptiveIcon.backgroundColor`, config de `expo-splash-screen` y config de `expo-notifications` según el modelo. Prueba: `npx expo config --type public` muestra los valores sin errores.
5. Actualizar `src/notifications.ts`: canal `habitos-maullido` con sonido, `shouldPlaySound: true`, `sound` en el contenido. Prueba: `npx tsc --noEmit` sin errores.
6. Prueba local de prebuild: `npx expo prebuild --platform android --no-install` en una copia o con `--clean` descartado después. Verificar que `res/raw/maullido.wav` y `res/drawable*/notification_icon.png` existen. No commitear la carpeta `android/`.
7. Lanzar `eas build --profile preview --platform android`. Prueba: termina `finished` con `.apk` descargable.
8. Instalar el APK encima, hacer el reset manual y validar según la guía de abajo.
9. Generar un README.md con el contenido, arquitectura y caractersiticas de la App, cosntruidas hasta el momento

---

## Criterios de aceptación

- [X] `scripts/gen-cat-icons.py` regenera los 7 PNG sin errores.
- [X] Ningún asset de `app.json` apunta a imágenes de la plantilla de Expo.
- [X] `assets/sounds/maullido.wav` existe, dura ≤ 2 s y `CREDITS.md` indica licencia CC0 y URL de origen.
- [X] `npx tsc --noEmit` termina sin errores.
- [X] `eas build --profile preview --platform android` termina con éxito.
- [X] El APK se instala encima del anterior sin desinstalar.
- [X] En el launcher, el ícono es el gato calicó con collar morado sobre azul cielo con huellitas.
- [X] Con íconos temáticos activados (Android 13+), se ve la silueta del gato.
- [X] Al abrir la app, el splash muestra el gato sobre azul cielo.
- [X] Tras el reset manual, Ajustes > Apps > Buenos Hábitos > Notificaciones muestra solo el canal "Recordatorios de hábitos" nuevo.
- [X] Un recordatorio programado a +2 min con la app cerrada suena con el maullido.
- [X] Ese recordatorio muestra la cara de gato en la barra de estado.
- [X] Un recordatorio que llega con la app abierta también maúlla.
- [X] La sesión de ejercicio de SPEC 03 sigue usando `trabajo.wav` y `descanso.wav`.

---

## Decisiones

- **Sí:** gato vectorial plano dibujado por script. Limpio a tamaño pequeño y reproducible.
- **No:** recortar `murrungaGPT.png`. Mucho detalle, pierde legibilidad a 48 px.
- **No:** placa "MURRUNGA" en el ícono. Ilegible en el launcher.
- **Sí:** Python + Pillow para generar PNG. Ya instalado; Node no tiene rasterizador sin dependencias nuevas.
- **Sí:** azul cielo `#87CEEB` con trama de huellitas en el ícono. Elección del usuario.
- **No:** trama en el splash. Android 12+ solo muestra ícono centrado sobre color sólido.
- **Sí:** maullido real CC0. Suena natural y no exige atribución.
- **No:** maullido sintetizado. Suena artificial.
- **Sí:** canal nuevo `habitos-maullido`. Android no permite cambiar el sonido de un canal existente.
- **Sí:** reset manual de datos tras instalar. Elección del usuario; evita código de migración.
- **No:** reprogramar recordatorios por código al arrancar. Innecesario con el reset.
- **No:** botón de reset en la app. Otra spec si llega.
- **Sí:** `shouldPlaySound: true`. El maullido suena también en primer plano.
- **Sí:** mismo tinte `#87CEEB` en la notificación. Coherente con el ícono.
- **Sí:** perfil `preview` de SPEC 04. Ícono, sonido y splash son nativos y requieren build.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El reset manual borra hábitos, registros y rachas | Aceptado por el usuario. Se hace una sola vez tras instalar. |
| Si no se hace el reset, los recordatorios viejos siguen en el canal sin maullido | Editar la hora del hábito lo reprograma en el canal nuevo. Documentado en la guía. |
| Freesound exige cuenta para descargar el WAV original | El usuario lo descarga a mano a `scripts/_tmp/` y el script lo procesa. |
| El WAV descargado es estéreo, 48 kHz o 24 bit | `trim-meow.py` convierte a mono 44.1 kHz 16 bit. Si es MP3/OGG, pedir la versión WAV. |
| El launcher muestra el ícono viejo en caché | Reiniciar el launcher o el teléfono. |
| Tinte azul cielo con poco contraste en barra clara | Aceptado; la silueta blanca se ve igual en la sombra de notificaciones. |
| Canal con importancia `DEFAULT` silenciado por "No molestar" | Comportamiento esperado del sistema. No se sube a `HIGH`. |

---

## Guía: instalar y resetear

1. `eas build --profile preview --platform android`.
2. Abrir el enlace o QR en el teléfono, descargar e instalar encima.
3. Ajustes > Apps > Buenos Hábitos > Almacenamiento > **Borrar datos**. Esto elimina hábitos, registros y canales viejos.
4. Abrir la app, aceptar el permiso de notificaciones y recrear los hábitos.
5. Crear un hábito con recordatorio a +2 min, cerrar la app y esperar el maullido.
6. Si se prefiere no borrar datos: saltar el paso 3 y editar la hora de cada hábito con recordatorio para pasarlo al canal nuevo.

---

## Qué **no** está en esta spec

- Botón de reset en la app.
- Migración automática de recordatorios.
- Selector de sonido o desactivar maullido.
- Cambios en sonidos de la sesión de ejercicio.
- Limpieza de assets de plantilla de Expo.
- Push remoto, iOS, Google Play.

Cada uno de esos, si llega, va en su propia spec.
