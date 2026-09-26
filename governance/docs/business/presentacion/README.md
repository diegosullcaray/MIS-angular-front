# Video de presentación del nuevo MIS

Material del video de lanzamiento para público general (1:12, 1920 × 1080).

| Archivo | Qué es |
|---|---|
| `MIS-nuevo-sistema.mp4` | Video montado, sin voz ni música. |
| `guion.html` | Guion escena por escena con la locución para grabar encima, con los mismos tiempos. |
| `grabar-video.spec.ts` | Script de Playwright que graba las escenas del sistema con datos de ejemplo. |

Las cifras, zonas y nombres que aparecen son de ejemplo, no datos reales.

## Pendiente antes de publicar

- Grabar la voz con el texto del guion.
- Agregar una pista de música con licencia de uso interno.
- Cambiar "Muy pronto en todas las agencias" por la fecha de lanzamiento cuando exista.

## Volver a grabar

El script vive aquí y no en `e2e/` para que no corra con la suite de pruebas. Para usarlo:

1. Cópialo a la carpeta de pruebas E2E del proyecto con el nombre zz-video.spec.ts.
2. Ejecútalo con Playwright en el proyecto desktop-chromium, con un solo worker y la variable VIDEO_DIR apuntando a la carpeta de salida.
3. Monta los .webm de cada escena con ffmpeg (1920 × 1080, 30 fps, fundidos de 0,6 s).
4. Borra la copia de la carpeta de pruebas.
