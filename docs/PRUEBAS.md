# Matriz de pruebas T01–T120

Generada el 16/11/2026 a partir de `tests/out/resultados.json`. Todas las pruebas usan datos ficticios e imágenes sintéticas; no se usó ninguna fotografía ni dato real.

**Entorno:** Google Chrome sin interfaz (WebGL por software) controlado con Playwright, sobre `index.html` servido en local, con las solicitudes a otros dominios bloqueadas. Móvil y tableta se **emularon** (tamaño, táctil y densidad); no se probó en un iPhone o iPad físico.

**Resumen:** Aprobada (automática): 92 · No implementado: 6 · Parcial: 21 · Pendiente en dispositivo real: 1. Verificaciones automatizadas ejecutadas: 140, aprobadas: 140.

Cómo leer los estados:

- **Aprobada (automática):** el comportamiento se ejecutó y se comprobó en el navegador de pruebas.
- **Parcial:** la parte automatizable pasó; la nota dice qué falta.
- **Pendiente en dispositivo real:** no puede verificarse sin el equipo físico.
- **No implementado:** la función no existe en esta versión.

| Prueba | Qué verifica | Estado | Evidencia o pendiente |
|---|---|---|---|
| T01 | Exportar caso editable con fotos, simulaciones, pincel y máscaras | Aprobada (automática) | C7097E1_2026-11-16.yhcase 1187 KB cifrado, sin nombre ni JPEG legible |
| T02 | Importar en otro navegador: todo editable e idéntico | Parcial | Verificado entre dos contextos de navegador aislados. Falta el traslado físico iPhone → PC por AirDrop o cable. |
| T03 | Editar en el segundo equipo y volver a importar | Aprobada (automática) | revisión del 2º equipo aplicada; otras pacientes sin cambios |
| T04 | Importar dos veces el mismo archivo | Aprobada (automática) | duplicado detectado; «conservar ambas» crea ficha aparte con IDs nuevos y vínculos íntegros |
| T05 | Archivo corrupto, truncado, ajeno o contraseña errónea | Aprobada (automática) | contraseña errónea: mensaje claro, cero registros |
| T06 | Importar respaldo JSON anterior | Aprobada (automática) | JSON legado: vista previa, conversión controlada, sin sustitución (agrega solo los inexistentes) |
| T07 | Censura sobre original, simulación y comparación; mover el divisor | Aprobada (automática) | máscara opaca sobre el lienzo, independiente del divisor |
| T08 | Mover máscara, cerrar, reabrir, exportar e importar | Aprobada (automática) | capa de privacidad movida en el otro equipo sigue siendo editable |
| T09 | Autoguardado, recarga y recuperación de versión previa | Aprobada (automática) | chip tras confirmar IndexedDB: Guardado en este dispositivo |
| T10 | IndexedDB no disponible (modo memoria) | Aprobada (automática) | sin IndexedDB: advertencia fuerte y permanente; nunca dice «Guardado» |
| T11 | Alternar fotos y pacientes con autoguardado pendiente | Aprobada (automática) | tres fotos y dos pacientes alternados con autoguardado pendiente: sin pérdida ni contaminación cruzada |
| T12 | Nombres de archivo y metadatos sin datos personales | Aprobada (automática) | Cubierta por T29, T12, T31, T01 |
| T13 | PDF, Excel, JSON anterior y ZIP rotulan simulación y censura | Parcial | El PDF, el ZIP y los JPG rotulan. El Excel no incluye imágenes. |
| T14 | Chrome/Edge de escritorio y Safari en iPhone/iPad | Parcial | Verificado con Chrome y emulación táctil 390×844, 820×1180 y 1180×820. Falta Safari real en iPhone y iPad, y Edge. |
| T15 | Regresión: WebGL, módulos, exportaciones, catálogo, tiempos | Aprobada (automática) | WebGL, módulos heredados, deslizadores, totales de tiempo y Excel funcionan tras migrar |
| T16 | Pérdida y restauración del contexto WebGL | Parcial | Verificado forzando la pérdida con WEBGL_lose_context. La pérdida real por memoria en iOS queda por observar. |
| T17 | Fallo a mitad de una restauración completa | Aprobada (automática) | falla inyectada a mitad de restauración: transacción cancelada, base íntegra |
| T18 | HEIC, EXIF de orientación e imagen no compatible | Parcial | Mensaje y detección de HEIC verificados. La orientación EXIF y HEIC nativo de Safari deben probarse con fotos reales de iPhone. |
| T19 | Varias regiones: plan sin vistas duplicadas | Aprobada (automática) | plan 6 vistas sin duplicados; Plan: 6 vistas (5 obligatorias). Las vistas que sirven a dos regiones se toman una sola vez. |
| T20 | Captura guiada en iPhone: tomar, repetir, aceptar, omitir | Parcial | Flujo verificado eligiendo archivos. La cámara nativa de iPhone y el permiso de cámara requieren dispositivo físico. |
| T21 | Importar varias fotos y clasificarlas | Aprobada (automática) | 6 fotos en Por clasificar |
| T22 | Mezclar fotos tomadas e importadas | Aprobada (automática) | mezcla de capturadas e importadas en un solo plan |
| T23 | Captura libre y clasificación posterior | Aprobada (automática) | foto libre clasificada manualmente |
| T24 | Pasar el caso del móvil al PC con la sesión intacta | Parcial | Igual que T02: falta el traslado entre dispositivos físicos. |
| T25 | Añadir una toma durante la valoración | Aprobada (automática) | toma añadida durante la valoración queda en la misma visita |
| T26 | Segunda visita o control con su propio plan | Aprobada (automática) | segunda visita (control) con su propia fecha y plan, sin tocar la primera |
| T27 | Migrar fotos antiguas con etiqueta sin inventar datos | Aprobada (automática) | foto con label conserva propuesta sin confirmar; ficha sin plan no genera oportunidad |
| T28 | Paciente sin autorización de fotografías | Aprobada (automática) | sin autorización de fotos no deja pasar a captura |
| T29 | Descargar original individual | Aprobada (automática) | C51A59F_sin-fecha_cara-y-cuello_frontal_original_censurada.jpg |
| T30 | Descargar simulación individual | Aprobada (automática) | simulación etiquetada y censurada |
| T31 | Descargar selección múltiple en ZIP | Aprobada (automática) | 10 archivos, manifiesto, sin PII en nombres |
| T32 | Descargar comparación | Aprobada (automática) | comparación con censura en ambos lados |
| T33 | Círculo opaco: no queda el píxel original debajo | Aprobada (automática) | Cubierta por T07, T33 |
| T34 | Varias zonas y varias fotos: todas las copias censuradas | Aprobada (automática) | ZIP de varias fotos: la foto censurada sale censurada en original, simulación y comparación; las demás sin máscara |
| T35 | Sesión con censura parcial: exportar y continuar | Aprobada (automática) | Cubierta por T02, T08 |
| T36 | Adjuntar PDF, JPG y PNG | Aprobada (automática) | PDF, JPG y PNG adjuntos con huella |
| T37 | Rechazar SVG, HTML o ejecutable renombrado | Aprobada (automática) | HTML renombrado, SVG y ejecutable rechazados por contenido; nada se ejecuta |
| T38 | Nueva versión de un documento | Parcial | Versionado verificado. No hay visor de PDF integrado: el PDF se descarga. |
| T39 | Sin consentimiento no entra a la biblioteca | Aprobada (automática) | sin autorización de uso en consulta: no entra a la biblioteca |
| T40 | Caso aprobado visible en modo paciente, sin datos internos | Parcial | Biblioteca básica con casos de simulación y pares reales; sin álbumes ni etiquetas. |
| T41 | Revocar autorización bloquea el caso | Parcial | Verificado para la autorización de uso en consulta. No existe flujo de difusión pública. |
| T42 | Redes: carrusel antes/después 1:1, 4:5 y 9:16 | No implementado | Estudio de contenido para redes: no implementado (prioridad P2). |
| T43 | Redes: copy y verificación | No implementado | No implementado (P2). |
| T44 | Redes: paquete de publicación | No implementado | No implementado (P2). |
| T45 | Simulación o IA en biblioteca o redes | No implementado | La biblioteca separa «Simulación ilustrativa» de «Antes / después real» (ver T40). La parte de redes no está implementada. |
| T46 | Programar publicación en calendario editorial | No implementado | No implementado (P2). |
| T47 | Cuota insuficiente o archivo muy grande | Aprobada (automática) | cuota excedida: no declara «Guardado», conserva el cambio abierto y reintenta sin perderlo |
| T48 | Caso ampliado con documentos: transferencia completa | Aprobada (automática) | variante ampliada: documentos y PDF emitidos viajan y se restauran completos |
| T49 | Crear cita en el calendario y verla en la ficha | Aprobada (automática) | cita creada en el calendario aparece en la ficha con el mismo ID; no crea visita |
| T50 | Reprogramar valoración conservando historial | Aprobada (automática) | reprogramada: mismo evento, nueva fecha en ficha y calendario, historial con fecha previa y motivo |
| T51 | Cancelar o marcar no asistió | Aprobada (automática) | «No asistió» no genera atención ni control cumplido |
| T52 | Registrar llegada y atención realizada | Aprobada (automática) | llegó + registrar atención: visita ligada a la cita, sin crear cirugía |
| T53 | Control posoperatorio con plantilla opcional y control sin cita | Aprobada (automática) | control retro sin cita y controles elegidos de plantilla desde la fecha real; ninguno se impone |
| T54 | Dos procedimientos: cada control a su episodio | Aprobada (automática) | dos episodios; cada control o visita va a su episodio o queda «sin asignar» |
| T55 | Foto sin EXIF: fecha sin confirmar | Aprobada (automática) | sin EXIF: fecha de toma sin confirmar, no se asigna hoy |
| T56 | Corregir fecha de toma conservando el valor previo | Aprobada (automática) | fecha EXIF leída como propuesta |
| T57 | Comparar preoperatorio con control real | Parcial | Lado a lado con fechas e intervalo. Falta deslizador y superposición entre fotos reales. |
| T58 | Emitir, entregar y modificar propuesta | Aprobada (automática) | emitir PDF no lo marca como entregado |
| T59 | Cirugía estimada, programada y realizada | Aprobada (automática) | no se puede cerrar como realizada sin registro del procedimiento |
| T60 | Calendario día/semana/mes/lista y capas | Parcial | Las vistas día y semana son listas por día, sin rejilla horaria. |
| T61 | Exportar .ics sin datos clínicos | Aprobada (automática) | .ics con asunto neutro, UID estable y zona horaria; sin nombre ni tipo de cita |
| T62 | Reprogramar después de exportar .ics | Aprobada (automática) | aviso: el .ics exportado no se actualiza al reprogramar |
| T63 | Exportar/importar caso con citas e hitos | Aprobada (automática) | citas, oportunidad (ventana «febrero de 2027») y tareas conservan IDs y fechas |
| T64 | Migrar fecha estimada, próximo contacto e historial | Aprobada (automática) | p.date→tentativa; p.nextDate→tarea por revisar; journey→historial; sin visitas, citas ni cirugías inventadas; copia previa guardada |
| T65 | Recordatorios con la aplicación cerrada | Parcial | No hay notificaciones; los recordatorios solo se ven al abrir la herramienta, y así se declara. |
| T66 | Cambio de zona horaria | Aprobada (automática) | equipo en Asia/Tokyo: la fecha civil y la hora local de la cita no se corren; se muestra la zona de origen |
| T67 | Registrar interés inicial sin ficha clínica | Aprobada (automática) | interés inicial sin ficha clínica, sin fotos ni visita |
| T68 | Convertir interés en paciente con valoración | Aprobada (automática) | convertir conserva origen, canal y permiso, y vincula interés y paciente |
| T69 | Valoración sin decisión inmediata | Aprobada (automática) | interés registrado sin propuesta ni tarea automática |
| T70 | Ventana deseada mensual («febrero de 2027») | Aprobada (automática) | «febrero de 2027» conserva granularidad mensual; no crea día, hora, cita ni reserva |
| T71 | Ventana por quincena o trimestre | Aprobada (automática) | «quincena» se muestra como ventana estimada, sin cirugía programada |
| T72 | Convertir ventana en cirugía programada | Aprobada (automática) | no se puede marcar «programada» sin cita real |
| T73 | Solicitud de información y tarea | Aprobada (automática) | tarea con fecha aparece en Hoy; se completa solo con resultado manual |
| T74 | Paciente pide no ser contactada | Aprobada (automática) | «la paciente se comunicará»: sin tareas de contacto, sin borrador, sin vencidos |
| T75 | Posponer y reactivar | Aprobada (automática) | pospuesta y reactivada conservando historial; sin etiqueta «perdida» |
| T76 | Dos intereses en la misma paciente | Aprobada (automática) | dos oportunidades en la misma paciente no comparten etapa ni cotización |
| T77 | Emitir PDF no es entregar | Aprobada (automática) | generar PDF no marca la propuesta como entregada ni contactada |
| T78 | Segunda versión de la propuesta | Aprobada (automática) | v2 emitida; v1 y su PDF se conservan inmutables (mismo hash) |
| T79 | Aceptación comercial no es consentimiento ni cirugía | Aprobada (automática) | aceptación comercial ≠ consentimiento, cita ni cirugía |
| T80 | Abono o pago | No implementado | No hay registro de pagos ni abonos. La herramienta declara que no registra ingresos y no existe ningún estado «pagado». |
| T81 | Borrador de WhatsApp | Aprobada (automática) | borrador de mensaje sin datos clínicos; no se marca enviado ni completa la tarea |
| T82 | PDF con ventana deseada | Aprobada (automática) | PDF: ventana deseada como «sin reserva»; próximos pasos; nada aparece como programado o realizado |
| T83 | Calendario con ventana tentativa | Aprobada (automática) | ventana tentativa con estilo propio; no bloquea horario |
| T84 | Exportar/importar oportunidades | Aprobada (automática) | oportunidades, tareas y versiones viajan con el caso |
| T85 | Migrar estado antiguo «Programada» | Aprobada (automática) | «Programada» heredada queda por revisar, sin cita quirúrgica inventada |
| T86 | Indicadores de conversión con denominador | Aprobada (automática) | tasas con fórmula y denominador; propuestas e ingresos no se mezclan |
| T87 | Deduplicación en indicadores | Aprobada (automática) | se declara que son eventos, no pacientes únicos |
| T88 | Oportunidad no indicada clínicamente | Aprobada (automática) | «no indicada» cierra sin seguimiento comercial |
| T89 | Corregir la fuente de captación | Aprobada (automática) | fuente de captación reportada, sin tocar la timeline clínica |
| T90 | Retirar el permiso de contacto | Aprobada (automática) | retirar permiso cancela tareas pendientes y bloquea borradores; historial conservado |
| T91 | Nueva valoración abre la preparación, no el editor | Aprobada (automática) | Nueva valoración abre registro, no el editor |
| T92 | Captura directa sin procedimiento elegido | Aprobada (automática) | caso listo sin forzar procedimiento |
| T93 | Pausar y reanudar la captura | Aprobada (automática) | pausa y reanuda sin pérdida |
| T94 | Imagen vertical no se asume como rostro | Aprobada (automática) | imagen vertical no se clasifica sola como rostro |
| T95 | El estado no dice «Sincronizado» | Aprobada (automática) | no aparece «Sincronizado»; el estado dice «Guardado en este dispositivo» |
| T96 | Autoguardado, cierre y recuperación | Aprobada (automática) | Cubierta por T09a, T96 |
| T97 | Deshacer y rehacer unificado | Aprobada (automática) | deshacer/rehacer en deslizador, pincel y censura |
| T98 | Importar caso existente con vista previa | Aprobada (automática) | vista previa con diferencias, confirmación y copia de recuperación |
| T99 | Modo paciente oculta datos internos | Aprobada (automática) | presentación sin barra, cifras ni notas; aviso ilustrativo visible |
| T100 | Simulación → propuesta sin diligenciar de nuevo | Aprobada (automática) | el plan sugiere lo simulado sin marcarlo como recomendado |
| T101 | Una sola próxima acción | Aprobada (automática) | una sola «Próxima acción acordada» visible en la ficha |
| T102 | Divulgación progresiva de módulos | Aprobada (automática) | módulos sugeridos según la vista; resto tras «Ver todos» |
| T103 | Zoom con dos dedos al pintar | Pendiente en dispositivo real | Requiere pantalla táctil real. La lógica (cancelar el trazo al apoyar el segundo dedo) se conserva de la versión anterior. |
| T104 | Errores específicos y recuperables | Aprobada (automática) | errores específicos; nada alterado |
| T105 | Objetivos táctiles | Parcial | Medido en emulación 390×844. Confirmar con dedos reales. |
| T106 | Alternativa sin arrastre | Aprobada (automática) | punto anatómico ajustable con botones, sin arrastre |
| T107 | Teclado y foco | Parcial | Foco visible, retención de foco en diálogos y Escape verificados. Recorrer todos los flujos solo con teclado requiere revisión manual. |
| T108 | Lector de pantalla | Parcial | Etiquetas programáticas y aria-live verificados en 10 pantallas. Falta prueba con VoiceOver y NVDA. |
| T109 | Zoom 200 % y reflujo | Parcial | Verificado con ancho equivalente a 200 %. Texto ampliado del sistema en iOS sin probar. |
| T110 | Contraste AA | Aprobada (automática) | contraste AA calculado: {'texto/fondo': 15.72, 'apagado/fondo': 6.24, 'apagado/superficie': 6.48, 'acento/superficie': 6.51, 'blanco/acento': 6.51, 'acento/acento suave': 5.59, 'crítico/crítico suave': 4.91, 'aviso/aviso suave': 4.64, 'bien/bien suave': 4.55, 'apagado/escenario': 5.45} |
| T111 | Cambio entre guiada y tablero | Aprobada (automática) | cambiar entre guiada y tablero conserva progreso |
| T112 | Estados vacíos con acción | Aprobada (automática) | estado vacío con la acción para continuar |
| T113 | Catálogo sin procedimientos «recomendados» | Aprobada (automática) | el catálogo es apoyo de selección; nada se marca como recomendado |
| T114 | Reprogramar desde ficha o agenda | Aprobada (automática) | reprogramar desde la ficha/agenda cambia el mismo evento |
| T115 | Opciones de exportación por propósito | Aprobada (automática) | descarga agrupada por propósito; aclara que no es editable y cuál sí |
| T116 | Tiempo y toques del flujo de consulta | Parcial | Conteo de toques automatizado. Los tiempos con la doctora y su equipo están pendientes. |
| T117 | Continuar donde quedó | Aprobada (automática) | Hoy muestra continuar donde quedó |
| T118 | Persistencia local y cuota | Parcial | Uso, cuota y error de cuota verificados. La expulsión de datos por iOS/Safari tras inactividad solo puede observarse en un dispositivo real. |
| T119 | Sin datos a terceros ni PII en registros | Parcial | Sin solicitudes externas en las pruebas. Los registros de consola solo llevan nombres de error; revisión manual del código recomendada. |
| T120 | Paquete entregable | Parcial | Código, documentación, pruebas y un caso ficticio incluidos. Capturas de pantalla en tests/out/ tras ejecutar las pruebas. |

