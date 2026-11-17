# Formato de los paquetes `.yhcase` y `.yhbackup`

Versión de contenedor 1 · esquema de datos 3.

## Contenedor

```
"YHPK1\n"                      6 bytes
longitud de cabecera           u32 little-endian
cabecera JSON                  en claro, sin datos identificables
bloque 0: longitud u32 + cifrado
bloque 1: …
```

Cabecera:

```json
{"magic":"yh-portable","format":"yhcase","container":1,"app":"1.1.0-R6","createdAt":"2026-11-16T19:42:00-05:00",
 "kdf":{"name":"PBKDF2","hash":"SHA-256","iterations":310000,"salt":"<16 bytes base64>"},
 "cipher":{"name":"AES-GCM","bits":256,"nonce":"<8 bytes base64>","chunk":1048576},"size":1234567}
```

- **Clave:** PBKDF2-HMAC-SHA-256, 310 000 iteraciones, sal aleatoria de 16 bytes, a partir de la contraseña. Se usa Web Crypto del navegador.
- **Cifrado:** AES-256-GCM por bloques de 1 MiB del contenido. IV de 12 bytes = nonce aleatorio (8) + número de bloque (4).
- **Datos autenticados de cada bloque:** SHA-256 de la cabecera + número de bloque + marca de último bloque. Impide alterar la cabecera, reordenar, quitar o truncar bloques.
- La contraseña no se guarda en el archivo, en la base ni en registros. No hay recuperación.
- Si el navegador no ofrece Web Crypto (contexto no seguro), la exportación se bloquea: no se generan archivos sin cifrar.

Lo que protege: confidencialidad e integridad del archivo frente a quien no tenga la contraseña. Lo que no protege: una contraseña débil o compartida junto al archivo, ni los datos mientras están abiertos en el navegador.

## Contenido (ZIP interno)

```
manifest.json
data/patient.json                 ficha completa: visitas, citas, episodios, oportunidades, propuestas, tareas, autorizaciones
photos/<id>.json                  metadatos y estado editable de la foto
photos/<id>/orig.jpg              original de trabajo
photos/<id>/after.jpg             simulación renderizada (sin censura)
photos/<id>/maskS.png, maskL.png  máscaras de pincel
photos/<id>/brush.f32             desplazamientos del pincel (Float32, little-endian)
photos/<id>/thumb.jpg             miniatura (con censura)
photos/<id>/scn-<sid>-*.…         lo mismo por cada alternativa
docs/<id>.json, docs/<id>.bin     documentos adjuntos (solo si se marcaron al exportar)
```

`.yhbackup` agrega `data/settings.json`, `data/kv.json` (intereses, bloqueos, biblioteca) y un `patients/<id>.json` por paciente.

En los JSON, los binarios se referencian así:

```json
"orig":  {"$bin":"photos/ab12/orig.jpg","mime":"image/jpeg"},
"brush": {"$f32":"photos/ab12/brush.f32","length":86400}
```

`manifest.json`:

```json
{"format":"yhcase","schemaVersion":3,"appVersion":"1.1.0-R6","createdAt":"…","scope":"completo","variant":"visual",
 "recordIds":{"patient":"…","photos":["…"],"docs":[]},"counts":{"photos":2,"docs":0,"files":14},
 "summary":{"updatedAt":1794000000000,"procedures":["Rinoplastia"],"visits":1,"appts":1},
 "files":[{"path":"data/patient.json","size":2048,"sha256":"…"}],
 "caseHash":"<SHA-256 de la lista ordenada ruta:hash>"}
```

- `scope`: `completo` o `visita` (solo las fotos de una visita).
- `variant`: `visual` (sin documentos) o `ampliado`.
- `caseHash` identifica el contenido: permite reconocer que el mismo archivo ya se importó.

## Importación

1. Se lee la estructura de bloques sin descifrar. Archivo ajeno o truncado: se rechaza.
2. Se pide la contraseña y se descifra. Si un bloque no autentica: «contraseña incorrecta o archivo alterado».
3. Se abre el ZIP y se verifica **cada archivo** contra tamaño y SHA-256 del manifiesto.
4. Se valida el esquema: versión no superior a la de la herramienta, identificadores con formato estricto, fechas y horas válidas, imágenes en base64, longitudes de los arreglos, y que cada foto y documento pertenezca a la paciente del paquete.
5. Se muestra la vista previa. Si el caso existe: reemplazar, conservar ambas o cancelar.
6. Se escribe todo en **una sola transacción** de IndexedDB. Si algo falla, no cambia nada.

Al reemplazar se guarda antes la versión local como copia de recuperación. «Conservar ambas» crea una ficha aparte con identificadores nuevos y vínculos reescritos. En un paquete de alcance `visita`, las fotos locales de otras visitas se conservan.

## Compatibilidad

- Un paquete con `schemaVersion` mayor que el de la herramienta se rechaza con el mensaje «actualiza la herramienta».
- Uno con versión menor se migra en memoria antes de escribir.
- El respaldo JSON de la versión 2 (`"app":"yh-simulador","v":1`, sin cifrar) se puede importar: se convierte y se trata como respaldo completo.

## Límites conocidos

- El paquete se arma y se abre en memoria. Un caso típico (10 a 30 fotos) pesa entre 5 y 30 MB. Un respaldo de cientos de megabytes puede fallar en iPhone o iPad; hacerlo desde el computador.
- No hay fusión campo por campo: si los dos equipos editaron el mismo caso, hay que elegir una versión o conservar ambas.
- Los documentos adjuntos solo viajan si se marcan. Sin ellos, el PDF emitido de una propuesta no estará disponible en el otro equipo, aunque sí su registro.
