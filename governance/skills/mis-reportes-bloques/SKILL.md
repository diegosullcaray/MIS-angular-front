---
name: mis-reportes-bloques
description: Crear o modificar reportes de MIS Host preservando motores, jerarquía, fecha y semántica legacy; diagnosticar cifras incorrectas usando la guía canónica y el linaje.
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
5. Consultas fuera de la base: cancelación anterior + destrucción, limpieza de
   resultados obsoletos, error persistente y reintento.
6. Pruebas focalizadas para datos, vacío, payload inválido/error y respuestas fuera
   de orden. E2E de flujo para cambios sensibles; aplicar el
   [proceso según riesgo](../../docs/development/quality-gates.md).
7. Regenerar inventario si cambian rutas/pruebas, ejecutar verificaciones y actualizar
   contrato solo si cambió realmente.

Para una cifra incorrecta, seguir [linaje](../../docs/data/lineage.md), no modificar
filtros o cálculos hasta localizar el borde defectuoso.
