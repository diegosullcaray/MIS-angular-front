# ANEXO TÉCNICO: MATRIZ DE EVIDENCIAS, MAPEO DE MÓDULOS Y ESTÁNDARES ACADÉMICOS

**Documento Complementario para Tesis de Grado**  
**Repositorio de Investigación:** `c:\Users\24681\Videos\DD\investigacion\`  

---

## 1. MAPEO COMPARATIVO DE MÓDULOS DE NEGOCIO (AS-IS VS. TO-BE)

| # | Dominio de Negocio | Ruta en Menú (`act_sec`) | Ruta Legacy (`MIS-FUENTE`) | Ruta Moderna (`MIS-angular-front`) | Puerto Backend / `appId` | Estado de Migración |
|---|---|---|---|---|---|---|
| 1 | **Home / Mi Espacio** | `dashboard` | `pages/full-pages/layout/components/desktop` | `pages/modules/home/` | 6302 (`app`) | Migrado 100% |
| 2 | **Dashboards (Power BI)** | `dashboards` | `pages/modules/reportes-e/` | `pages/modules/dashboard/` | 6302 (`app`) | Migrado 100% (CommonJS aislado) |
| 3 | **Actividades Comerciales** | `actividades` | `pages/modules/actividades/` | `pages/modules/actividades/` | 6302 (`app`) | Migrado (Módulo Piloto Refactorizado) |
| 4 | **Analista Principal / Listas** | `analista` | `pages/modules/analista/` | `pages/modules/analista/` | 6302 (`app`) | Migrado Parcial (Solo Principal y Listas) |
| 5 | **Categorización Analista** | `analista/categorizacion` | `pages/modules/analista/` | `pages/modules/categorizacion/` | 6302 (`app`) | Migrado (Ruta Prioritaria en Router) |
| 6 | **Presupuesto Financiero** | `presupuesto` | `pages/modules/presupuesto/` | `pages/modules/presupuesto/` | 6302 (`app`) | Migrado 100% |
| 7 | **Incentivos Comerciales** | `incentivos3` | `pages/modules/incentivos3/` | `pages/modules/incentivos/` | 6302 (`app`) | Migrado (Tercera Generación) |
| 8 | **Framework ESG** | `esg` | `pages/modules/framework-esg/` | `pages/modules/framework-esg/` | 6302 (`app`) | Migrado 100% |
| 9 | **Consultas Base Negativa** | `cons_base_negativa` | `pages/modules/basenegativa/` | `pages/modules/herramientas/` | 6302 (`app`) | Migrado 100% |
| 10 | **Kaypacha (Geolocalización)** | `Kaypacha__` | `pages/modules/Kaypacha3/` | `pages/modules/kaypacha/` | 6302 (`app`) | Migrado (MapLibre GL Vectorial) |
| 11 | **Ranking Comercial (K)** | `ranking-k` | `pages/modules/ranking-k/` | `pages/modules/ranking-k/` | 6302 (`app`) | Migrado 100% |
| 12 | **Repositorio de Reportes** | `reportes` | `pages/modules/reportes/` | `pages/modules/reportes/` | 5304 (`reporting`) | Migrado (Subdividido en 6 sub-áreas) |

---

## 2. EVALUACIÓN Y MITIGACIÓN DE VULNERABILIDADES (OWASP TOP 10 FRONTEND & AUDITORÍA)

| Código | Severidad | Hallazgo de Auditoría | Riesgo en Sistema Legacy | Solución y Mitigación en Sistema Moderno |
|---|---|---|---|---|
| **C-1** | Crítica | Suplantación de identidad por ausencia de `fileReplacements` | Todo usuario en producción heredaba el correo de prueba `oscar.sanchez@...`. | Triple defensa: `angular.json fileReplacements` + condición `isDevMode()` + script `verify:bundle`. |
| **C-2** | Crítica | Claves maestras AES expuestas en el bundle JavaScript | Atacantes podían replicar peticiones a cualquier puerto de administración. | Redefinición del modelo de confianza: autorización validada por tokens en servidor y transporte TLS. |
| **C-3** | Crítica | AES-128-CBC con IV constante de ceros | Cifrado determinista y vulnerable a ataques de oráculo de relleno. | Aislamiento en cliente y delegación de la confidencialidad a HTTPS estricto. |
| **C-4** | Crítica | Autorización superficial con token fallback `'winder-session-token'` | Sesiones inventadas en cliente aceptadas ante fallos de respuesta del backend. | Validación obligatoria de claims, caducidad en `sessionStorage` (15 min) y guards con `UrlTree`. |
| **A-1** | Alta | TypeScript sin modo estricto (`strict: false`) | Errores de tipo y punteros nulos invisibles hasta ejecución en producción. | Activación gradual de `strictNullChecks` y tipado exhaustivo en `models/`. |
| **A-4** | Alta | Pruebas fallidas con código de salida 0 en Karma | Integración continua reportaba falsos positivos en suites rotas. | Migración a Vitest y Playwright con propagación estricta de códigos de error. |
| **A-6** | Alta | Flujo implícito de OAuth2 desaconsejado | Exposición de tokens en fragmentos de URL y logs del navegador. | Planificación de migración a Authorization Code Flow con PKCE. |

---

## 3. ALINEACIÓN CON NORMAS Y ESTÁNDARES INTERNACIONALES DE INGENIERÍA DE SOFTWARE

### A. Norma ISO/IEC 25010 (Calidad del Producto de Software)
1. **Adecuación Funcional:** Cobertura completa de los 12 módulos requeridos para la operación del MIS.
2. **Eficiencia de Desempeño:** Carga inicial reducida gracias a la fragmentación de código (*Chunk Splitting*) con más de 110 fragmentos bajo demanda, y detección de cambios *Zoneless* que elimina micro-bloqueos en el renderizado.
3. **Compatibilidad:** Estandarización de componentes basada en Web Standards y capas CSS nativas (`@layer`).
4. **Usabilidad:** Adopción del estándar de interacción macOS (Header translúcido de 44px, Sidebar compacto de 56px, Breadcrumbs unificados, retroalimentación efímera mediante Toasts).
5. **Fiabilidad:** Aislamiento de fallos entre módulos y páginas de error dedicadas (`/error/:code`).
6. **Seguridad:** Supresión de fugas de entorno en builds de producción y tipado defensivo.
7. **Mantenibilidad:** Arquitectura modular con desacoplamiento entre UI (`shared/ui`), lógica de negocio (`services/`) y modelos (`models/`).
8. **Portabilidad:** Compatibilidad PWA multiplataforma (Web Desktop, Tablets y Dispositivos Móviles).

---

## 4. GLOSARIO DE TÉRMINOS TÉCNICOS PARA LA TESIS

- **App Shell:** Estructura mínima de interfaz (Header, Sidebar, Navigation) que se almacena en caché localmente para proporcionar tiempos de carga casi instantáneos.
- **As-Is / To-Be:** Metodología de análisis de procesos e ingeniería que contrasta el estado actual operativo con el estado futuro propuesto.
- **Change Detection Zoneless:** Estrategia de detección de cambios en Angular que no depende de la librería `zone.js`, ejecutando actualizaciones del DOM solo cuando las señales emiten valores.
- **Cohesión y Acoplamiento:** Principios de diseño de software donde la cohesión mide cuán enfocadas están las responsabilidades dentro de un módulo (debe ser alta), y el acoplamiento mide la dependencia entre módulos distintos (debe ser bajo).
- **Dead Code Elimination (Tree-Shaking):** Proceso de compilación que analiza estáticamente el código y descarta cualquier función o clase que no sea referenciada.
- **Guard Funcional (`CanActivateFn`):** Función pura de control de acceso en rutas que sustituye a los antiguos servicios basados en clases.
- **Native Federation:** Arquitectura de microfrontends basada en estándares web del navegador que permite cargar submódulos independientes en tiempo de ejecución sin iframes.
- **Signals (Señales):** Primitiva reactiva que encapsula un valor y notifica automáticamente a los consumidores interesados cuando dicho valor cambia.
- **Standalone Component:** Componente autónomo en Angular que no requiere pertenecer a un `NgModule`, declarando directamente sus dependencias.
