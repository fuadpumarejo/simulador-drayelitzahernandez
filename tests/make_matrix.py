#!/usr/bin/env python3
"""Genera docs/PRUEBAS.md a partir de tests/out/resultados.json. Estados honestos: lo no verificado no se declara aprobado."""
import json, os, re, datetime
here=os.path.dirname(os.path.abspath(__file__)); R=json.load(open(os.path.join(here,'out','resultados.json')))
TIT={1:'Exportar caso editable con fotos, simulaciones, pincel y máscaras',2:'Importar en otro navegador: todo editable e idéntico',3:'Editar en el segundo equipo y volver a importar',4:'Importar dos veces el mismo archivo',5:'Archivo corrupto, truncado, ajeno o contraseña errónea',6:'Importar respaldo JSON anterior',
7:'Censura sobre original, simulación y comparación; mover el divisor',8:'Mover máscara, cerrar, reabrir, exportar e importar',9:'Autoguardado, recarga y recuperación de versión previa',10:'IndexedDB no disponible (modo memoria)',11:'Alternar fotos y pacientes con autoguardado pendiente',12:'Nombres de archivo y metadatos sin datos personales',
13:'PDF, Excel, JSON anterior y ZIP rotulan simulación y censura',14:'Chrome/Edge de escritorio y Safari en iPhone/iPad',15:'Regresión: WebGL, módulos, exportaciones, catálogo, tiempos',16:'Pérdida y restauración del contexto WebGL',17:'Fallo a mitad de una restauración completa',18:'HEIC, EXIF de orientación e imagen no compatible',
19:'Varias regiones: plan sin vistas duplicadas',20:'Captura guiada en iPhone: tomar, repetir, aceptar, omitir',21:'Importar varias fotos y clasificarlas',22:'Mezclar fotos tomadas e importadas',23:'Captura libre y clasificación posterior',24:'Pasar el caso del móvil al PC con la sesión intacta',25:'Añadir una toma durante la valoración',26:'Segunda visita o control con su propio plan',27:'Migrar fotos antiguas con etiqueta sin inventar datos',28:'Paciente sin autorización de fotografías',
29:'Descargar original individual',30:'Descargar simulación individual',31:'Descargar selección múltiple en ZIP',32:'Descargar comparación',33:'Círculo opaco: no queda el píxel original debajo',34:'Varias zonas y varias fotos: todas las copias censuradas',35:'Sesión con censura parcial: exportar y continuar',
36:'Adjuntar PDF, JPG y PNG',37:'Rechazar SVG, HTML o ejecutable renombrado',38:'Nueva versión de un documento',39:'Sin consentimiento no entra a la biblioteca',40:'Caso aprobado visible en modo paciente, sin datos internos',41:'Revocar autorización bloquea el caso',
42:'Redes: carrusel antes/después 1:1, 4:5 y 9:16',43:'Redes: copy y verificación',44:'Redes: paquete de publicación',45:'Simulación o IA en biblioteca o redes',46:'Programar publicación en calendario editorial',47:'Cuota insuficiente o archivo muy grande',48:'Caso ampliado con documentos: transferencia completa',
49:'Crear cita en el calendario y verla en la ficha',50:'Reprogramar valoración conservando historial',51:'Cancelar o marcar no asistió',52:'Registrar llegada y atención realizada',53:'Control posoperatorio con plantilla opcional y control sin cita',54:'Dos procedimientos: cada control a su episodio',55:'Foto sin EXIF: fecha sin confirmar',56:'Corregir fecha de toma conservando el valor previo',57:'Comparar preoperatorio con control real',58:'Emitir, entregar y modificar propuesta',59:'Cirugía estimada, programada y realizada',60:'Calendario día/semana/mes/lista y capas',61:'Exportar .ics sin datos clínicos',62:'Reprogramar después de exportar .ics',63:'Exportar/importar caso con citas e hitos',64:'Migrar fecha estimada, próximo contacto e historial',65:'Recordatorios con la aplicación cerrada',66:'Cambio de zona horaria',
67:'Registrar interés inicial sin ficha clínica',68:'Convertir interés en paciente con valoración',69:'Valoración sin decisión inmediata',70:'Ventana deseada mensual («febrero de 2027»)',71:'Ventana por quincena o trimestre',72:'Convertir ventana en cirugía programada',73:'Solicitud de información y tarea',74:'Paciente pide no ser contactada',75:'Posponer y reactivar',76:'Dos intereses en la misma paciente',77:'Emitir PDF no es entregar',78:'Segunda versión de la propuesta',79:'Aceptación comercial no es consentimiento ni cirugía',80:'Abono o pago',81:'Borrador de WhatsApp',82:'PDF con ventana deseada',83:'Calendario con ventana tentativa',84:'Exportar/importar oportunidades',85:'Migrar estado antiguo «Programada»',86:'Indicadores de conversión con denominador',87:'Deduplicación en indicadores',88:'Oportunidad no indicada clínicamente',89:'Corregir la fuente de captación',90:'Retirar el permiso de contacto',
91:'Nueva valoración abre la preparación, no el editor',92:'Captura directa sin procedimiento elegido',93:'Pausar y reanudar la captura',94:'Imagen vertical no se asume como rostro',95:'El estado no dice «Sincronizado»',96:'Autoguardado, cierre y recuperación',97:'Deshacer y rehacer unificado',98:'Importar caso existente con vista previa',99:'Modo paciente oculta datos internos',100:'Simulación → propuesta sin diligenciar de nuevo',101:'Una sola próxima acción',102:'Divulgación progresiva de módulos',103:'Zoom con dos dedos al pintar',104:'Errores específicos y recuperables',105:'Objetivos táctiles',106:'Alternativa sin arrastre',107:'Teclado y foco',108:'Lector de pantalla',109:'Zoom 200 % y reflujo',110:'Contraste AA',111:'Cambio entre guiada y tablero',112:'Estados vacíos con acción',113:'Catálogo sin procedimientos «recomendados»',114:'Reprogramar desde ficha o agenda',115:'Opciones de exportación por propósito',116:'Tiempo y toques del flujo de consulta',117:'Continuar donde quedó',118:'Persistencia local y cuota',119:'Sin datos a terceros ni PII en registros',120:'Paquete entregable'}
ALIAS={42:['S-pieza'],43:['S-bloqueo'],44:['S-pieza'],45:['S-pieza','T40'],46:['S-pieza'],35:['T08','T02'],28:['T28b','T39'],13:['T13a','T30','T31','T06'],12:['T12','T29','T31','T01'],117:['T117a'],96:['T96','T09a'],9:['T09','T09a'],33:['T33','T07']}
PARCIAL={42:'Pieza antes/después en 1:1, 4:5 y 9:16 con rótulo y censura. Una imagen por pieza: sin carrusel de varias láminas ni zonas seguras por red.',43:'Detecta expresiones de riesgo y exige cuatro verificaciones. No reemplaza la revisión de la doctora ni la normativa de publicidad en salud.',44:'ZIP con imagen, texto y verificación.',46:'Las publicaciones con fecha aparecen en la Agenda y se marcan publicadas a mano. No hay publicación automática.',14:'Verificado con Chrome y emulación táctil 390×844, 820×1180 y 1180×820. Falta Safari real en iPhone y iPad, y Edge.',18:'Mensaje y detección de HEIC verificados. La orientación EXIF y HEIC nativo de Safari deben probarse con fotos reales de iPhone.',20:'Flujo verificado eligiendo archivos. La cámara nativa de iPhone y el permiso de cámara requieren dispositivo físico.',2:'Verificado entre dos contextos de navegador aislados. Falta el traslado físico iPhone → PC por AirDrop o cable.',24:'Igual que T02: falta el traslado entre dispositivos físicos.',16:'Verificado forzando la pérdida con WEBGL_lose_context. La pérdida real por memoria en iOS queda por observar.',
107:'Foco visible, retención de foco en diálogos y Escape verificados. Recorrer todos los flujos solo con teclado requiere revisión manual.',108:'Etiquetas programáticas y aria-live verificados en 10 pantallas. Falta prueba con VoiceOver y NVDA.',116:'Conteo de toques automatizado. Los tiempos con la doctora y su equipo están pendientes.',118:'Uso, cuota y error de cuota verificados. La expulsión de datos por iOS/Safari tras inactividad solo puede observarse en un dispositivo real.',105:'Medido en emulación 390×844. Confirmar con dedos reales.',109:'Verificado con ancho equivalente a 200 %. Texto ampliado del sistema en iOS sin probar.',41:'Verificado para la autorización de uso en consulta. No existe flujo de difusión pública.',13:'El PDF, el ZIP y los JPG rotulan. El Excel no incluye imágenes.',57:'Lado a lado con fechas e intervalo. Falta deslizador y superposición entre fotos reales.',38:'Versionado verificado. No hay visor de PDF integrado: el PDF se descarga.',60:'Las vistas día y semana son listas por día, sin rejilla horaria.',65:'No hay notificaciones; los recordatorios solo se ven al abrir la herramienta, y así se declara.',119:'Sin solicitudes externas en las pruebas. Los registros de consola solo llevan nombres de error; revisión manual del código recomendada.',40:'Biblioteca básica con casos de simulación y pares reales; sin álbumes ni etiquetas.',120:'Código, documentación, pruebas y un caso ficticio incluidos. Capturas de pantalla en tests/out/ tras ejecutar las pruebas.'}
PEND={103:'Requiere pantalla táctil real. La lógica (cancelar el trazo al apoyar el segundo dedo) se conserva de la versión anterior.'}
NOIMPL={80:'No hay registro de pagos ni abonos. La herramienta declara que no registra ingresos y no existe ningún estado «pagado».'}
def checks(n):
    ids=ALIAS.get(n,[]); out=[]
    for tid,ok,note in R:
        m=re.match(r'^T0*(\d+)([a-z]|-.+)?$',tid)
        if (m and int(m.group(1))==n) or tid in ids: out.append((tid,ok,note))
    return out
