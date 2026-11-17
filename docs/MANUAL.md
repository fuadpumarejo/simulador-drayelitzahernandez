# Manual breve

## 1. Recibir a una paciente

1. **Hoy → Nueva valoración.** Escribe el nombre y marca las autorizaciones que ya firmó. Sin la autorización de fotografías no se pueden tomar ni importar fotos; puedes crear la ficha sin fotos.
2. **Regiones.** Marca una o varias. Sirven para armar la lista de vistas; no definen ningún procedimiento.
3. **Cómo se obtienen las fotos.**
   - *Tomar fotografías:* captura guiada, una vista por pantalla.
   - *Importar fotografías existentes:* varias a la vez; quedan en «Por clasificar».
   - *Combinar ambas.*
   - *Captura libre:* sin lista; se clasifica después.
4. En cada vista: **Tomar foto** o **Elegir archivo**, luego **Repetir** o **Aceptar**. También **Omitir** con motivo.
5. Puedes pausar cuando quieras. El avance queda guardado y se retoma desde «Hoy» o desde la ficha.
6. **Finalizar captura → Lista para valoración.** Si la valoración será en otro equipo, elige «Enviar caso al computador».

## 2. Valorar y simular

1. En la ficha, **Fotos y simulaciones**. Toca una foto o «Simular».
2. **Simular:** elige una zona sugerida, marca los puntos que pide y ajusta los deslizadores. «Ver todos los módulos» muestra el resto.
3. **Pincel:** empujar, aumentar, reducir, suavizar piel, atenuar surco, restaurar.
4. **Guardar alternativa** crea B a partir de A sin tocar A. La alternativa activa es la que sale en la propuesta.
5. **Deshacer / Rehacer** (también Ctrl+Z y Ctrl+Y) cubren deslizadores, puntos, pincel y censura de la foto abierta.
6. **Antes / Dividir / Simulación** para comparar. **Presentar** muestra solo la imagen a pantalla completa; **Ocultar** tapa la imagen al instante.

## 3. Censurar zonas sensibles

En el editor, pestaña **Privacidad**: añade un círculo o un rectángulo, arrástralo o usa las flechas, y ajusta tamaño y rotación. Cubre a la vez el original y la simulación. Dentro del caso son capas editables; en lo que se descarga para compartir quedan aplanadas y no se pueden quitar.

Usa el **sólido opaco** para ocultar. El pixelado y el difuminado son efectos de presentación.

## 4. Descargar imágenes

- En cada foto, **Descargar**: original, simulación o comparación; para la paciente (con censura) o para uso interno (sin censura, con confirmación).
- Selecciona varias y usa **Descargar selección como ZIP**, o **Descargar visita (ZIP)**.
- Con dos fotos reales seleccionadas, **Comparar evolución**.

Los nombres de archivo usan el código del caso (por ejemplo `C58743F`), nunca el nombre de la paciente.

## 5. Citas, atenciones y controles

- **Agendar cita** desde la ficha o desde Agenda. Estados: tentativa, programada, confirmada, llegó, finalizada, cancelada, no asistió.
- **Reprogramar** cambia la misma cita y deja la fecha anterior en el historial.
- **Llegó → Registrar atención** crea la visita real. Una cita cancelada o sin asistencia no cuenta como atención.
- **Registrar una atención ya realizada** sirve para controles sin cita previa.
- **Registrar procedimiento realizado** pide la fecha real y solo acepta fechas pasadas. Luego puedes **Planear controles**: se crean como citas tentativas que tú eliges.
- **Exportar .ics** lleva la cita al calendario del teléfono con el asunto «Cita SKIND», sin datos clínicos. Si reprogramas, vuelve a exportar.

## 6. Propuestas y decisiones

1. **Crear oportunidad** con lo que la paciente desea explorar.
2. **Decisión y próximos pasos:** su pregunta pendiente, la fecha que desea (un mes, una quincena, un rango o una fecha), el siguiente paso acordado.
3. Arma el **borrador** con el catálogo. El sistema sugiere agregar lo que se simuló.
4. **Vista previa** genera un PDF de borrador. **Emitir versión** guarda un PDF inmutable en Documentos.
5. **Marcar como entregada** cuando realmente se entregue. Después, **Aceptada** o **Rechazada**.
6. **Programar cirugía** crea la cita real y pasa la oportunidad a «Cirugía programada». Solo «Registrar procedimiento realizado» la cierra como realizada.
7. **Agregar tarea acordada** solo si se pactó. Si la paciente prefiere comunicarse ella, elige ese siguiente paso: no se crean tareas de contacto ni borradores.

## 7. Pasar un caso entre equipos

1. En la ficha, **Resumen → Exportar caso editable (.yhcase)**. Elige alcance y contraseña (mínimo 8 caracteres).
2. Lleva el archivo al otro equipo. Comunica la contraseña por otro medio.
3. En el otro equipo, **Importar caso**. Revisa la vista previa.
4. Si el caso ya existe: **Reemplazar** (se guarda copia de recuperación), **Conservar ambas** o **Cancelar**.

La copia de recuperación se restaura desde **Más → Respaldos y transferencia**.

## 8. Respaldos

**Más → Respaldos y transferencia → Exportar respaldo completo.** Hazlo con regularidad y guarda el archivo fuera del equipo. Sin la contraseña, el respaldo no se puede abrir: no hay forma de recuperarla.

Al restaurar puedes **agregar** los pacientes que no están en el equipo (no toca nada de lo existente) o **sustituir toda la base** (pide doble confirmación).

## 9. Preguntas frecuentes

**¿Por qué la herramienta abre vacía en otro equipo?** Porque cada navegador guarda sus propios datos. Importa el caso o el respaldo.

**Dice «Modo temporal».** El navegador está en modo privado o bloquea el almacenamiento. Nada se guardará al cerrar.

**Dice «Sin espacio».** Exporta un respaldo y elimina casos que ya no necesites en ese equipo.

**Una foto HEIC no abre.** En el iPhone, toma la foto desde la herramienta, o cambia Ajustes > Cámara > Formatos > «Más compatible».

**La imagen queda en blanco en el editor.** El navegador liberó memoria gráfica. Vuelve a la galería y abre la foto de nuevo; los ajustes guardados no se pierden.
