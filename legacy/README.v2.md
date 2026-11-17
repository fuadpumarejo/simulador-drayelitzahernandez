# Simulador Dra. Yelitza Hernández

Herramienta web para simular resultados de cirugía plástica y estética sobre fotografías 2D, armar la propuesta comercial y hacer seguimiento de la paciente. Funciona en computador, iPhone y iPad desde el navegador, sin instalar nada.

Desarrollada para SKIND Aesthetic Center (Barranquilla, Colombia).

## Qué hace

- **Simulación en consulta:** deformación de malla en WebGL y retoque de piel sobre cualquier foto. Vistas Antes, Dividir (línea arrastrable) y Simulación. Modo **Presentar** a pantalla completa.
- **Módulos:** rinoplastia (frente y perfil), ojos, cejas y frente, lifting y surcos, contorno facial, labios, mentón y cuello, otoplastia, mamas, abdomen y cintura, glúteos, muslos, brazos y pinceles libres.
- **Plan y propuesta:** catálogo editable de 32 procedimientos (quirúrgicos y no quirúrgicos), valores, descuento, tiempos quirúrgicos sumados y fecha estimada. Sugiere agregar al plan lo que se simuló.
- **Seguimiento:** etapa, próximo contacto e historial por paciente.
- **Exportación:** propuesta en PDF (antes/después), plan en Excel con fórmulas, base completa en Excel y respaldo JSON.

## Uso

Es un solo archivo: `index.html`.

- **Local:** abrir `index.html` en Chrome, Safari o Edge.
- **GitHub Pages:** en el repositorio, *Settings → Pages → Deploy from a branch → `main` / root*. La herramienta queda en `https://<usuario>.github.io/<repositorio>/`.
- En iPhone/iPad, el botón *Tomar foto* abre la cámara nativa. En computador se carga un archivo.

Dependencias externas (cargadas desde cdnjs): jsPDF 2.5.1 y SheetJS 0.18.5. Requiere conexión la primera vez para exportar PDF/Excel.

## Privacidad de los datos

- Pacientes, fotos y planes se guardan **solo en el navegador del dispositivo** (IndexedDB). No hay servidor ni sincronización.
- Hacer respaldos periódicos desde *Datos → Respaldo JSON*.
- Los datos de salud son sensibles (Ley 1581 de 2012, Colombia): **no subir al repositorio** respaldos, PDF, Excel ni fotos de pacientes. El `.gitignore` ya excluye estos archivos.
- Si el repositorio es público, el código es visible, pero ningún dato de pacientes viaja con él.

## Estado y límites

- Probado con ilustración de ejemplo; falta calibrar la intensidad de los deslizadores con fotos clínicas reales.
- Los puntos anatómicos se marcan a mano (sin detección automática).
- Los tiempos de 15 procedimientos son valores de referencia pendientes de confirmar por la doctora; los valores comerciales parten en 0.

Más detalle en [`docs/NOTAS-TECNICAS.md`](docs/NOTAS-TECNICAS.md).

## Licencia

Sin licencia definida: todos los derechos reservados. Definir antes de hacer público el repositorio.
