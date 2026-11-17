# Registro de cambios

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
