# Registro de cambios

## 1.4.0 · 2026-11-16

- Servicios de estética: precio por zona y por sesión con historial de cambios.
- Tratamientos: abonos, saldo por cobrar, abonado por adelantado, sesiones pendientes y su valor.
- Productos: catálogo con foto y precio; ventas por paciente, pagadas o por cobrar.
- Indicadores: panel de valores mensual, trimestral y anual con proyección de citas reservadas, tabla por servicio, productos más vendidos y precios vigentes.
- Límites: no descuenta inventario, no emite recibos ni facturas, y las cirugías no entran en este panel (siguen en propuestas). Probado solo con datos ficticios.

## 1.3.1 · 2026-11-16

- Instalación: botón «Instalar en este equipo» cuando el navegador lo ofrece; instrucciones para iPhone, iPad y Android; aviso cuando se abre en una vista previa donde no se puede instalar. Probado con el evento simulado; la instalación real en equipos físicos sigue pendiente de validar.
- Servicios de estética: precio de referencia por sesión en el catálogo, valor en cada sesión y total por servicio en el panel de indicadores (no es registro de pagos).

## 1.3.0 · 2026-11-16

- Vista de consulta (botón en la barra): oculta Acompañamiento, base de contactos, indicadores, etapa comercial, seguimiento, recordatorios, respaldos y ajustes. Se conserva al recargar.
- «Prospección» pasa a llamarse «Acompañamiento».
- Base de contactos unificada con filtros y exportación a Excel; importación masiva desde Excel, CSV o texto pegado con control de repetidos.
- Panel de indicadores con conversión de la base, servicios consumidos, procedimientos más consultados, género y país.
- Pestaña «Estrategia y SEO» con lista de posicionamiento local e internacional.
- Género, país y ciudad en ficha e intereses. El embudo muestra 15 tarjetas por columna y remite a la base.
- Pendiente de validar: importación con archivos reales de la clínica (solo se probó con datos ficticios, incluidos 300 contactos de prueba); pantallas nuevas en iPhone y iPad físicos.

## 1.2.0 · 2026-11-16

### Nuevo
- **Prospección** como sección principal: embudo con intereses y oportunidades, registro de contactos, «Agendar valoración» desde un interés, enlaces de campaña a WhatsApp con referencia, plantillas de mensaje y resultados por fuente o campaña.
- **Tratamientos estéticos** por paciente: láser diodo, toxina botulínica y limpieza facial de fábrica; catálogo de servicios editable (zonas, sesiones, intervalo, tipo de registro). Registro de cada sesión con sus parámetros, cita tentativa para la siguiente y tablero de tratamientos en curso.
- **Recordatorios de tratamientos** en «Hoy» y en la Agenda, con mensaje listo para WhatsApp y respeto de la preferencia de contacto.
- **Contenido para redes:** plan editorial, ideas, detección de expresiones de riesgo, verificación en cuatro puntos y piezas antes/después en tres formatos, condicionadas a la autorización de difusión pública. Paquete con imagen, texto y verificación.
- **Calendarios:** enlaces «añadir a» Google, Outlook y Office 365; exportación de toda la agenda en `.ics`; importación de un `.ics` externo como bloqueos (con repeticiones simples).
- **Aplicación instalable** (manifiesto, íconos y funcionamiento sin conexión).
- **Carpeta compartida** con archivos cifrados por caso, detección de conflictos y copia de recuperación.

### Cambiado
- La navegación tiene cinco destinos: Hoy, Pacientes, Prospección, Agenda y Más.
- La ficha suma la pestaña «Tratamientos estéticos».
- El respaldo completo incluye campañas y publicaciones.
- Cualquier cambio en fotos o documentos actualiza la fecha de modificación del caso.

### Sin cambios de formato
El esquema de datos sigue en 3. Los paquetes `.yhcase` y `.yhbackup` de la versión 1.1 se abren igual.

### No incluido
Sincronización en la nube en tiempo real, envío automático de mensajes, conexión directa con las cuentas de Google, Microsoft o Apple, publicación automática en redes, aplicación en tiendas (App Store, Microsoft Store) y registro de pagos.

## 1.1.0-R6 · 2026-11-16

