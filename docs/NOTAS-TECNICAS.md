# Notas técnicas · Simulador Dra. Yelitza Hernández

Versión 2 (2026-11-16). Página web de un solo archivo (`index.html`).

## Decisión de producto
- Simulación sobre fotografías 2D. El 3D (escaneo con Face ID, fotogrametría o app nativa) se evaluó y se descartó por esfuerzo.
- Prioridad: que la simulación sea fluida en plena consulta. El seguimiento es complemento.
- Tema visual único: blanco con morado.

## Arquitectura
- HTML + CSS + JS en un solo archivo, sin build.
- Motor de deformación WebGL: malla de ~180 vértices en el lado largo, desplazamiento por pincel y desplazamiento paramétrico. Retoque de piel por separación de frecuencias.
- Cada módulo se define con puntos anatómicos marcados a mano y deslizadores.
- Almacenamiento: IndexedDB (kv, patients, photos), con respaldo en memoria si no está disponible. Respaldo/importación JSON.
- Librerías (cdnjs): jsPDF 2.5.1, SheetJS xlsx 0.18.5.
- Fuentes: Marcellus y Albert Sans.

## Módulos de simulación
Rostro: rinoplastia frente y perfil; ojos, cejas y frente; lifting y surcos; contorno facial; labios; mentón y cuello de perfil; otoplastia.
Cuerpo: mamas; abdomen y cintura (frente); abdomen y glúteo (perfil); glúteos (espalda); muslos; brazos.
Pinceles libres: mover, empujar, aumentar, reducir, suavizar piel, atenuar surco, restaurar, deshacer.

## Catálogo (editable en Ajustes)
Tiempos dados por la doctora: rinoplastia 3–4 h · blefaroplastia 1–2 h · lifting facial 4 h (con blefaroplastia 5–6 h) · otoplastia 1–2 h · mamoplastia 2–3 h · abdominoplastia 2 h · lipoescultura 4–5 h.

Tiempos de referencia (resaltados hasta confirmar): lifting de cejas 1–2 h · lifting de cuello 2–3 h · mentoplastia 1–2 h · bichectomía 0,5–1 h · liposucción de papada 1–1,5 h · lip lift 1 h · mastopexia 2–3 h · mastopexia con implantes 3–4 h · ginecomastia 1–2 h · liposucción por zonas 1–3 h · miniabdominoplastia 1–2 h · aumento de glúteos 2–4 h · braquioplastia 2–3 h · lifting de muslos 2–3 h · labioplastia 1–2 h.

No quirúrgicos (en consultorio, no suman tiempo): ácido hialurónico (labios, surcos, ojeras, pómulos, mentón, línea mandibular), rinomodelación, toxina botulínica, bioestimuladores, hilos tensores.

Todos los valores comerciales parten en 0.

## Límites vigentes
- Captura: en iPhone/iPad, *Tomar foto* abre la cámara nativa; en computador se carga un archivo. La cámara web en vivo no está disponible en la versión alojada en Claude.
- Puntos anatómicos manuales; sin detección automática.
- Datos solo en el navegador del dispositivo; sin sincronización.
- Probado con ilustración, no con fotos clínicas reales; falta calibrar intensidades.

## Pendientes
- Base de pacientes en la nube (datos sensibles; autorización de la paciente y Ley 1581 de 2012).
- Confirmar tiempos de referencia y cargar valores base.
- Fotos de control posoperatorio comparadas con la simulación.
- Plantillas de vistas por procedimiento.
- Detección automática de puntos faciales.
