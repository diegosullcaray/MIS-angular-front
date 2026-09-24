# ADR-0006: El panel unificado del asesor vive en `reportes` y se enruta desde `app.routes.ts`

- Estado: Vigente
- Fecha: 2026-09-23
- Responsables: Frontend MIS Host

## Contexto

El asesor consultaba sus 17 reportes de `rda/sectorista` (Cartera, Monitor de Metas de Desembolso, Detalle de efectividades…) como pantallas sueltas, cada una con su selector de asesor. Se pidió un panel único, ordenado por uso real (peticiones del menú legacy), con KPI, gráficos y tablas.

Los servicios que conocen esos `cod_rep`, bloques y parámetros ya existían en `reportes/components/analista/services/`. La URL del panel, en cambio, debía quedar bajo `/app/analista/`, y un primer prototipo vivía en el módulo `analista` con datos ficticios.

Si ese módulo hubiera importado los servicios de `reportes`, habría roto la regla `modulos-desacoplados` (error del auditor). Copiarlos habría duplicado contratos congelados de Ant.

## Decisión

- El panel es una pantalla del subdominio Analista de `reportes`: `reportes/components/analista/items/panel-asesor/`.
- Consume los servicios existentes a través de `PanelAsesorConsultasService`, que despacha por `SCODSEC` (`L_CART_SEC`, `L_MONI_DESE_SEC`…). No declara `cod_rep` propios ni cambia parámetros.
- La URL `/app/analista/panel-unificado` se declara con `loadComponent` en `app.routes.ts`. La raíz de rutas no es un módulo, así que componer ahí no crea acoplamiento entre módulos.
- El orden de categorías y reportes se deriva del tráfico histórico (`peticiones`), que no se muestra al asesor.
- Los KPI de cartera salen solo de la fila de totales (`style === 1`) o de un bloque de una sola fila. El panel no suma ni infiere totales.

## Consecuencias

- **A favor:** un único dueño de cada consulta. Corregir un reporte corrige también el panel.
- **Costo:** el inventario de módulos no ve esta ruta, porque solo sigue `loadChildren`. Por eso el generador lista aparte las pantallas enlazadas directo desde `app.routes.ts`.
- **Límite:** las acciones que el panel no replica (por ejemplo, "Nuevo prospecto") se abren desde "Abrir reporte completo" en la pantalla original.
- **Riesgo:** si un reporte cambia su forma de resultado, el panel lo muestra con las mismas tablas genéricas. Las pruebas de `panel-asesor-consultas.service.spec.ts` comprueban que los 17 códigos llegan a Ant con `tip_cod: 2` y el DNI del asesor.

## Evidencia

- **Implementación:**
  - `src/app/pages/modules/reportes/components/analista/items/panel-asesor/`
  - `services/panel-asesor.service.ts`
  - `services/panel-asesor-consultas.service.ts`
- **Reglas puras:** `utils/panel-asesor.util.ts` y su spec.
- **Ruta:** `src/app/app.routes.ts` (`analista/panel-unificado`).
- **Acceso en menú:** `src/app/pages/full-pages/layout/utils/panel-unificado-menu.util.ts`.
- **E2E:** `e2e/panel-unificado.spec.ts`.