Evolución de la versión 2 según el Encargo Maestro R6. El motor de simulación WebGL, los módulos, el catálogo y los tiempos quirúrgicos se conservan sin cambios de comportamiento.

### Nuevo
- Navegación por tareas: Hoy, Pacientes, Agenda y Más. Ficha con Resumen, Fotos y simulaciones, Visitas y evolución, Propuestas y decisiones, y Documentos.
- Flujo «Nueva valoración» con autorizaciones, regiones y tres caminos: tomar, importar o combinar.
- Plan de captura por región con vistas deduplicadas, captura guiada, bandeja «Por clasificar» y pausa con reanudación.
- Visitas: cada foto pertenece a una atención con fecha propia. Etapa consulta, preoperatoria o posoperatoria real.
- Fecha de toma separada de la fecha de carga; lectura de EXIF como propuesta; «Sin fecha de toma confirmada» cuando no se conoce.
- Capas de censura (círculo, rectángulo; sólido, pixelado, difuminado) y exportación con censura aplanada.
- Descargas: original, simulación, comparación y ZIP con manifiesto, con nombres sin datos personales.
- Alternativas A/B/C/D por foto. Deshacer y rehacer unificado para deslizadores, puntos, pincel y censura.
- Módulos sugeridos según encuadre y vista. Ajuste de puntos y máscaras con botones, sin arrastrar.
- Citas con estados, reprogramación con historial, aviso de cruce, exportación `.ics` y bloqueos administrativos.
- Episodios de tratamiento, registro explícito de procedimiento realizado y plantilla opcional de controles.
- Oportunidades con etapa, fecha deseada con granularidad (mes, quincena, rango, fecha), siguiente paso y preferencia de contacto.
- Propuestas versionadas: borrador, emitida, entregada, aceptada, rechazada, caducada, sustituida. PDF emitido inmutable.
- Tareas de seguimiento acordadas y borrador de mensaje para envío manual.
- Registro de interés inicial sin ficha clínica y conversión a paciente.
- Documentos adjuntos con validación por contenido, categorías, versiones y huella SHA-256.
- Biblioteca de casos para consulta, condicionada a autorización vigente.
- Indicadores con periodo, fórmula y denominador.
- Paquetes cifrados `.yhcase` y `.yhbackup` (AES-256-GCM, PBKDF2), importación con vista previa, conflictos y escritura atómica.
- Copia de recuperación al reemplazar un caso.
- Un solo `index.html` sin CDN: fuentes y librerías embebidas.

### Cambiado
- El indicador de guardado tiene estados reales: cambios sin guardar, guardando, guardado en este dispositivo, error y modo temporal.
- Guardado con un temporizador por entidad. Corrige una condición de carrera al alternar fotos.
- El estado único de la paciente se separa en estado de atención y etapa de la oportunidad.
- «Presentar» oculta toda la interfaz interna y añade «Ocultar».
- El PDF rotula «Antes» y «Simulación ilustrativa», distingue lo deseado, tentativo, programado y realizado, y elimina las líneas de firma.
- La copia de trabajo de las fotos sube de 1500 a 2000 px.
- La foto se ajusta al área libre sobre los controles; en móvil el editor oculta la navegación.

### Migración desde la versión 2
- Automática, aditiva y en una sola transacción. Se guarda una copia previa de los registros.
- `status`, `date`, `nextDate` y el historial antiguo se conservan. La etapa queda como «dato heredado por revisar»; la fecha estimada pasa a tentativa; el próximo contacto pasa a tarea por revisar.
- No se inventan visitas, citas ni cirugías. Las fotos antiguas quedan sin fecha de toma confirmada y con su vista propuesta por confirmar.

### Retirado
- Respaldo JSON sin cifrar. Se puede importar el de la versión anterior, pero ya no se exporta.
- Clasificación automática de la vista por la orientación de la imagen.

### No incluido en esta versión
Estudio de contenido para redes, anotaciones sobre la foto, ajustes preestablecidos, visor de PDF integrado, calendario con rejilla horaria y arrastre, tablero tipo kanban, fusión selectiva al importar, bloqueo por PIN, usuarios y roles, sincronización entre equipos y registro de pagos.
