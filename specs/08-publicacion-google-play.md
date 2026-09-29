# SPEC 08 — Publicación en Google Play

> **Estado:** Borrador
> **Depende de:** SPEC 04, SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-09-28
> **Objetivo:** Publicar "Buenos Hábitos" gratis y sin anuncios en Google Play, en producción y para todos los países, a partir de un AAB generado con un nuevo perfil `production` de EAS.

---

## Por qué existe esta spec

SPEC 04 dejó fuera la publicación en Google Play. Hoy la app solo se instala como APK `preview` desde el enlace de EAS.

Se evaluó poner un banner de AdMob para obtener algún ingreso. Se descartó (ver Decisiones). La app se publica gratis, sin anuncios y sin recoger datos.

La cuenta de Play Console es personal. Google exige a las cuentas personales nuevas una prueba cerrada con al menos 12 testers durante 14 días seguidos antes de pedir acceso a producción. El usuario ya tiene 12 o más testers.

Play re-firma la app con su propia clave (Play App Signing). La versión de Play no se puede instalar encima del APK `preview`. El usuario acepta desinstalar el APK `preview` de su teléfono y perder sus datos.

---

## Alcance

**Dentro:**

- Perfil `production` en `eas.json`: AAB (`app-bundle`) con `autoIncrement: true`.
- Build `eas build --profile production --platform android` en la nube.
- Firma: el keystore de EAS actúa como clave de subida; Play App Signing con clave generada por Google.
- Política de privacidad en `docs/privacidad.md`, publicada con GitHub Pages desde `main` → `/docs`. El repo `carlospenagos95/habitos-app-mobile` es público.
- Textos de la ficha en `store/ficha-play.md`: nombre, descripción corta (≤ 80 caracteres), descripción larga (≤ 4000), en español.
- `scripts/gen-cat-icons.py` genera además `store/icon-512.png` (512×512) y `store/feature-graphic.png` (1024×500).
- 4 capturas de pantalla tomadas a mano en el teléfono y guardadas en `store/capturas/`.
- Revisión de los permisos del manifiesto final (prebuild local, sin commitear `android/`).
- Formularios de Play Console: acceso a la app, anuncios (no), clasificación de contenido IARC, público objetivo 18+, seguridad de los datos (no recoge ni comparte), declaración de apps de salud, categoría Salud y bienestar, correo de contacto.
- Subida manual del AAB: pista de prueba interna → prueba cerrada (12+ testers, 14 días) → solicitud de acceso a producción → lanzamiento en producción.
- Distribución en todos los países, gratis.
- Correo de contacto público: `carlos.penagos.software.95@gmail.com`.
- Actualizar `README.md`: perfil `production` y SPEC 07 en la tabla de specs.

**Fuera de alcance (para futuras specs):**

- Anuncios (AdMob), compras dentro de la app, botón "Quitar anuncios" o donaciones.
- `eas submit` y cuenta de servicio de Google Cloud.
- Actualizaciones OTA (EAS Update).
- Traducir la app o la ficha a otros idiomas.
- Respaldo o exportación de datos antes de desinstalar el APK `preview`.
- Build y publicación en iOS.
- Página web de la app más allá de la política de privacidad.
- Cambios de funcionalidad o de interfaz.

---

## Modelo de datos

Esta feature no introduce estructuras de datos ni migraciones SQLite. Solo añade configuración, documentos y gráficos de la tienda.

Cambio en `eas.json` (los perfiles existentes no cambian):

```json
"production": {
  "autoIncrement": true,
  "android": { "buildType": "app-bundle" }
}
```

Archivos nuevos:

| Archivo | Contenido |
| ------- | --------- |
| `docs/privacidad.md` | Política de privacidad en español: sin recogida de datos, datos solo en el teléfono, permisos usados (notificaciones, vibración), sin anuncios ni analítica, correo de contacto, fecha |
| `store/ficha-play.md` | Nombre, descripción corta, descripción larga, categoría, correo, URL de privacidad, respuestas previstas de los formularios |
| `store/icon-512.png` | Ícono 512×512, 32 bits, fondo azul con gato, sin transparencia |
| `store/feature-graphic.png` | 1024×500, azul cielo con trama de huellitas, gato y texto "Buenos Hábitos" |
| `store/capturas/01-hoy.png` | Captura de la pestaña Hoy |
| `store/capturas/02-areas.png` | Captura de Áreas o detalle de un área |
| `store/capturas/03-ejercicio.png` | Captura de la sesión guiada de ejercicio |
| `store/capturas/04-progreso.png` | Captura de Progreso |

Convenciones:

