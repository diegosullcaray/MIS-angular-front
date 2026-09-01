# Migración del legado STG

Lo que queda de la migración del sistema legado a la app Host, una vez que el
código migrado pasó a ser la fuente de verdad.

| Archivo | Qué es |
|---|---|
| [`sintaxis.json`](sintaxis.json) | Inventario del árbol de "Actividad Diaria" del legado: nodos, reportes y rutas. Se actualiza cuando cambia el menú del legado. |

El código fuente del legado, que es la referencia real al migrar una pantalla,
está en [`../07-modulos/`](../07-modulos/).

## Cómo se migra una pantalla

1. Buscá la pantalla en `docs/07-modulos/` y leé **su componente entero**, no la
   primera mitad: es donde suelen estar los bloques comentados, las pestañas y
   los filtros que no se ven desde arriba.
2. Resolvé el `cod_rep`, el host y el motor contra `cra-map.ts` y los
   `report-cra-*` del legado. **El motor lo decide el host, no el `reportType`
   del mapa.**
3. Seguí [`../02-arquitectura/02-anatomia-de-un-modulo.md`](../02-arquitectura/02-anatomia-de-un-modulo.md)
   para dónde va cada cosa, y
   [`../02-arquitectura/03-tablas-de-reportes.md`](../02-arquitectura/03-tablas-de-reportes.md)
   para la tabla.
4. Migrá **lo que el legado muestra**, ni más ni menos. Si una parte no se puede
   reproducir sin inventar datos —una meta que no se sabe de dónde sale, por
   ejemplo—, se deja fuera y se anota como pendiente. Poner números inventados en
   un tablero de banca es peor que no mostrarlos.

## Registro de lo migrado

No se lleva en un `.md`: se lee del código. El inventario de pantallas son los
`.routes.ts` de cada módulo, y lo que funciona lo dicen los tests.
