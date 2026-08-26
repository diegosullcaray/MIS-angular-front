# Migraciones — Actividad Diaria

Carpeta de trabajo de la migración del sistema legado STG a la app Host.

## Por dónde empezar

| Archivo | Qué es | Cuándo se toca |
|---|---|---|
| [`sintaxis.json`](sintaxis.json) | Inventario del árbol de "Actividad Diaria": nodos, reportes y rutas | Cuando cambia el menú del legado |
| [`estado-migracion.md`](estado-migracion.md) | Qué está migrado y qué falta, auditado contra el código real | Al terminar cada ejercicio |
| [`promt-01.md`](promt-01.md) | El prompt de migración (v2) | Cuando un ejercicio deja una lección nueva |
| [`ejercicio-02.md`](ejercicio-02.md) | Enunciado del lote pendiente | — |

## Historial

| Ejercicio | Módulo | Alcance | Resultado |
|---|---|---|---|
| 01 | Cartera en Mora | 17 pantallas | [`ejercicio-01-resultado.md`](ejercicio-01-resultado.md) · enunciado original en [`ejercicico-01.md`](ejercicico-01.md) |
| 02 | Comercial Ejecutivo · Reportes PDM · Movilidad | 8 reportes | pendiente — [`ejercicio-02.md`](ejercicio-02.md) |

## Ciclo de trabajo

1. Tomar el enunciado del ejercicio y el prompt (`promt-01.md`).
2. Migrar, verificando contra el legado (nunca asumiendo).
3. Verificar: `tsc` app + spec, build de producción, `ng test`, smoke e2e.
4. Escribir `ejercicio-NN-resultado.md`.
5. Actualizar `estado-migracion.md` (trae el script para regenerar la tabla).
6. Si el ejercicio dejó una lección que se puede generalizar, incorporarla al
   prompt y anotarla en su tabla de cambios.

El paso 6 es el que hace que esto mejore: el prompt v2 salió del ejercicio 01, y
las dos trampas nuevas (comentarios en el mapa legado, `OFI_3` ≠ oficina)
salieron de auditar el lote del ejercicio 02 antes de empezarlo.
