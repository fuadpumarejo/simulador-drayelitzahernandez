# Simulador SKIND · Dra. Yelitza Hernández

Herramienta web para acompañar la consulta de cirugía plástica y estética: registrar a la paciente, tomar o importar fotografías por región y vista, simular sobre fotos 2D, proteger zonas sensibles, armar la propuesta y dar seguimiento a lo que la paciente acuerde. Funciona en computador, iPhone y iPad desde el navegador.

Versión **1.2.0** · esquema de datos 3 · evolución de la versión 2 (se conserva en `legacy/`).

> Es una herramienta de apoyo visual. Las simulaciones son ilustrativas: no predicen ni garantizan un resultado. No es un dispositivo médico certificado ni una historia clínica electrónica.

## Publicar en GitHub Pages

La herramienta completa es **`index.html`**, sin CDN: las fuentes y las librerías van dentro. Para que además se pueda **instalar como aplicación** y abrir sin conexión, sube junto a él `manifest.webmanifest`, `sw.js` y la carpeta `icons/`.

1. Sube el contenido de esta carpeta a la raíz del repositorio, reemplazando lo anterior.
2. *Settings → Pages → Deploy from a branch → `main` / `(root)`*.
3. Abre la dirección que muestra esa pantalla.

**Mantén siempre la misma dirección.** Los datos viven en el navegador y están atados a ella: si cambias de dominio o de carpeta, la herramienta abre vacía (los datos siguen en la dirección anterior). Al abrir esta versión sobre la dirección donde estaba la versión 2, los datos existentes se migran solos y sin borrar nada.

Un sitio de GitHub Pages es público para quien tenga el enlace, aunque el repositorio sea privado. Lo que se publica es la herramienta vacía; los datos de pacientes nunca salen del navegador.

## Qué hace

- **Hoy:** citas del día, capturas en preparación, pendientes acordados y «continuar donde quedó».
- **Nueva valoración:** registro mínimo y autorizaciones → regiones → tomar, importar o combinar → lista para valoración.
- **Captura guiada:** una vista por pantalla, con esquema de posición, repetir, aceptar, omitir y pausar. Las vistas que sirven a dos regiones se toman una vez.
- **Fotos y simulaciones:** galería por visita, editor WebGL con módulos sugeridos según la vista, pincel, alternativas A/B/C, deshacer y rehacer, y modo «Presentar».
- **Censura:** círculos y rectángulos editables que cubren original y simulación. En todo archivo que sale, quedan aplanados sobre los píxeles.
- **Visitas y evolución:** citas, atenciones realizadas, episodios de tratamiento, controles y línea de tiempo.
- **Propuestas y decisiones:** oportunidad por paciente, fecha deseada con su precisión real, versiones de propuesta con PDF inmutable y tareas de seguimiento solo si se pactaron.
- **Agenda:** lista, día, semana y mes; capas; fechas tentativas punteadas que no bloquean; exportación `.ics` con asunto neutro.
- **Documentos:** PDF, JPG y PNG adjuntos al caso, con categoría, versión y huella.
- **Transferencia entre equipos:** caso editable `.yhcase` y respaldo completo `.yhbackup`, cifrados con contraseña.

## Novedades de la versión 1.4

- **Precios de estética:** precio por zona (axilas, bikini, bozo…) y por sesión en cada servicio, con historial de cambios. La sesión de un plan vale la suma de sus zonas.
- **Abonos y saldos:** en cada tratamiento se registran abonos; la ficha muestra valor por sesión, realizado, abonado, saldo por cobrar o abonado por adelantado, y sesiones pendientes con su valor.
- **Productos:** catálogo con foto, descripción, presentación y precio (Más → Productos); las ventas se registran en la ficha de cada paciente (pestaña «Estética y productos»).
- **Panel de valores:** vista mensual, trimestral o anual con sesiones realizadas, productos vendidos, abonos, citas reservadas como proyección, sesiones pendientes, productos más vendidos y precios vigentes.
- Es un control interno de gestión: no es contabilidad, facturación ni inventario.

## Novedades de la versión 1.3

- **1.3.1:** botón «Instalar en este equipo» donde el navegador lo permite (Android, Windows y Mac con Chrome o Edge); pasos precisos para iPhone y iPad, donde Apple solo permite instalar desde el menú Compartir de Safari. Precio de referencia por servicio de estética, valor por sesión y total por servicio en el panel.
- **Vista de consulta:** un botón en la barra superior oculta lo administrativo y comercial (Acompañamiento, base de contactos, indicadores, etapa comercial, seguimiento, respaldos y ajustes) mientras la paciente ve la pantalla. Se sale con el mismo botón. No oculta los nombres de otras pacientes en Hoy, Pacientes y Agenda: conviene abrir la ficha antes de girar la pantalla.
- **«Prospección» ahora se llama «Acompañamiento»** en toda la interfaz.
- **Base de contactos:** pacientes con ficha e intereses sin ficha en una sola lista, con teléfono, correo, género, país, lo que consideran y lo que ya se hicieron. Filtros por tipo de servicio, procedimiento, género, país y servicio realizado; exporta lo filtrado a Excel.
- **Importar contactos:** desde Excel, CSV o una lista pegada (por ejemplo, quienes han escrito por WhatsApp). Omite repetidos por teléfono y no presume autorización para mensajes promocionales.
- **Panel de indicadores:** conversión de la base (con ficha, con valoración, con servicio), servicios que consumen quienes ya son pacientes, procedimientos más consultados, sesiones del periodo, género y país.
- **Estrategia y SEO:** lista de trabajo de posicionamiento local e internacional, con avance guardado.
- Género, país y ciudad en la ficha y en cada interés.