- URL de privacidad: `https://carlospenagos95.github.io/habitos-app-mobile/privacidad.html`.
- `version` sigue en `1.0.0`. `versionCode` lo gestiona EAS en remoto y lo comparten los perfiles `preview` y `production`.
- Package `com.buenoshabitos.app` sin cambios. Una vez publicado en Play ya no se puede cambiar.
- Permisos esperados en el manifiesto final: `VIBRATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `INTERNET` (de Expo). No deben aparecer `AD_ID`, `RECORD_AUDIO` ni `USE_EXACT_ALARM`.

---

## Plan de implementación

1. Añadir el perfil `production` en `eas.json`. Prueba: `eas config --profile production --platform android` sin errores.
2. Crear `docs/privacidad.md` y activar GitHub Pages (`main`, carpeta `/docs`). Prueba: la URL de privacidad abre en el navegador del teléfono.
3. Crear `store/ficha-play.md` con los textos. Prueba: descripción corta ≤ 80 caracteres y larga ≤ 4000.
4. Ampliar `scripts/gen-cat-icons.py` para generar `store/icon-512.png` y `store/feature-graphic.png`. Prueba: el script regenera todos los PNG anteriores sin cambios visibles más los 2 nuevos, con las medidas exactas.
5. Prebuild local (`npx expo prebuild --platform android --no-install`) y revisar los permisos de `android/app/src/main/AndroidManifest.xml`. Si aparece un permiso no esperado, bloquearlo con `android.blockedPermissions` en `app.json`. Borrar `android/` después; no se commitea.
6. Lanzar `eas build --profile production --platform android`. Prueba: termina `finished` con un `.aab` descargable.
7. En Play Console: crear la app (nombre "Buenos Hábitos", español, app, gratis), aceptar Play App Signing y completar todos los formularios de la sección "Configurar la app".
8. Crear la ficha principal de la tienda con los textos de `store/ficha-play.md`, el ícono, el gráfico destacado y las 4 capturas.
9. Subir el `.aab` a la pista de prueba interna. Desinstalar el APK `preview` del teléfono e instalar desde el enlace de prueba interna. Validar según la guía.
10. Promover la versión a prueba cerrada con la lista de 12+ testers. Esperar 14 días seguidos con los testers inscritos.
11. Solicitar acceso a producción y responder el cuestionario de Play Console. Esperar la aprobación.
12. Lanzar la versión en producción, en todos los países. Prueba: la app aparece al buscarla en Play Store desde un teléfono que no es tester.
13. Actualizar `README.md` con el perfil `production` y la fila de SPEC 07.

---

## Criterios de aceptación

- [ ] `eas.json` contiene el perfil `production` con `android.buildType: "app-bundle"` y `autoIncrement: true`.
- [ ] Los perfiles `development` y `preview` quedan sin cambios.
- [ ] La URL de privacidad responde y muestra la política en español con el correo de contacto.
- [ ] `store/ficha-play.md` existe; descripción corta ≤ 80 caracteres y larga ≤ 4000.
- [ ] `store/icon-512.png` mide 512×512 y `store/feature-graphic.png` mide 1024×500.
- [ ] `store/capturas/` contiene las 4 capturas.
- [ ] El manifiesto final no incluye `AD_ID`, `RECORD_AUDIO` ni `USE_EXACT_ALARM`.
- [ ] `eas build --profile production --platform android` termina con éxito y entrega un `.aab`.
- [ ] Play Console muestra todos los pasos de "Configurar la app" completos.
- [ ] La sección de seguridad de los datos declara que la app no recoge ni comparte datos.
- [ ] La app está declarada sin anuncios, público objetivo 18+ y categoría Salud y bienestar.
- [ ] La versión de prueba interna se instala en el teléfono del usuario tras desinstalar el APK `preview`.
- [ ] En esa instalación: el ícono y el splash son el gato, marcar un hábito persiste, un recordatorio a +2 min maúlla con la app cerrada y la sesión de ejercicio suena, vibra y mantiene la pantalla encendida.
- [ ] La prueba cerrada tiene al menos 12 testers inscritos durante 14 días seguidos.
- [ ] Google aprueba el acceso a producción.
- [ ] La app aparece en Play Store al buscarla desde un teléfono que no es tester y se instala.
- [ ] `README.md` lista el perfil `production` y SPEC 07.

---

## Decisiones

- **No:** banner de AdMob. Estimación: ~US$2–4 al mes con 100 usuarios diarios, ~US$20–40 con 1.000. AdMob paga a partir de US$100 acumulados. Además rompe la promesa "los datos viven solo en el teléfono" (ID de publicidad), exige consentimiento UMP para usuarios de la UE (España) y red para cargar. El costo no compensa.
- **No:** compra "Quitar anuncios" ni donaciones. Descartado junto con el banner.
- **Sí:** app gratis, sin anuncios ni analítica. La seguridad de los datos declara "no recoge datos".
- **Sí:** AAB en perfil `production`. Play exige AAB; se reserva `production` para la tienda, como decidió SPEC 04.
- **Sí:** Play App Signing con el keystore de EAS como clave de subida. Es el flujo por defecto y Google guarda la clave de firma.
- **Sí:** subida manual en Play Console. La primera subida tiene que ser manual de todos modos.
- **No:** `eas submit` por ahora. Exige cuenta de servicio de Google Cloud; queda para otra spec.
- **Sí:** política de privacidad en GitHub Pages del repo. Versionada con el código; el repo ya es público.
- **Sí:** todos los países, ficha solo en español. Sin costo extra y sin datos personales que regular.
- **Sí:** Salud y bienestar, 18+. Encaja con la rutina de ejercicio; 18+ evita la política de Familias.
- **Sí:** textos de la ficha en `store/ficha-play.md`. Versionados junto a los gráficos.
- **Sí:** gráficos de tienda generados por `gen-cat-icons.py`; capturas a mano. Reutiliza el dibujo del gato de SPEC 05.
- **Sí:** correo de contacto público `carlos.penagos.software.95@gmail.com`. Elección del usuario.
- **Sí:** desinstalar el APK `preview` y pasar a la versión de Play, perdiendo los datos. Elección del usuario; evita una spec de respaldo previa.
- **Sí:** prueba interna antes de la cerrada. Permite validar el AAB firmado por Google en el teléfono sin esperar revisión.
- **No:** depender de las specs 06 en borrador. Si se implementan antes del paso 6, el build `production` las incluye.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Un tester se sale antes de los 14 días y el conteo baja de 12 | Invitar a 14–15 testers. El conteo de 14 días exige 12 inscritos de forma continua. |
| Google rechaza el acceso a producción | Responder el cuestionario con detalle (cómo se probó, qué se corrigió). Repetir tras más días de prueba si lo pide. |
| El package `com.buenoshabitos.app` ya existe en Play | Play Console avisa al crear la app. Si pasa, detener y decidir un package nuevo en esta spec antes de seguir. |
| Aparece un permiso no esperado (`AD_ID`, alarmas exactas) en el manifiesto | Bloquearlo con `android.blockedPermissions`. Si es `SCHEDULE_EXACT_ALARM`, verificar que los recordatorios diarios siguen funcionando sin él. |
| La declaración de apps de salud o la clasificación de contenido marcan la app para revisión extra | Declarar solo fitness y hábitos, sin datos médicos. Aceptado un retraso de revisión. |
| El usuario pierde sus hábitos y rachas al desinstalar el APK `preview` | Aceptado por el usuario. Los recrea en la versión de Play. |
| Volver a instalar un APK `preview` en el mismo teléfono | No se instala encima de la versión de Play (firma distinta). Hay que desinstalar la de Play. |
| Verificación de identidad de la cuenta pendiente | Completarla en Play Console antes del paso 7; bloquea la publicación. |
| La política de privacidad queda desactualizada si una spec futura añade red o datos | Toda spec que recoja datos debe actualizar `docs/privacidad.md` y la seguridad de los datos. |

---

## Guía: de AAB a producción

1. `eas build --profile production --platform android` y descargar el `.aab` desde expo.dev → Builds.
2. Play Console → Crear app: "Buenos Hábitos", español, app, gratis. Aceptar las declaraciones.
3. Panel → Configurar la app: acceso (sin login), anuncios (no), clasificación de contenido, público objetivo (18+), seguridad de los datos (no recoge ni comparte), apps de salud, categoría Salud y bienestar, correo y URL de privacidad.
4. Ficha principal: copiar los textos de `store/ficha-play.md` y subir el ícono, el gráfico destacado y las capturas de `store/`.
5. Pruebas → Prueba interna: crear versión, subir el `.aab`, añadir tu correo como tester.
6. En el teléfono: desinstalar la app `preview`, abrir el enlace de prueba interna e instalar desde Play. Validar hábitos, recordatorio con maullido y sesión de ejercicio.
7. Pruebas → Prueba cerrada: crear pista, lista de correos con 12+ testers, promover la versión. Compartir el enlace de inscripción.
8. Esperar 14 días seguidos con 12+ testers inscritos.
9. Panel → Solicitar acceso a producción. Responder el cuestionario.
10. Tras la aprobación: Producción → crear versión con el mismo `.aab` (o uno nuevo), países: todos. Enviar a revisión.
11. Para versiones futuras: nuevo build `production`, subirlo a producción. `versionCode` sube solo.

---

## Qué **no** está en esta spec

- Anuncios, compras dentro de la app o donaciones.
- `eas submit` automatizado.
- Actualizaciones OTA.
- Traducciones de la app o la ficha.
- Respaldo de datos antes de migrar a la versión de Play.
- iOS.

Cada uno de esos, si llega, va en su propia spec.
