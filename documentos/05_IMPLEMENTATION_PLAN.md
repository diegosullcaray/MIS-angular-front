# 05 — Implementation Plan (Ruta Crítica de la Migración)
> **Proyecto:** Task Reportes — Orquestador de Reportes Financieros
> **Documentación Activa:** [README](./README.md) | [01_PRD_MIGRACION](./01_PRD_MIGRACION.md) | [02_TRD_ARQUITECTURA](./02_TRD_ARQUITECTURA.md) | [03_PARALELISMO_SCHEDULING](./03_PARALELISMO_SCHEDULING.md) | [04_EXCEL_CORREO](./04_EXCEL_CORREO.md) | [05_IMPLEMENTATION_PLAN](./05_IMPLEMENTATION_PLAN.md)
> **Versión:** 1.0.0
> **Fecha:** 2026-07-20
> **Estado:** ⏳ Pendiente de iniciar (especificación completa en docs 01–04)

---

## Resumen Ejecutivo

Plan de ruta crítica para migrar `task-reportes-back` de Node.js a **Spring Boot 3 +
Java 21**, preservando el paralelismo estricto (`Promise.all` →
`@Async` + `CompletableFuture.allOf()`), los horarios cron y el flujo
consultas → Excel → correo. Cierra con un período de **convivencia** que valida la
paridad de datos antes de apagar Node.js.

---

## Convenciones de este Documento

| Símbolo | Significado |
|---|---|
| `[ ]` | Tarea pendiente |
| `[/]` | Tarea en progreso / parcial |
| `[x]` | Tarea completada |
| 🔴 | Tarea bloqueante |

---

## ⏳ FASE 0 — Relevamiento del Proyecto Node.js 🔴

> Sin este inventario no hay migración fiable. Todo lo demás depende de él.

- [ ] **F0-01** 🔴 · Inventariar **todos los cron jobs**: expresión, zona horaria, reporte que dispara (tabla `cron Node → cron Spring 6 campos`)
- [ ] **F0-02** 🔴 · Extraer **todas las queries SQL** por reporte (texto exacto, parámetros, BD/esquema origen, volumen aproximado de filas)
- [ ] **F0-03** · Documentar por reporte: hojas del Excel, columnas, formatos, orden de filas
- [ ] **F0-04** · Inventariar destinatarios, asuntos y cuerpos de correo por reporte (y por ambiente)
- [ ] **F0-05** · Identificar dependencias entre queries (cuáles son realmente paralelas y cuáles requieren resultados previas)
- [ ] **F0-06** · Medir tiempos actuales por reporte en Node.js (baseline para CA-03 y las métricas de éxito)
- [ ] **F0-07** · Confirmar accesos: usuario de BD de solo lectura, credenciales SMTP, límites del relay

**Criterio de salida:** matriz "Reporte × (cron, queries, hojas, destinatarios, baseline)" revisada por negocio.

---

## ⏳ FASE 1 — Scaffolding Spring Boot 🔴

- [ ] **F1-01** · Proyecto Maven `task-reportes-back` (Java 21, Spring Boot 3.3) con el `pom.xml` del [doc 02 §2](./02_TRD_ARQUITECTURA.md)
- [ ] **F1-02** · Estructura de paquetes `config / scheduler / service / repository / excel / mail / web / shared` (doc 02 §3)
- [ ] **F1-03** · `application.yml` con perfiles `dev` / `prod` + `@ConfigurationProperties` tipadas (`ReportesProperties`, `ExecutorProperties`)
- [ ] **F1-04** · `logback-spring.xml` con `%X{ejecucionId}` en el patrón (RN-07)
- [ ] **F1-05** · Conexión a BD verificada (`JdbcTemplate` + HikariCP) y Actuator health en verde
- [ ] **F1-06** · `docker-compose.dev.yml` con BD de pruebas + Mailpit (SMTP local)

---

## ⏳ FASE 2 — Núcleo de Paralelismo y Scheduling 🔴

> Especificación completa en [doc 03](./03_PARALELISMO_SCHEDULING.md).

- [ ] **F2-01** 🔴 · `AsyncConfig`: bean `reportTaskExecutor` (core=max=8, cola 50, `CallerRunsPolicy`, `MdcTaskDecorator`, shutdown graceful)
- [ ] **F2-02** · `SchedulingConfig`: `ThreadPoolTaskScheduler` con pool ≥ nº de reportes coincidentes (SC del doc 03 §5.1)
- [ ] **F2-03** · `ReporteJdbcRepository` con métodos `@Async("reportTaskExecutor")` que retornan `CompletableFuture<List<T>>`
- [ ] **F2-04** · Interfaz `ReporteService` (`codigo()`, `generar(corte)`) + `ReporteResultado` + `ReporteException`
- [ ] **F2-05** · `ReporteScheduler` genérico: MDC, fecha de corte, captura total de fallos (RN-03)
- [ ] **F2-06** 🔴 · **Test de paralelismo**: reporte de prueba con 3 queries `pg_sleep(3)` → duración total ~3s (no ~9s) y logs en hilos `report-exec-*` distintos (valida CA-02/CA-03)
- [ ] **F2-07** · Test de fallo parcial: una query lanza excepción → `allOf` falla, el scheduler lo captura y las demás tareas programadas siguen vivas