## Novedades de la versión 1.2

- **Prospección:** embudo desde el primer interés hasta la cirugía programada, enlaces de campaña a WhatsApp con referencia, plantillas de mensaje y resultados por fuente.
- **Tratamientos estéticos por sesiones:** láser diodo, toxina botulínica, limpieza facial y los servicios que se agreguen; zonas, número de sesión, parámetros, próxima fecha y recordatorios.
- **Recordatorios periódicos:** «Hoy» muestra a quién le corresponde su próxima sesión o control; el mensaje se abre en WhatsApp para enviarlo con un toque. No hay envíos automáticos.
- **Contenido para redes:** plan de publicaciones, ideas, revisión del texto y piezas antes/después en 1:1, 4:5 y 9:16, solo con autorización de difusión.
- **Calendarios externos:** cada cita se lleva a Google, Outlook, Office 365 o al calendario del iPhone; la agenda completa se exporta en un `.ics`; y un calendario externo se puede traer como «ocupado».
- **Aplicación instalable:** en iPhone y iPad (Añadir a pantalla de inicio), Windows y Mac (Instalar desde Chrome o Edge). Funciona sin conexión.
- **Carpeta compartida:** en Chrome o Edge de escritorio, los casos se mantienen al día, cifrados, en una carpeta de iCloud Drive, OneDrive, Google Drive o Dropbox.

### Qué se puede y qué no en sincronización

| Situación | Cómo queda |
|---|---|
| Dos computadores (Windows o Mac, Chrome o Edge) | Carpeta compartida: automático, con aviso si ambos cambian el mismo caso |
| iPhone o iPad ↔ computador | Exportar el caso a esa misma carpeta desde «Archivos» e importarlo desde ella. Sin cables, pero con dos toques |
| Celular y computador siempre iguales, sin hacer nada | No disponible: requiere un servidor con usuarios y un acuerdo de tratamiento de datos de salud |
| Calendario de Google, Outlook o iPhone | Enlaces y archivos `.ics` en ambos sentidos. No es sincronización en vivo |
| Envío automático de recordatorios | No disponible: los mensajes se preparan y una persona los envía |

## Tres archivos distintos

| Archivo | Para qué | ¿Se puede seguir editando? |
|---|---|---|
| `.yhcase` | Pasar **una paciente** a otro equipo | Sí, todo |
| `.yhbackup` | Respaldar o migrar **toda la base** | Sí, todo |
| JPG, ZIP, PDF | Entregar o archivar | No: son imágenes aplanadas |

No hay sincronización automática. Pasar un caso del celular al computador es exportar, mover el archivo e importar. Detalle en [`docs/MANUAL.md`](docs/MANUAL.md) y [`docs/FORMATO-YHCASE.md`](docs/FORMATO-YHCASE.md).

En `ejemplo/caso-ficticio.yhcase` hay un caso de muestra con una ilustración (no es una persona). Contraseña: `ejemplo-ficticio-2026`.

## Privacidad y límites que conviene conocer

- Los datos se guardan **solo en el navegador de cada equipo** (IndexedDB), sin cifrado en reposo. Quien abra ese navegador los ve: no hay usuarios ni contraseña de acceso.
- Borrar los datos del navegador, usar modo privado o que el sistema libere espacio puede eliminarlos. Hay que exportar respaldos protegidos con regularidad.
- El pixelado y el difuminado no garantizan anonimización. Para ocultar, usar el sólido opaco.
- La herramienta no envía mensajes, no publica en redes y no se conecta con calendarios externos.
- Antes de usar datos reales, validar con asesoría jurídica el manejo de datos de salud e imágenes (Ley 1581 de 2012 y normas aplicables). Este software no certifica cumplimiento.
- **No subir al repositorio** archivos `.yhcase`, `.yhbackup`, PDF, Excel ni fotos de pacientes. El `.gitignore` los excluye.

## Estado de las pruebas

174 verificaciones automatizadas con datos ficticios, todas aprobadas en Chrome. De las 120 pruebas del encargo: 93 aprobadas, 25 parciales, 1 pendiente de dispositivo real y 1 no implementada (registro de pagos). La instalación como aplicación y la carpeta compartida se probaron en el navegador de pruebas, no en equipos reales. **No se probó en iPhone ni iPad físicos ni con fotografías reales.** Matriz completa y protocolo de validación en [`docs/PRUEBAS.md`](docs/PRUEBAS.md).

## Estructura

```
index.html            herramienta completa (generada)
manifest.webmanifest  datos para instalarla como aplicación
sw.js                 funcionamiento sin conexión
icons/                íconos de la aplicación
src/                  código fuente: shell.html, css/app.css, js/*.js
vendor/               jsPDF 2.5.1, SheetJS 0.18.5, fflate 0.8.2, fuentes Marcellus y Albert Sans
build.py              arma index.html desde src/ y vendor/
tests/                seis suites Playwright con datos ficticios
docs/                 manual, formato de archivos, arquitectura, informe de UX, matriz de pruebas
ejemplo/              caso ficticio cifrado
legacy/               versión 2 original, intacta
```

Para modificar: edita `src/`, ejecuta `python3 build.py` y sube el nuevo `index.html`. Si cambias la versión, cambia también el nombre de caché en `sw.js`.

## Licencias de terceros

jsPDF (MIT), SheetJS Community Edition (Apache-2.0), fflate (MIT), Marcellus y Albert Sans (SIL OFL 1.1). El código propio no tiene licencia definida: todos los derechos reservados.
