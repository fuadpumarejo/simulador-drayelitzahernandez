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

## 10. Acompañamiento (antes «Prospección»)

1. **Acompañamiento → Registrar interés** cuando alguien pregunta: nombre, WhatsApp, qué le interesa y cómo llegó.
2. En el **embudo**, cada tarjeta ofrece: *Mensaje* (abre WhatsApp con una plantilla), *Registrar contacto* (qué pasó y cuándo retomar, si se acordó) y *Agendar valoración* (crea la ficha y la cita).
3. Después de la valoración, la tarjeta avanza sola según lo que ocurra: propuesta entregada, en consideración, cirugía programada.
4. **Campañas y enlaces:** escribe el WhatsApp de la clínica y crea una campaña. El enlace lleva una referencia; ponlo en la biografía de Instagram, en historias o en anuncios. Cuando alguien escriba con esa referencia, regístralo con esa campaña.
5. **Resultados** muestra, por fuente o campaña, cuántos intereses llegaron a valoración, propuesta y cirugía programada.

Quien pida no ser contactada queda marcada y no se le pueden preparar mensajes.

## 11. Tratamientos por sesiones (láser, toxina, limpiezas)

1. En la ficha, **Tratamientos estéticos → Nuevo tratamiento**. Elige el servicio, las zonas, las sesiones previstas y los días entre sesiones.
2. **Registrar sesión** después de cada aplicación. En láser se anotan fluencia, pulso y frecuencia; en toxina, producto, cantidad y lote. Los valores de la sesión anterior aparecen como punto de partida.
3. Puedes dejar creada una **cita tentativa** para la siguiente, o dejar que el sistema te la recuerde.
4. **Más → Servicios de estética** muestra todos los tratamientos en curso y permite editar el catálogo o agregar servicios nuevos.

El número de sesiones y los intervalos son referencias de agenda editables. La herramienta no sugiere parámetros.

## 12. Recordatorios

«Hoy» lista a quienes les corresponde su próxima sesión o control en los siguientes 7 días y no tienen cita. **Mensaje** abre WhatsApp con el texto; al confirmar «Ya lo envié» queda marcado. Solo aparece para quienes autorizan contacto. La herramienta no envía nada por su cuenta.

## 13. Calendarios de Google, Outlook y iPhone

- En el detalle de una cita: **Google Calendar**, **Outlook**, **Office 365** o **Calendario iPhone (.ics)**.
- En Agenda: **Exportar agenda (.ics)** lleva todas las citas futuras de una vez.
- **Traer otro calendario (.ics):** exporta tu calendario desde Google, Outlook o iCloud y tráelo. Sus eventos aparecen como bloqueos y avisan si una cita se cruza. Para actualizarlo, tráelo de nuevo con el mismo nombre.
- El asunto de los eventos es siempre neutro («Cita» y el nombre de la clínica), sin nombre de la paciente ni motivo.

## 14. Instalar la aplicación y compartir entre equipos

**Más → Instalar y carpeta compartida** tiene los pasos para iPhone, iPad, Windows y Mac.

Para dos computadores: **Elegir carpeta** (una carpeta de iCloud Drive, OneDrive, Google Drive o Dropbox), definir una contraseña y usar la misma en el otro equipo. Se sincroniza al abrir, cada minuto y medio y con el botón.

Para el iPhone o iPad: **Exportar caso editable** y guardarlo en esa misma carpeta desde «Archivos». Para traer uno: **Importar caso** y elegirlo allí.

## 15. Contenido para redes

**Más → Contenido para redes.** Parte de **Ideas de contenido**, escribe el texto y usa **Verificar y dejar listo**. Las piezas antes/después solo se generan con casos de la Biblioteca cuya paciente tenga la autorización de **Difusión pública**. La publicación se hace a mano en cada red.

## 16. Vista de consulta

Toca **Vista de consulta** en la barra superior antes de mostrar la pantalla a la paciente. Desaparecen Acompañamiento, la base de contactos, los indicadores, la etapa comercial, el seguimiento, los recordatorios, los respaldos y los ajustes. Quedan la ficha, las fotografías y simulaciones, las visitas, la propuesta, los documentos, la agenda y la biblioteca de casos. Para volver, toca **En consulta · salir**. La elección se conserva al cerrar y abrir.

Hoy, Pacientes y Agenda siguen mostrando nombres de otras pacientes: abre la ficha antes de girar la pantalla.

## 17. Base de contactos e importación

**Pacientes → Base de contactos** reúne a quienes tienen ficha y a quienes solo han escrito. Filtra por tipo de servicio (cirugía plástica, láser diodo, toxina, limpieza facial), procedimiento, género, país y si ya tienen un servicio realizado. **Exportar lo filtrado a Excel** descarga la lista con teléfonos y correos.

**Importar contactos** acepta un archivo de Excel o CSV, o una lista pegada, con una persona por fila. Columnas reconocidas: nombre, teléfono o WhatsApp, correo, interés o servicio, género, país y origen. Quien ya está (mismo teléfono) se omite. Los importados entran como intereses sin ficha y con permiso de contacto «sin registro».

## 18. Panel de indicadores y estrategia

**Más → Indicadores** muestra cuántas personas de la base tienen ficha, valoración y algún servicio realizado, con su porcentaje; qué servicios consumen quienes ya son pacientes; los procedimientos más consultados; y la composición por género y país. Para que los porcentajes sean reales, la base debe incluir a todas las personas que han escrito y cada servicio debe estar registrado en la ficha.

**Acompañamiento → Estrategia y SEO** es una lista de trabajo para posicionamiento local e internacional. Es una guía general; la publicidad de servicios de salud tiene reglas que conviene revisar con asesoría.

## 19. Precios, abonos y productos

**Precios.** En **Más → Servicios de estética**, cada servicio tiene un precio de referencia por sesión y un precio por zona (axilas, bikini, bozo…). Si un plan tiene zonas con precio, la sesión vale la suma de esas zonas. Cada cambio queda en el historial; los planes y sesiones ya registrados conservan su valor.

**Abonos.** En la ficha, pestaña **Estética y productos**, cada tratamiento muestra valor por sesión, realizado, abonado y saldo. **Registrar abono** anota fecha, valor y medio. Si lo abonado supera lo realizado, aparece como «abonado por adelantado» (sesiones pagadas por realizar).

**Productos.** En **Más → Productos** se crea el catálogo con nombre, marca, presentación, precio, descripción y foto. En la ficha, **Registrar venta de producto** asocia el producto a la paciente, con cantidad y si quedó pagado.

**Panel.** **Más → Indicadores → Estética y productos** agrupa por mes, trimestre o año: sesiones realizadas, productos vendidos, abonos y, hacia adelante, las citas de sesión ya reservadas. También muestra sesiones pendientes de los planes activos y su valor.

Es un control interno: no reemplaza la contabilidad ni la factura, y no lleva inventario.