---

## ⏳ FASE 3 — Excel y Correo (componentes genéricos)

> Especificación completa en [doc 04](./04_EXCEL_CORREO.md).

- [ ] **F3-01** · `ExcelSheetSpec` + `FormatoCelda` (TEXTO / ENTERO / MONTO / FECHA / PORCENTAJE)
- [ ] **F3-02** · `ExcelGenerator` con `SXSSFWorkbook(100)`, estilos únicos por workbook, autofiltro, hoja vacía con leyenda (XL-01..XL-07)
- [ ] **F3-03** · `EmailService` con `MimeMessageHelper`, adjuntos, reintentos 2s/4s/8s y limpieza del archivo tras envío (MA-01..MA-06, RN-08)
- [ ] **F3-04** · Test: generar `.xlsx` de 200k filas sin OOM y abrirlo en Excel/LibreOffice sin advertencias
- [ ] **F3-05** · Test de correo contra Mailpit: adjunto correcto, asunto normado, cuerpo con totales

---

## ⏳ FASE 4 — Migración de Reportes (uno a uno)

> Patrón por reporte: subpaquete + `*Queries` + `*Service` + columnas + bloque YAML (AR-07).
> **Orden sugerido:** empezar por el de menor complejidad para validar el patrón.

### Reporte 1: Desembolso Canal
- [ ] **F4-01** · `DesembolsoCanalQueries` (SQL 1:1 desde Node.js, parámetros nombrados)
- [ ] **F4-02** · `DesembolsoCanalService` (lanzar todas las queries → `allOf` → Excel → correo)
- [ ] **F4-03** · Paridad de datos vs. Node.js para 3 fechas de corte distintas (CA-01)

### Reporte 2: Cartera Heredada
- [ ] **F4-04** · `CarteraHeredadaQueries` + `CarteraHeredadaService`
- [ ] **F4-05** · Paridad de datos vs. Node.js (CA-01)

### Reporte 3: Fondeo Estable
- [ ] **F4-06** · `FondeoEstableQueries` + `FondeoEstableService`
- [ ] **F4-07** · Paridad de datos vs. Node.js (CA-01)

### Reportes restantes (según inventario F0)
- [ ] **F4-08** · Migrar los demás reportes relevados en FASE 0 con el mismo patrón

### API manual
- [ ] **F4-09** · `ReporteController` `POST /api/v1/reportes/{codigo}/ejecutar` → `202 Accepted` (CA-07) + `GlobalExceptionHandler`

---

## ⏳ FASE 5 — Convivencia, Métricas y Cut-over 🔴

- [ ] **F5-01** · Dockerfile multi-stage (doc 02 §6) + despliegue en ambiente de convivencia (1 réplica, `TZ=America/Lima`)
- [ ] **F5-02** 🔴 · **Convivencia**: Node.js y Spring Boot generan en paralelo durante ≥ 2 semanas; destinatarios reales solo reciben el de Node.js (Spring envía a buzón de validación)
- [ ] **F5-03** · Comparación automática diaria de los `.xlsx` de ambos sistemas (filas, columnas, sumas de control por hoja)
- [ ] **F5-04** · Métricas Micrometer del pool (`executor.active/queued`) y de Hikari; ajuste fino de tamaños (doc 03 §4)
- [ ] **F5-05** · Comparar tiempos vs. baseline de F0-06 (meta: ≤ 100%)
- [ ] **F5-06** 🔴 · **Cut-over**: cambiar destinatarios reales a Spring Boot, pausar crons de Node.js (sin borrar), monitorear 1 semana
- [ ] **F5-07** · Apagado definitivo de `task-reportes-back` Node.js + archivado del repo

---

## Resumen de Ruta Crítica

```
FASE 0 (Relevamiento) ─► FASE 1 (Scaffolding) ─► FASE 2 (Paralelismo + Scheduling)
                                                          │
                                                          ▼
                                                 FASE 3 (Excel + Correo)
                                                          │
                                                          ▼
                                          FASE 4 (Reportes uno a uno, patrón repetible)
                                                          │
                                                          ▼
                                    FASE 5 (Convivencia ─► Cut-over ─► Apagado Node.js)
```

---

## Criterios de Aceptación vs. Fases

| Criterio | Fase | Estado |
|---|---|:---:|
| CA-01: Paridad de datos del `.xlsx` por reporte | FASE 4 + 5 | ⏳ |
| CA-02: Queries en paralelo (hilos `report-exec-*`) | FASE 2 (F2-06) | ⏳ |
| CA-03: Duración ≈ query más lenta, no la suma | FASE 2 (F2-06) + 5 | ⏳ |
| CA-04: Mismos horarios cron que Node.js | FASE 0 (F0-01) + 5 | ⏳ |
| CA-05: Fallo aislado por reporte + notificación | FASE 2 (F2-07) | ⏳ |
| CA-06: Correos con adjunto y asunto normado | FASE 3 (F3-05) | ⏳ |
| CA-07: Endpoint manual `202 Accepted` | FASE 4 (F4-09) | ⏳ |
| CA-08: Actuator con métricas del executor | FASE 5 (F5-04) | ⏳ |