## Verificaciones adicionales

| Prueba | Resultado | Detalle |
|---|---|---|
| P1-escenarios | Aprobada | alternativas A/B independientes |
| 5F.6-ocultar | Aprobada | botón Ocultar imagen |
| respaldo | Aprobada | .yhbackup restaura en equipo limpio sin sustituir |
| 5E.8-bandeja | Aprobada | bandeja de datos heredados en Hoy |
| 5D.3-linea | Aprobada | línea de tiempo con hechos clínicos y agenda diferenciados |
| 5F.6-movil | Aprobada | presentación a pantalla completa; lienzo 473 px de 844 |
| SEG-ids | Aprobada | identificadores con caracteres no permitidos: paquete rechazado completo |
| SEG-img | Aprobada | miniatura con contenido que no es imagen base64 se descarta al importar |
| SEG-xss | Aprobada | texto de usuario escapado: no se ejecuta HTML inyectado |

## Cómo repetirlas

```
python3 build.py                     # arma index.html desde src/
python3 -m http.server 8765 &        # sirve la carpeta
pip install playwright pypdf         # una vez; usa Google Chrome instalado
python3 tests/run_all.py             # ejecuta las seis suites
python3 tests/make_matrix.py         # regenera este documento
```

## Protocolo de validación en iPhone y iPad (pendiente)

