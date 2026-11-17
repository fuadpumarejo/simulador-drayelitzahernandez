# Auditoría de la versión 2 y arquitectura de la versión R6

## 1. Qué había (auditoría)

Un solo `index.html` de 863 líneas y 109 KB, con jsPDF y SheetJS cargados desde cdnjs.

**Fortalezas conservadas**
- Motor WebGL de deformación de malla con separación de frecuencias para piel. Fluido y probado.
- 15 módulos paramétricos con puntos anatómicos y deslizadores. Catálogo de 32 procedimientos con tiempos.
- Vistas Antes, Dividir y Simulación; modo presentación; PDF y Excel.
- Interfaz en español con una identidad visual definida.

**Problemas encontrados**

| # | Hallazgo | Riesgo | Resolución en R6 |
|---|---|---|---|
| 1 | Un único temporizador de guardado para todo. El indicador decía «Guardado en este dispositivo» antes de que IndexedDB confirmara. | Pérdida de cambios al alternar fotos; confianza falsa | Cola con un temporizador por entidad y estados reales |
| 2 | Las fotos colgaban de la paciente, sin visita, fecha de toma ni vista confirmada. La vista se deducía de la orientación de la imagen. | Evolución imposible; clasificación errónea | Visitas, fecha de toma con origen, clasificación explícita |
| 3 | Importar el respaldo borraba toda la base antes de escribir. | Pérdida total si el archivo era incorrecto | Importación validada, con vista previa y transacción única |
| 4 | Respaldo en JSON sin cifrar con todas las fotos. | Exposición de datos sensibles | Paquetes cifrados; el JSON solo se puede importar |
| 5 | Un solo `status` mezclaba atención, propuesta y cirugía. `date` no distinguía deseada, tentativa, programada o realizada. | Indicadores falsos; fechas inventadas | Estado de atención, etapa de oportunidad, citas y episodios separados |
| 6 | Sin censura de zonas sensibles. | Exposición al presentar o compartir | Capas de privacidad y exportación redactada |
| 7 | Deshacer solo para el pincel. | Errores sin salida | Historial unificado por foto |
| 8 | «Presentar» dejaba visibles controles internos y no rotulaba la simulación. | Expectativas mal fundadas | Modo paciente con rótulo permanente |
| 9 | Dependencia de un CDN externo y de Google Fonts. | Sin red no exportaba; solicitudes a terceros | Todo embebido |
| 10 | Fotos reducidas a 1500 px sin avisar. | Pérdida de detalle | 2000 px, y se declara que es copia de trabajo |

## 2. Decisiones de arquitectura

- **Sigue siendo un sitio estático de un archivo.** Se edita en `src/` y `build.py` arma un `index.html` autocontenido. Es lo más simple de publicar en GitHub Pages y no depende de terceros.
- **Local primero, sin servidor.** No se simula sincronización. La continuidad entre equipos es una transferencia manual y explícita.
- **Motor intacto.** `30-engine.js` es el código original más dos funciones de instantánea para el historial. `20-catalog.js` es literal.
- **Migración aditiva.** Nada se borra ni se reinterpreta. Lo ambiguo queda marcado «por revisar».
- **Una fuente por dato.** La cita vive en la paciente; el calendario, «Hoy», la ficha y el PDF la leen de ahí. La línea de tiempo es una proyección, no una copia.

## 3. Módulos

| Archivo | Responsabilidad |
|---|---|
| `00-util.js` | Utilidades, diálogos accesibles, fechas civiles e instantes |
| `10-store.js` | IndexedDB v2, operaciones atómicas, cola de guardado |
| `20-catalog.js` | Catálogo y módulos de simulación (literal de la v2) |
| `30-engine.js` | Motor WebGL (v2 + instantáneas) |
| `40-model.js` | Dominio: visitas, citas, oportunidades, plan de captura, migración, agenda y línea de tiempo |
| `50-portable.js` | Contenedor cifrado, empaquetado, validación |
| `60-layers.js` | Censura, composición de imágenes de salida, lectura de archivos de imagen |
| `70-export.js` | Descargas, ZIP, PDF, Excel, `.ics`, exportar e importar |
| `80-app.js` | Estado, navegación, Hoy, Pacientes, ficha |
| `82-capture.js` | Nueva valoración y captura |
| `84-sim.js` | Galería y editor |
| `86-clinic.js` | Visitas, citas, agenda, documentos |
| `88-commerce.js` | Oportunidades, propuestas, tareas, indicadores |
| `90-more.js` | Biblioteca, indicadores, respaldos, ajustes, ayuda |
| `99-boot.js` | Eventos, migración y arranque |

## 4. Almacenamiento

IndexedDB `yh-simulador`, versión 2. La versión 1 tenía `kv`, `patients` y `photos`; la 2 agrega `docs` y `recovery` sin tocar las anteriores.

