# Simulador SKIND · Dra. Yelitza Hernández

Herramienta web para acompañar la consulta de cirugía plástica y estética: registrar a la paciente, tomar o importar fotografías por región y vista, simular sobre fotos 2D, proteger zonas sensibles, armar la propuesta y dar seguimiento a lo que la paciente acuerde. Funciona en computador, iPhone y iPad desde el navegador.

Versión **1.1.0-R6** · esquema de datos 3 · evolución de la versión 2 (se conserva en `legacy/`).

> Es una herramienta de apoyo visual. Las simulaciones son ilustrativas: no predicen ni garantizan un resultado. No es un dispositivo médico certificado ni una historia clínica electrónica.

## Publicar en GitHub Pages

Solo hace falta un archivo: **`index.html`**. No usa CDN ni conexión a otros servicios: las fuentes y las librerías van dentro.

1. Sube el contenido de esta carpeta a la raíz del repositorio (o reemplaza solo `index.html` si ya lo tenías publicado).
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

140 verificaciones automatizadas con datos ficticios, todas aprobadas en Chrome. De las 120 pruebas del encargo: 92 aprobadas, 21 parciales, 1 pendiente de dispositivo real y 6 no implementadas. **No se probó en iPhone ni iPad físicos ni con fotografías reales.** Matriz completa y protocolo de validación en [`docs/PRUEBAS.md`](docs/PRUEBAS.md).

## Estructura

```
index.html            herramienta completa (generada; es lo único que se publica)
src/                  código fuente: shell.html, css/app.css, js/*.js
vendor/               jsPDF 2.5.1, SheetJS 0.18.5, fflate 0.8.2, fuentes Marcellus y Albert Sans
build.py              arma index.html desde src/ y vendor/
tests/                seis suites Playwright con datos ficticios
docs/                 manual, formato de archivos, arquitectura, informe de UX, matriz de pruebas
ejemplo/              caso ficticio cifrado
legacy/               versión 2 original, intacta
```

Para modificar: edita `src/`, ejecuta `python3 build.py` y sube el nuevo `index.html`.

## Licencias de terceros

jsPDF (MIT), SheetJS Community Edition (Apache-2.0), fflate (MIT), Marcellus y Albert Sans (SIL OFL 1.1). El código propio no tiene licencia definida: todos los derechos reservados.