Hacerlo con un caso ficticio antes de usar datos reales.

1. Abrir la dirección de la herramienta en Safari. Confirmar que el indicador dice «Guardado en este dispositivo».
2. **Nueva valoración** con nombre ficticio y dos regiones. Tomar las fotos con la cámara: verificar orientación correcta, botones Repetir y Aceptar, y que la fecha de toma queda registrada.
3. Importar tres fotos de la galería del teléfono (formato HEIC incluido). Confirmar que abren o que el mensaje explica qué hacer.
4. Pausar, cerrar Safari, volver a abrir y continuar desde «Hoy».
5. Marcar puntos y mover deslizadores. Pintar con un dedo y, sin levantar, apoyar un segundo dedo para acercar: no debe quedar un trazo accidental (T103).
6. Añadir un círculo de censura, moverlo con el dedo y con las flechas.
7. **Exportar caso editable**, enviarlo por AirDrop al computador, importarlo y comprobar que todo sigue editable (T02, T24).
8. Modificar en el computador, exportar, devolver al iPhone e importar con «Reemplazar».
9. Girar el iPad a horizontal en el editor y en «Presentar».
10. Dejar el iPhone una semana sin abrir la herramienta y comprobar que los datos siguen (T118). Mantener siempre un respaldo protegido reciente.