| Almacén | Contenido |
|---|---|
| `patients` | Ficha con sus colecciones embebidas |
| `photos` | Una foto por registro, con su estado editable. Índice por paciente |
| `docs` | Documentos adjuntos y PDF emitidos. Índice por paciente |
| `recovery` | Versión previa de un caso reemplazado |
| `kv` | Ajustes, intereses, bloqueos, biblioteca, último caso abierto, copia previa a la migración |

Las importaciones, restauraciones, eliminaciones de paciente y la migración usan una transacción multi-almacén: se aplican completas o no se aplican.

## 5. Modelo de datos (esquema 3)

**Paciente** `{id, schema, name, doc, birth, phone, email, notes, clinicalNotes, consents{data,photo,consult,public}, contact{channel,allowed,at,hist[]}, visits[], appts[], episodes[], opps[], tasks[], log[], legacy{…}, rev{hash,importedAt}}`

**Visita** (lo que ocurrió) `{id, type, date, dateSrc, phase, cap, regions[], slots[{id,frame,view,req,regions[],st,photoId,skip}], notes, apptId, episodeId}`

**Cita** (lo previsto) `{id, type, date, time, tz, dur, mode, prof, place, status, note, hist[{at,fromDate,fromTime,toDate,toTime,reason}], visitId, episodeId, oppId, seq, icsAt}`

**Episodio de tratamiento** `{id, name, status, plannedDate, performedAt, performedSrc, recordedAt, notes}`

**Oportunidad** `{id, title, interests[], stage, stageHist[], source, openedAt, closedAt, window{kind,y,m,half,from,to,date,text}, tentative, reviewAt, question, motivation, nextStep, plan[], discount, planNotes, quotes[], episodeId, apptId, closeReason, legacyStatus, review}`

**Propuesta emitida** `{id, version, state, issuedAt, deliveredAt, deliveredVia, expiresAt, supersedes, pdfDocId, snap{plan,discount,planNotes,totals,dates,next,photoIds}}`

**Tarea** `{id, oppId, kind, due, status, note, owner, doneAt, doneNote, review}`

**Foto** `{id, patientId, visitId, slotId, frame, view, regions[], cls, phase, episodeId, orig, w, h, method, capturedAt, capturedSrc, capturedExif, importedAt, mods{}, brush, gw, gh, maskS, maskL, after, thumb, privacy[{id,shape,x,y,w,h,rot,style,color,opacity,on}], scenarios[{id,name,mods,brush,maskS,maskL,after}], scn, inPdf}`

**Documento** `{id, patientId, visitId, category, displayName, fileName, mime, size, sha256, uploadedAt, documentDate, version, status, src, locked, prevId, data}`

### Fechas
- Fecha civil `AAAA-MM-DD` para visitas, citas, tentativas y vencimientos. No se convierte a UTC.
- Instante ISO con desplazamiento para auditoría: creación, importación, cambios.
- La cita guarda su zona horaria (`America/Bogota` por omisión). Se muestra con su hora local aunque el equipo esté en otra zona.
- La fecha deseada conserva la precisión con que se dijo.

## 6. Seguridad y privacidad

- Texto de usuario siempre escapado al pintar. Los identificadores de un paquete importado se validan con formato estricto porque llegan a atributos HTML.
- Las imágenes se recodifican en un lienzo: sin EXIF ni GPS.
- Documentos validados por su contenido real, no por la extensión. HTML, SVG y ejecutables se rechazan.
- Sin solicitudes a terceros. Sin analítica. Los registros de consola solo llevan nombres de error.
- Nombres de archivo con código de caso, sin nombre ni documento.
- **No hay cifrado en reposo ni control de acceso.** Se declara en la interfaz y en el README.

## 7. Pendientes y deuda

| Tema | Estado |
|---|---|
| Estudio de contenido para redes | No implementado |
| Anotaciones y marcadores sobre la foto; ajustes preestablecidos | No implementado |
| Detección automática de puntos anatómicos | No implementado |
| Visor de PDF integrado | No implementado; se descarga |
| Calendario con rejilla horaria y arrastre | No implementado; listas por día |
| Tablero de oportunidades tipo kanban | No implementado; lista por paciente, Hoy e indicadores |
| Fusión selectiva al importar | No implementado; reemplazar o conservar ambas |
| Comparación de evolución con deslizador | Solo lado a lado |
| Bloqueo por PIN, usuarios, roles, auditoría de accesos | No implementado |
| Cifrado en reposo | No implementado |
| Sincronización entre equipos | Fuera de alcance; requiere servidor y revisión legal |
| Registro de pagos | Fuera de alcance |
| Paquetes muy grandes | Se arman en memoria; sin flujo por partes |
| Validación en iPhone y iPad físicos, y con fotos reales | Pendiente |
| Intensidad de los deslizadores | Sin calibrar con casos reales |
| Tiempos de referencia de 15 procedimientos | Pendientes de confirmar por la doctora |
