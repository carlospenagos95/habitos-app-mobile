# SPEC 04 — APK autónomo con perfil `preview` de EAS

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-09-27
> **Objetivo:** Generar desde la cuenta de Expo (EAS Build) un APK de Android autónomo que se instala en el teléfono y funciona sin PC, sin Metro y sin Expo Go.

---

## Por qué existe esta spec

El development build de SPEC 02 es un APK que carga el JavaScript desde Metro (`npx expo start --dev-client`). Sin el PC encendido y en la misma red, la app no arranca.

Un build sin `developmentClient` empaqueta el bundle JS y los assets dentro del APK. Así la app funciona sola, igual que una app instalada desde una tienda.

Se hace con EAS Build en la nube, con la cuenta de Expo ya vinculada (`extra.eas.projectId` en `app.json`). El plan gratis alcanza. No requiere Android Studio ni SDK local.

---

## Alcance

**Dentro:**

- Perfil `preview` en `eas.json`: `distribution: "internal"`, `android.buildType: "apk"`, `autoIncrement: true`.
- Build en la nube: `eas build --profile preview --platform android`.
- Instalación del APK en el teléfono desde el enlace o QR que imprime EAS (o desde expo.dev → proyecto → Builds).
- El APK usa el mismo package `com.buenoshabitos.app` que el development build y lo reemplaza al instalarse encima.
- Validación en el APK de las funciones nativas existentes: SQLite, notificaciones, sonido, vibración y pantalla encendida.
- Guía paso a paso al final de esta spec.

**Fuera de alcance (para futuras specs):**

- Actualizaciones OTA con EAS Update (`expo-updates`, canales, `runtimeVersion`).
- Publicación en Google Play (AAB, perfil `production`, ficha de tienda).
- Convivencia de dev build y APK autónomo en el mismo teléfono (package distinto, `app.config.ts`).
- Build de iOS.
- Exportar o respaldar los datos SQLite.
- Scripts npm para lanzar builds.

---

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas. Reutiliza la base SQLite de SPEC 01–03 sin migraciones.

Único cambio de configuración, en `eas.json`:

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "autoIncrement": true,
      "android": { "buildType": "apk" }
    }
  }
}
```

Conventions:

- `versionCode` lo gestiona EAS en remoto (`appVersionSource: "remote"`) y sube en cada build `preview`.
- `version` (`1.0.0` en `app.json`) no cambia en esta spec.
- Los datos SQLite viven en el almacenamiento del package `com.buenoshabitos.app`. Se conservan al instalar encima si la firma coincide.

---

## Plan de implementación

1. Añadir el perfil `preview` en `eas.json` según el modelo de arriba. Prueba: `eas build:inspect --profile preview --platform android --stage pre-build` o `eas config --profile preview --platform android` no muestra errores.
2. Verificar credenciales: `eas credentials --platform android` muestra un único keystore del proyecto, compartido por `development` y `preview`. Si `preview` pidiera generar uno nuevo, detener y revisar (ver Riesgos).
3. Lanzar `eas build --profile preview --platform android`. Prueba: termina con estado `finished` y entrega enlace de descarga del `.apk`.
4. Con el development build instalado, abrir el enlace en el teléfono, descargar e instalar el APK encima. Prueba: Android instala como actualización, sin pedir desinstalar.
5. Validar la app en modo avión y con el PC apagado siguiendo la guía de abajo.

---

## Criterios de aceptación

- [X] `eas.json` contiene el perfil `preview` con `distribution: "internal"`, `autoIncrement: true` y `android.buildType: "apk"`.
- [X] El perfil `development` queda sin cambios.
- [X] `eas build --profile preview --platform android` termina con éxito en la cuenta de Expo.
- [X] El build aparece en expo.dev → proyecto `buenos-habitos` → Builds con un `.apk` descargable.
- [X] El `versionCode` del build `preview` es mayor que el del último development build.
- [X] El APK se instala encima del development build sin desinstalar.
- [X] Tras instalarlo, los hábitos y registros creados antes siguen presentes.
- [X] Con el PC apagado y el teléfono en modo avión, la app abre y muestra la pestaña Hoy.
- [X] La app no muestra la pantalla del dev launcher ni pide conectar con un servidor.
- [X] Marcar un hábito como hecho persiste tras cerrar y reabrir la app.
- [X] Un recordatorio programado a 2 minutos dispara la notificación con la app cerrada.
- [X] Una sesión de la rutina de SPEC 03 reproduce sonido, vibra y mantiene la pantalla encendida.
- [X] Las imágenes de ejercicios de SPEC 03 se ven sin conexión.

---

## Decisiones

- **Sí:** EAS Build en la nube con la cuenta de Expo. Ya está configurado y no requiere Android Studio.
- **No:** build local (`npx expo run:android --variant release` o `eas build --local`). Requiere SDK de Android y firma manual.
- **Sí:** perfil llamado `preview`. Es la convención de Expo para APK instalable de prueba.
- **No:** perfil `production` con APK. Se reserva `production` para un futuro AAB de Play Store.
- **Sí:** mismo package `com.buenoshabitos.app`; el APK reemplaza al dev build. Sin cambios de código y conserva los datos.
- **No:** package distinto para convivir. Exige migrar a `app.config.ts` y el APK arrancaría con datos vacíos.
- **Sí:** `autoIncrement: true` con versión remota. Cada build instala encima sin conflicto de `versionCode`.
- **No:** versionado manual. Riesgo de que Android rechace un APK con `versionCode` igual o menor.
- **No:** EAS Update (OTA). Cada cambio de JS requiere un build nuevo; se acepta por ahora.
- **Sí:** mantener `expo-dev-client` en dependencias. En builds sin `developmentClient` el launcher no se incluye.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El perfil `preview` usa un keystore distinto al de `development` | Revisar en el paso 2. Si difiere, Android exige desinstalar y se pierden los datos. Se acepta o se reutiliza el keystore existente desde `eas credentials`. |
| Volver al dev build para seguir desarrollando | Reinstalar el APK de `development` encima. Requiere `versionCode` mayor: se lanza un nuevo build `development` o se desinstala (perdiendo datos). |
| Cola lenta del plan gratis de EAS | Aceptado. El build solo se repite cuando se quiere una versión nueva en el teléfono. |
| Android bloquea instalar desde fuentes desconocidas | Permitir "Instalar apps desconocidas" para el navegador usado al descargar. |
| Cambios de JS no llegan al teléfono sin rebuild | Aceptado. OTA queda para otra spec. |

---

## Guía: generar e instalar el APK autónomo

1. `npm install -g eas-cli` (si no está) y `eas login` con la cuenta de Expo.
2. Confirmar el perfil `preview` en `eas.json`.
3. `eas build --profile preview --platform android` (compila en la nube, 10–20 min).
4. Al terminar, abrir en el teléfono el enlace o QR que imprime EAS. También está en expo.dev → proyecto → Builds.
5. Descargar el `.apk` y abrirlo. Si Android lo pide, permitir instalar apps desconocidas para el navegador.
6. Abrir "Buenos Hábitos". Ya no depende del PC ni de Expo Go.
7. Para una versión nueva: repetir desde el paso 3 e instalar encima.

---

## Qué **no** está en esta spec

- Actualizaciones OTA (EAS Update).
- Publicación en Google Play y perfil `production`.
- Convivencia de dev build y APK autónomo.
- Build de iOS.
- Respaldo o exportación de datos.

Cada uno de esos, si llega, va en su propia spec.