rows=[];cnt={}
for n in range(1,121):
    c=checks(n)
    if n in NOIMPL and not c: st='No implementado'; note=NOIMPL[n]
    elif n in NOIMPL: st='Parcial'; note=NOIMPL[n]
    elif n in PEND: st='Pendiente en dispositivo real'; note=PEND[n]
    elif not c: st='Sin prueba automatizada'; note='Pendiente de validación manual.'
    elif not all(x[1] for x in c): st='FALLA'; note='; '.join(x[0]+': '+x[2] for x in c if not x[1])
    elif n in PARCIAL: st='Parcial'; note=PARCIAL[n]
    else: st='Aprobada (automática)'; note=c[0][2] if int(re.match(r'^T0*(\d+)',c[0][0]).group(1))==n else 'Cubierta por '+', '.join(x[0] for x in c)
    cnt[st]=cnt.get(st,0)+1; rows.append(f'| T{n:02d} | {TIT[n]} | {st} | {note.replace("|","/")[:330]} |')
extra=[x for x in R if not re.match(r'^T\d',x[0])]
md=f"""# Matriz de pruebas T01–T120

Generada el {datetime.date.today().strftime('%d/%m/%Y')} a partir de `tests/out/resultados.json`. Todas las pruebas usan datos ficticios e imágenes sintéticas; no se usó ninguna fotografía ni dato real.

**Entorno:** Google Chrome sin interfaz (WebGL por software) controlado con Playwright, sobre `index.html` servido en local, con las solicitudes a otros dominios bloqueadas. Móvil y tableta se **emularon** (tamaño, táctil y densidad); no se probó en un iPhone o iPad físico.

**Resumen:** {' · '.join(f'{k}: {v}' for k,v in sorted(cnt.items()))}. Verificaciones automatizadas ejecutadas: {len(R)}, aprobadas: {sum(1 for x in R if x[1])}.

Cómo leer los estados:

- **Aprobada (automática):** el comportamiento se ejecutó y se comprobó en el navegador de pruebas.
- **Parcial:** la parte automatizable pasó; la nota dice qué falta.
- **Pendiente en dispositivo real:** no puede verificarse sin el equipo físico.
- **No implementado:** la función no existe en esta versión.

| Prueba | Qué verifica | Estado | Evidencia o pendiente |
|---|---|---|---|
"""+'\n'.join(rows)+"""

## Verificaciones adicionales

| Prueba | Resultado | Detalle |
|---|---|---|
"""+'\n'.join(f'| {a} | {"Aprobada" if b else "FALLA"} | {c.replace("|","/")[:300]} |' for a,b,c in extra)+"""

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
"""
open(os.path.join(here,'..','docs','PRUEBAS.md'),'w').write(md); print(cnt)
