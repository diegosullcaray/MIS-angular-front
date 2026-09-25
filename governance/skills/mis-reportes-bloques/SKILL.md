---
name: mis-reportes-bloques
description: Crear, modificar, agrupar o retirar reportes de MIS Host preservando motores, jerarquía, fecha y semántica legacy; diagnosticar cifras incorrectas usando la guía canónica y el linaje.
---

# Reportes por bloques — MIS Host

Leer la [guía canónica de reportes](../../docs/development/report-creation-guide.md)
para motor, jerarquía, métodos de consulta, archivos y criterio de terminado.
Esta skill no replica esas tablas.

## Procedimiento

1. Ubicar el dueño y registrar fuente de `cod_rep`, ruta legacy y parámetros.
   Para reporte nuevo/cambio sensible, completar la
   [ficha](../../docs/templates/report-spec-template.md). No deducir contrato por nombres.
2. Confirmar jerarquía, fecha/formato, orden de bloques y significado de vacío
   contra el legacy. OAuth/Winder/backend están congelados.
3. Normalizar datos en `utils` del reporte y declarar metadatos de presentación;
   las tablas compartidas no deben interpretar nombres del dominio.
4. Usar `BloqueReporteService` y el armazón adecuado. Con
   `ReporteSimpleBase`, enlazar `[error]="error()"` además de carga y tabla.
   La base conserva el error y cancela por filtros/destrucción; el armazón lo muestra.
   Las tablas solo resuelven carga/vacío y formato, no errores de consulta.
5. Cumplir el [estándar de reportes](../../docs/components/estandar-reportes.md): filtros
   propios en `<app-grupo-filtros>` a todo el ancho, tablas con resaltado de fila, formato de
   números desde `format.mode`/`unit` del backend (nunca redondear en el reporte), notas como
   "Expresado en…" en `<app-chip-informativo>` y `[ajustarAncho]="true"` en tablas anchas.
   `npm run audit:governance` falla si se rompen.
6. Consultas fuera de la base: cancelación anterior + destrucción, limpieza de
   resultados obsoletos, error persistente y reintento.
7. Pruebas focalizadas para datos, vacío, payload inválido/error y respuestas fuera
   de orden. E2E de flujo para cambios sensibles; aplicar el
   [proceso según riesgo](../../docs/development/quality-gates.md).
8. Regenerar inventario si cambian rutas/pruebas, ejecutar verificaciones y actualizar
   contrato solo si cambió realmente.

Para una cifra incorrecta, seguir [linaje](../../docs/data/lineage.md), no modificar
filtros o cálculos hasta localizar el borde defectuoso.

## Vistas que agrupan reportes

Un panel que reúne varios reportes (p. ej. el panel unificado del asesor) no
declara `cod_rep` propios. Delega en los servicios existentes y deja la
presentación en una pantalla del mismo subdominio.

Los KPI derivados salen solo de una fila de totales (`style === 1`) o de un
bloque de una fila: nunca se suman filas en el frontend. Ver
[ADR-0006](../../docs/architecture/adr/ADR-0006-panel-unificado-en-reportes.md).

## Retirar un reporte

Seguir la [guía de retiro](../../docs/development/report-retirement-guide.md) y
registrarlo en [ADR-0007](../../docs/architecture/adr/ADR-0007-retiro-de-reportes-sin-uso.md).

En resumen:

- Partir del SCODSEC y la ruta legacy, no del nombre visible, porque `rda` y `rma` repiten nombres.
- Borrar pantalla, métodos exclusivos, constantes y pruebas.
- Conservar `core/winder`.
- Cerrar con las reglas `modulo-enrutado`, `e2e-rutas-vigentes` y `linea-base-vigente`.
