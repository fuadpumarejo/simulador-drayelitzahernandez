# Informe de experiencia de usuario

## Punto de partida

La versión 2 se organizaba por funciones: Simulación, Plan y propuesta, Seguimiento, Datos. Servía para simular, pero no acompañaba la consulta: «Nueva consulta» abría directamente el editor, las fotos no tenían orden ni fecha, y un solo estado intentaba describir a la paciente, su propuesta y su cirugía.

## Qué cambió y por qué

| Antes | Ahora | Principio |
|---|---|---|
| Cuatro pestañas por función | Hoy, Pacientes, Agenda, Más; ficha por tareas | Correspondencia con el trabajo real; Ley de Jakob |
| «Nueva consulta» abría el editor | Registro mínimo → regiones → cómo obtener fotos | Flujo de la consulta; Ley de Tesler |
| Lista plana de fotos | Galería por visita, con tipo, vista y fecha | Proximidad y región común |
| Vista deducida de la orientación | Clasificación explícita; «Por clasificar» visible | Prevención de errores |
| Los 15 módulos siempre a la vista | Sugeridos según la vista; el resto bajo «Ver todos» | Ley de Hick; divulgación progresiva |
| Deshacer solo del pincel | Deshacer y rehacer de todo lo editable | Control y libertad |
| «Guardado» optimista | Cinco estados reales del guardado | Visibilidad del estado |
| Un estado para todo | Atención, oportunidad, cita y episodio separados | Consistencia; lenguaje exacto |
| Importar reemplazaba la base | Vista previa, tres opciones y copia de recuperación | Prevención y recuperación |
| Varias llamadas a la acción | Una «Próxima acción acordada» | Efecto Von Restorff |
| Controles sobre la foto | La foto se ajusta al espacio libre; en móvil el editor oculta la navegación | La imagen es la protagonista |
| Solo arrastre para puntos | Flechas para puntos y máscaras | WCAG 2.5.7 |

## Las diez heurísticas

1. **Visibilidad del estado.** Indicador de guardado veraz; progreso «foto 3 de 7»; etapa y estado de atención en la cabecera de la ficha; barra de avance al exportar e importar.
2. **Correspondencia con el mundo real.** El recorrido sigue la consulta. Se dice «Lista para valoración», «Fecha deseada (sin reserva)», «Programada (aún no realizada)».
3. **Control y libertad.** Deshacer, rehacer, pausar la captura, repetir una foto, cancelar una importación, recuperar la versión reemplazada.
4. **Consistencia.** Un vocabulario: original, simulación ilustrativa, resultado posoperatorio real, copia censurada. Los mismos rótulos en pantalla, PDF y nombres de archivo.
5. **Prevención de errores.** No se marca «programada» sin cita real ni «realizada» sin registro con fecha pasada. Doble confirmación para sustituir la base o descargar sin censura.
6. **Reconocer antes que recordar.** «Continuar donde quedó», miniaturas, esquemas de posición, sugerencias de plan a partir de lo simulado.
7. **Flexibilidad.** Captura guiada o libre; importar en lote; atajos de teclado; soltar un archivo de caso sobre la ventana.
8. **Diseño mínimo.** «Hoy» solo muestra lo que requiere acción. Los datos de la paciente y las autorizaciones se pliegan. Los indicadores salen de la lista de pacientes.
9. **Recuperación de errores.** Mensajes que dicen qué pasó, qué quedó a salvo y qué hacer: contraseña, archivo truncado, HEIC, cuota, modo temporal.
10. **Ayuda.** Glosario y guía de transferencia en «Más». Texto de apoyo junto a cada decisión delicada.

## Accesibilidad

- Contraste AA calculado en diez combinaciones de color (mínimo 4,5:1). Se oscureció el gris de apoyo para lograrlo.
- Foco visible; los diálogos retienen el foco, se cierran con Escape y lo devuelven al origen.
- Todos los campos tienen etiqueta programática. El guardado y los avisos se anuncian con `aria-live`.
- Objetivos táctiles de al menos 44 px en móvil para las acciones principales.
- Reflujo sin desplazamiento horizontal al 200 %.
- Alternativa sin arrastre para puntos anatómicos, máscaras y la división antes/después.
- El estado nunca depende solo del color: lleva texto.
- Se respeta `prefers-reduced-motion`.

Sin verificar: lector de pantalla real (VoiceOver, NVDA) y recorrido completo solo con teclado. El lienzo de simulación es una herramienta visual: su resultado no tiene equivalente textual.

## Ética de la persuasión

- No hay urgencia artificial, cuentas regresivas ni descuentos por tiempo.
- La vigencia de la propuesta se rotula como comercial, no médica.
- «Pospuesta» no etiqueta a la paciente como «perdida» y se puede reactivar.
- Si pide no ser contactada, se bloquean tareas de contacto y borradores.
- Los mensajes son borradores para envío manual, sin datos clínicos, y ofrecen dejar de recibir contacto.
- Ningún procedimiento aparece como «recomendado» por el sistema.
- Los indicadores separan propuestas, programación e ingresos, y muestran su denominador.

## Lo que falta validar con personas

Todo lo anterior se evaluó por inspección y con pruebas automatizadas. No hubo sesiones con la doctora ni con su equipo. Queda por medir con ellas:

- Tiempo real de «nueva valoración → primera foto» y «lista → primera simulación».
- Si los nombres de las cinco secciones de la ficha se entienden sin explicación.
- Si la captura guiada estorba o ayuda a quien ya domina el protocolo.
- Si las etapas comerciales corresponden a cómo trabaja la clínica.
- Comodidad del editor en iPhone con una sola mano.
