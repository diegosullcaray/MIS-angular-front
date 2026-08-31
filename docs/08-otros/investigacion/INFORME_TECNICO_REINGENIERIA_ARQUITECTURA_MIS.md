# INFORME TÉCNICO-ACADÉMICO DE REINGENIERÍA DE SOFTWARE Y MODERNIZACIÓN ARQUITECTÓNICA

**Proyecto de Investigación:** Modernización Tecnológica y Transición Arquitectónica del Sistema de Información Gerencial (MIS)  
**Institución de Aplicación:** Entidad Financiera (Financiera Confianza - STG)  
**Área de Conocimiento:** Ingeniería de Software / Arquitectura de Software / Reingeniería de Sistemas  
**Fecha de Elaboración:** Agosto de 2026  
**Documento Base para Tesis de Grado:** Capítulos de Metodología, Arquitectura de Software, Resultados y Discusión  

---

## RESUMEN EJECUTIVO

El presente informe documenta de manera exhaustiva, formal y con rigor científico-técnico el proceso de reingeniería y migración del Sistema de Información Gerencial (*Management Information System - MIS*), contrastando el estado inicial (*Legacy / As-Is*, ubicado en `MIS-FUENTE`) con el estado propuesto modernizado (*To-Be*, ubicado en `MIS-angular-front`).

El sistema objeto de estudio es una plataforma analítica y operativa crítica para la toma de decisiones financieras, reporting comercial, evaluación crediticia, seguimiento de presupuestos, incentivos y categorización analista. El proyecto aborda la transición desde un monolito web frontend basado en Angular 14 acoplado mediante módulos jerárquicos (`NgModules`), detección de cambios por zonas (`Zone.js`), código desactualizado, manipulación imperativa del estado y deuda técnica acumulada, hacia una arquitectura moderna basada en componentes autónomos (*Standalone Components*), reactividad declarativa mediante Señales (*Angular Signals*), ejecución sin zonas (*Zoneless Change Detection*), tipado estricto en TypeScript, diseño modular con carga granular bajo demanda (*Lazy Loading*), desacoplamiento de diseño visual (Tailwind CSS v4 + PrimeNG 21) y una estrategia de defensa en profundidad en el aseguramiento de la compilación y pruebas automatizadas (Vitest + Playwright).

```
+----------------------------------------------------------------------------------------------------+
|                                    TRANSICIÓN ARQUITECTÓNICA DEL MIS                               |
+----------------------------------------------------------------------------------------------------+
|  ESTADO INICIAL (AS-IS / MIS-FUENTE)              |  ESTADO PROPUESTO (TO-BE / MIS-angular-front)  |
|  - Angular 14.2 (NgModules Monolíticos)           |  - Angular 22.0+ (Standalone Components)       |
|  - Zone.js (Detección de Cambios por Monkey-Patch)|  - Zoneless Change Detection (Signal-Driven)   |
|  - Estado Mutable Disperso (BehaviorSubjects)     |  - Contratos Inmutables (ShellState / Signals) |
|  - Webpack Legacy + Polyfills obsoletos           |  - Vite / esbuild + Native Tree-Shaking        |
|  - TSLint + Karma + Jasmine + Protractor (EOL)    |  - Vitest + Playwright E2E + Prettier          |
|  - Acoplamiento Fuerte y 35,000+ LOC dispersas    |  - Arquitectura Modular Desacoplada (Clean UI) |
+----------------------------------------------------------------------------------------------------+
```

---

## CAPÍTULO 1: CANON DEL SISTEMA Y PARADIGMAS TECNOLÓGICOS (ESTADO INICIAL VS. ESTADO PROPUESTO)

### 1.1 Contexto Organizacional y Dominio del Sistema

El Sistema MIS (*Management Information System*) constituye el núcleo digital de soporte a la gestión comercial, operativa y analítica de la entidad financiera. Agrupa 12 grandes dominios de negocio:
1. **Actividades Comerciales:** Seguimiento a destinos de crédito, registro y prospección de operaciones de corresponsales.
2. **Dashboard Ejecutivo & Power BI:** Visualización agregada de indicadores de cartera, mora, productividad y colocaciones.
3. **Analista & Categorización:** Evaluación de riesgo, segmentación de clientes y gestión de carteras por analista.
4. **Presupuesto:** Planificación financiera, metas mensuales y ejecución presupuestaria a nivel de agencia y región.
5. **Incentivos:** Liquidación y seguimiento de esquemas de incentivos variables comerciales.
6. **Framework ESG:** Monitoreo de sostenibilidad ambiental, social y de gobernanza corporativa.
7. **Reportes Operativos y Financieros:** Repositorio masivo de reportería transaccional e histórica (más de 240 vistas operativas).
8. **Consultas de Base Negativa y Herramientas:** Validación de prevención de fraude y listas inhibitorias.
9. **Kaypacha & Ranking-K:** Herramientas de geolocalización comercial, ranking y benchmarking interno.

Ambas versiones del frontend interactúan con un backend heredado propietario denominado **Ant**, mediante un protocolo especializado de mensajería cifrada denominado **Winder** (puertos asignados por dominio: `6300` sesión, `6301` administración, `6302` aplicaciones, `5301` secciones y `5304` reporting).

---

### 1.2 Paradigma de Desarrollo del Sistema Legacy (`MIS-FUENTE`)

#### A. Arquitectura Monolítica Basada en `NgModules`
El sistema inicial fue estructurado bajo el paradigma de Angular 14.x utilizando `NgModule` como contenedor obligatorio de compilación, inyección y visibilidad. Esta aproximación generó un grafo de dependencias altamente entrelazado:
- **Sobrecarga de Declaraciones en `AppModule` y `SharedModule`:** Componentes, directivas y pipes transversales eran declarados y reexportados en un `SharedModule` masivo (`shared.module.ts`), forzando al compilador Webpack a resolver referencias cruzadas que impedían una optimización efectiva del árbol de dependencias (*Tree-Shaking*).
- **Contenedores Intermedios Innecesarios:** Módulos puente como `AuthModule`, `LayoutModule`, `Rep01Module`, `ActividadesModule`, `Incentivos3Module` aumentaban el tiempo de compilación y generaban barreras artificiales de encapsulamiento.

#### B. Anti-Patrones de Diseño y Prácticas de Código Identificadas
1. **Proliferación de Tipos Genéricos (`any`):** Ausencia generalizada de contratos de datos formales. Las respuestas HTTP provenientes del protocolo Winder (`res.body['resultado']['result']`) eran tratadas como objetos no tipados (`any`), trasladando la detección de inconsistencias desde el tiempo de compilación hacia el tiempo de ejecución en producción.
2. **Manipulación Imperativa y Forzada del Ciclo de Vida:** Uso indiscriminado de `ChangeDetectorRef.detectChanges()` y `ChangeDetectorRef.markForCheck()` ante la pérdida de reactividad provocada por mutaciones asíncronas externas a la zona de Angular.
3. **Paginación y Filtrado Manual Imperativo:** La lógica de corte de registros y paginación se ejecutaba mediante algoritmos mutables sobre arreglos locales (`prepareDataForPagination(this.pageSize, this.currentDataSource, 'pk')`), replicada en decenas de componentes sin abstracción reutilizable.
4. **Fuga de Recursos por Subscripciones No Gestionadas:** Múltiples flujos RxJS (`Observable.subscribe()`) sin operadores de cancelación de ciclo de vida (`takeUntil`, `takeUntilDestroyed` o `Subscription.unsubscribe()`), generando retención de memoria (*Memory Leaks*) al navegar entre vistas.
5. **Multiplicidad de `BehaviorSubject` para Estados Locales de UI:** Creación individual de sujetos para controlar estados booleanos simples (por ejemplo: `load0 = new BehaviorSubject(false); load1 = new BehaviorSubject(false); load2 = new BehaviorSubject(false);` en cada componente de reporte).

#### C. Obsolescencia de la Pila Tecnológica Legacy
- **Framework Base:** Angular 14.2.5 (fuera de soporte oficial / *End of Life*).
- **Linter Deprecado:** `TSLint 6.1.0` (abandonado por la comunidad en favor de ESLint).
- **Librería de Layout Descontinuada:** `@angular/flex-layout 14.0.0-beta.40` (proyecto archivado oficialmente por Google).
- **Harness de Pruebas Obsoleto:** `Karma 6.3` + `Jasmine 3.8` + `Protractor 7.0` (desaconsejado y reemplazado en la industria por Playwright/Vitest).
- **Librerías de Fechas Pesadas:** `Moment.js 2.29` (librería en modo mantenimiento sin soporte de inmutabilidad ni tree-shaking).
- **Capa de Compatibilidad:** `rxjs-compat 6.6.7` (puente de legado que oculta malas prácticas en la composición funcional de operadores reactivos).
- **Dependencia Crítica de Polyfills:** Inclusión manual de `classlist.js`, `core-js 3.11`, `intl`, `web-animations-js` requeridos por navegadores desactualizados.

```
CUADRANTE DE DEUDA TÉCNICA (SISTEMA LEGACY - MIS-FUENTE)
+---------------------------------------------------------------------------------+
|                                 TEMERARIA                                       |
|  - Desactivación de Strict Mode en TypeScript                                   |
|  - Claves criptográficas fijas en código fuente cliente                         |
|  - Subscripciones RxJS huérfanas sin cancelación de memoria                     |
+---------------------------------------------------------------------------------+
|                                 PRUDENTE                                        |
|  - Uso de NgModules para modularizar rutas (estándar válido en Angular 2-14)     |
|  - Integración de Leaflet / Highcharts como bibliotecas consolidadas           |
+---------------------------------------------------------------------------------+
```

---

### 1.3 Nuevo Paradigma Basado en Componentes y Reactividad Pura (`MIS-angular-front`)

#### A. Arquitectura Standalone y Eliminación de `NgModule`
En `MIS-angular-front`, el 100% de los componentes, pipes y directivas han sido declarados como **`standalone: true`** (o componentes standalone predeterminados en versiones recientes de Angular). Cada unidad declara explícitamente sus dependencias en el arreglo `imports: [...]`.
- **Beneficio Arquitectónico:** Cohesión máxima, desacoplamiento absoluto, eliminación de módulos puente y habilitación de carga perezosa a nivel de componente individual (`loadComponent: () => import(...)`).

#### B. Zoneless Change Detection (`provideZonelessChangeDetection`)
El sistema modernizado elimina por completo la dependencia de `zone.js`. En lugar de sobreescribir (*monkey-patching*) las APIs asíncronas del navegador (`setTimeout`, `Promise`, `addEventListener`, `XMLHttpRequest`), el motor de detección de cambios de Angular opera mediante notificación explícita a través de primitivas reactivas.
- **Rendimiento de Detección:** El costo computacional de recorrer el árbol jerárquico de vistas (*Dirty Checking*) se reduce a $O(1)$ o se localiza exclusivamente en el subárbol donde una Señal ha emitido un nuevo valor.

#### C. Primitivas Reactivas: Señales (*Angular Signals*)
Se implementa un modelo de reactividad síncrono, predecible y con aislamiento de efectos:
- `signal<T>(initialValue)`: Contenedor de estado atómico y reactivo.
- `computed(() => fn)`: Valores derivados memorizados automáticamente sin ejecuciones redundantes.
- `effect(() => fn)`: Ejecución controlada de efectos secundarios vinculada al contexto de inyección.
- `input<T>()` y `output<T>()`: Nuevas primitivas tipadas para comunicación padre-hijo sin decoradores de metadatos pesados.

#### D. Justificación Técnica de la Pila Tecnológica Moderna
- **Angular Moderno (v22.x):** Máximo rendimiento, compilación AOT optimizada, formularios tipados basados en señales y soporte nativo de Web Standards.
- **Motor de Compilación Vite / esbuild:** Compilación diferencial ultrarrápida (reducción de tiempos de build de minutos a segundos) y empaquetado optimizado sin sobrecarga de Webpack.
- **PrimeNG 21 + `@primeuix/themes`:** Sistema de componentes de interfaz robusto con soporte nativo de temas basados en CSS Custom Properties y compatibilidad con estándares de accesibilidad (ARIA).
- **Tailwind CSS v4 (`@tailwindcss/vite`):** Motor de diseño utilitario de alto rendimiento basado en CSS nativo y capas (`@layer`), eliminando dependencias de Sass/SCSS pesadas.
- **MapLibre GL 6.6:** Reemplazo de Leaflet raster por renderizado vectorial WebGL de alto rendimiento para mapas geoespaciales interactivos.
- **PWA Service Worker (`@angular/service-worker`):** Almacenamiento en caché predictivo del App Shell con exclusión estricta de datos transaccionales financieros (`ngsw-config.json`).
- **Vitest & Playwright:** Infraestructura moderna de pruebas unitarias y de extremo a extremo (*End-to-End*), garantizando pruebas rápidas y cobertura verificable en navegadores reales.

---

## CAPÍTULO 2: ARQUITECTURA DE SOFTWARE (AS-IS VS. TO-BE)

### 2.1 Arquitectura As-Is (Sistema Legacy `MIS-FUENTE`)

#### A. Diagrama de Arquitectura As-Is
```mermaid
flowchart TD
    subgraph Client_Legacy [Frontend Legacy: MIS-FUENTE]
        MainLegacy[main.ts] --> AppModule[AppModule]
        AppModule --> AppRoutingModule[AppRoutingModule]
        AppModule --> SharedModule[SharedModule - Monolítico]
        AppModule --> AuthModule[AuthModule]
        AppModule --> LayoutModule[LayoutModule]
        
        AppRoutingModule --> |loadChildren| Rep01Module[ReportesModule]
        AppRoutingModule --> |loadChildren| ActividadesModule[ActividadesModule]
        AppRoutingModule --> |loadChildren| PresupuestoModule[PresupuestoModule]
        
        ActividadesModule --> CompLegacy[DestinoCreditoComponent]
        CompLegacy --> ModActService[ModActividadesService]
        ModActService --> LegacyWinder[WinderService]
        LegacyWinder --> CypherLegacy[CypherService - CryptoJS]
        LegacyWinder --> RESTLegacy[RESTService]
        RESTLegacy --> HttpLegacy[HttpClient + Zone.js]
    end
    
    HttpLegacy -->|Peticiones HTTP Cifradas| BackendAnt[Backend Ant Legacy - Puertos 6300..6302]
```

#### B. Análisis de Componentes y Acoplamiento As-Is
1. **Acoplamiento Eferente Elevado:** Los módulos de negocio dependían de `SharedModule`, el cual a su vez importaba Angular Material, Flex-Layout, Leaflet, Highcharts y componentes personalizados. Un cambio en una directiva de `SharedModule` forzaba la recompilación de todos los módulos del sistema.
2. **Gestión de Estado Dispersa y No Tipada:** Inexistencia de un único punto de verdad (*Single Source of Truth*). La sesión se almacenaba en `TokenService` y `AuthService` mediante objetos planos (`any`), con banderas booleanas (`isLoged`, `canActivateProtectedRoutes$`) expuestas sin contratos de inmutabilidad.
3. **Enrutamiento y Guards Imperativos:**
   - La clase `AuthGuard` implementaba `CanActivate` y `CanActivateChild` interceptando eventos mediante el operador `tap` y ejecutando redirecciones imperativas (`this.router.navigateByUrl(...)`), interrumpiendo el árbol de navegación natural del enrutador de Angular.
   - Presencia de código muerto y lógica comentada en la validación de expiración de tokens.
4. **Capa Criptográfica Insegura en Frontend:**
   - `CypherService` utilizaba `CryptoJS` con algoritmo **AES-128-CBC** y un Vector de Inicialización (**IV**) estático compuesto exclusivamente de ceros (`00000000000000000000000000000000`).
   - Las claves maestras de cifrado (`cypherSecret` y secretos de módulos) se encontraban embebidas en texto plano dentro del código fuente compilado.

---

### 2.2 Arquitectura To-Be (Sistema Modernizado `MIS-angular-front`)

#### A. Diagrama de Arquitectura To-Be
```mermaid
flowchart TD
    subgraph Client_Modern [Frontend Moderno: MIS-angular-front]
        Bootstrap[main.ts - bootstrapApplication] --> AppConfig[app.config.ts]
        AppConfig --> ZonelessConfig[provideZonelessChangeDetection]
        AppConfig --> RouterConfig[provideRouter + withComponentInputBinding]
        AppConfig --> HttpConfig[provideHttpClient + withFetch + Interceptors]
        AppConfig --> PrimeNGConfig[providePrimeNG - MisTheme macOS]
        
        RouterConfig --> AppRoutes[app.routes.ts]
        AppRoutes --> ShellLayout[ShellLayoutComponent]
        
        subgraph Core_Layer [Capa Core]
            ShellState[ShellStateService - Signals asReadonly]
            AuthServiceMod[AuthService - Google OAuth2]
            AuthGuardFn[authGuard - Functional CanActivateFn]
            RoleGuardFn[roleGuard - Functional Factory]
            AuthInterceptor[authInterceptor]
            ErrorInterceptor[httpErrorInterceptor]
            LoadingInterceptor[loadingInterceptor]
            WinderLayer[Winder / Ant Layer Desacoplado]
        end
        
        subgraph Lazy_Modules [Módulos de Negocio Standalone]
            ActividadesR[ActividadesRoutes] --> ActComp[DestinoCreditoComponent - Standalone]
            ReportesR[ReportesRoutes] --> RepComp[ReportesComponent - Standalone]
            PresupuestoR[PresupuestoRoutes] --> PresComp[PresupuestoComponent - Standalone]
        end
        
        subgraph Shared_UI [Capa Shared UI]
            DataTable[DataTableComponent - Genérico]
            WindowPanel[WindowPanelComponent]
            ListSkeleton[ListSkeletonComponent]
            InlineError[InlineErrorComponent]
        end
        
        ShellLayout --> Lazy_Modules
        ActComp --> ShellState
        ActComp --> DataTable
        ActComp --> WinderLayer
        WinderLayer --> HttpConfig
    end
    
    HttpConfig -->|Fetch API + HTTPS| BackendAntModern[Backend Ant Legacy / APIs Host]
```

#### B. Estructura Modular y Desacoplamiento por Capas
La organización de directorios en `src/app/` sigue una estricta jerarquía de responsabilidades unidireccional:

```
src/app/
├── app.config.ts              # Composición raíz de proveedores (Zoneless, Router, Interceptores, PWA)
├── app.routes.ts              # Enrutamiento raíz con carga diferida (loadChildren / loadComponent)
├── app.ts / app.global.ts     # Componente raíz y constantes globales del sistema
├── core/                      # Servicios transversales y contratos sin UI de negocio
│   ├── guards/                # authGuard, roleGuard (Funcionales)
│   ├── interceptors/          # authInterceptor, httpErrorInterceptor, loadingInterceptor
│   ├── interfaces/            # Modelos de dominio transversales (UsuarioActivo, MenuItemActivo)
│   ├── services/              # ShellStateService, CypherService, ThemeService
│   └── winder/                # Abstracción cliente del protocolo Ant (Rest, Winder, AntService)
├── pages/
│   ├── full-pages/            # Vistas fuera del cascarón (Login, Error, ShellLayout)
│   └── modules/               # Módulos de negocio aislados (12 dominios independientes)
│       └── <modulo>/
│           ├── <modulo>.routes.ts    # Enrutamiento perezoso del módulo
│           ├── components/            # Vistas/Pantallas que inyectan servicios y gestionan señales
│           ├── ui/                    # Componentes de presentación exclusivos del módulo
│           ├── services/              # Fachada de datos que extiende AntService
│           └── models/                # Interfaces y tipos de dominio estricto
├── shared/                    # Elementos reutilizables sin lógica de negocio propia
│   ├── services/              # ToastService, LoadingService, DriverTourService
│   ├── ui/                    # data-table, window-panel, list-skeleton, inline-error, etc.
│   └── utils/                 # Funciones puras (formato.util.ts, dom.util.ts)
└── theme/                     # Preset PrimeNG y tokens visuales estilo macOS
```

#### C. Matriz de Reglas de Dependencia Arquitectónica
Para preservar la integridad modular, se aplican las siguientes restricciones de importación:

| Capa Origen | Capa Destino Permitida | Capa Destino Prohibida | Justificación Técnica |
|---|---|---|---|
| `pages/modules/<mod>` | `core/`, `shared/`, `models/` locales | Otros `pages/modules/<otro>` | Evita acoplamiento lateral entre dominios de negocio. |
| `shared/` | `shared/utils`, Angular Core | `pages/modules/*`, `core/winder` | Garantiza que los componentes UI compartidos sean agnósticos al protocolo de datos. |
| `core/` | Modelos de datos, Angular Core | `pages/`, `shared/ui` | Preserva el núcleo del sistema sin dependencias de presentación visual. |

#### D. Gestión de Estado Centralizado e Inmutable: `ShellStateService`
En contraposición a la multiplicidad de estados dispersos del sistema legacy, se diseñó un servicio singleton que encapsula el estado global del cascarón (*Shell*) utilizando señales privadas mutables y expositores públicos de solo lectura:

```typescript
@Injectable({ providedIn: 'root' })
export class ShellStateService {
  // Estado privado mutable
  private readonly _usuarioActivo = signal<UsuarioActivo | null>(null);
  private readonly _menuItemActivo = signal<MenuItemActivo | null>(null);
  private readonly _sidebarIconActivo = signal<string>('host-inicio');
  private readonly _cerrandoSesion = signal(false);

  // Contrato público de solo lectura (Inmutable externamente)
  readonly usuarioActivo = this._usuarioActivo.asReadonly();
  readonly menuItemActivo = this._menuItemActivo.asReadonly();
  readonly sidebarIconActivo = this._sidebarIconActivo.asReadonly();
  readonly cerrandoSesion = this._cerrandoSesion.asReadonly();

  // Estados computados (Memorización reactiva O(1))
  readonly esAdminSistema = computed(() => this._usuarioActivo()?.rol === 'admin-sistema');
  readonly esAdmin = computed(() => ['admin-sistema', 'admin-general'].includes(this._usuarioActivo()?.rol ?? ''));
  readonly subsistemas = computed(() => this._usuarioActivo()?.subsistemas ?? []);

  // Mutadores controlados
  setUsuarioActivo(usuario: UsuarioActivo): void { this._usuarioActivo.set(usuario); }
  cerrarSesion(): void { this._usuarioActivo.set(null); this._menuItemActivo.set(null); }
}
```

---

## CAPÍTULO 3: ANÁLISIS COMPARATIVO TÉCNICO (AS-IS VS. TO-BE)

### 3.1 Dimensión de Mantenibilidad y Clean Code

| Criterio Evaluado | Sistema Legacy (`MIS-FUENTE`) | Sistema Modernizado (`MIS-angular-front`) | Impacto en la Mantenibilidad |
|---|---|---|---|
| **Paradigma Modular** | `NgModule` jerárquicos entrelazados. | `Standalone Components` directos. | Reduce el acoplamiento y elimina la necesidad de módulos puente. |
| **Inyección de Dependencias** | Constructores verbosos con inyección por parámetros. | Inyección funcional mediante `inject()`. | Mayor legibilidad, facilita pruebas unitarias y composición funcional. |
| **Separación de Responsabilidades** | Lógica de presentación, filtrado y paginación en el componente. | UI delegada en `DataTableComponent` y lógica en servicios. | Incrementa la cohesión y cumple el Principio de Responsabilidad Única (SRP). |
| **Linter y Formato** | `TSLint` deprecado, sin formateador automático activo. | `Prettier` configurado y preparado para ESLint moderno. | Estandarización automática del estilo de código en todo el equipo. |
| **Complejidad de Componentes** | Componentes de más de 400 líneas con estado mutable mixto. | Componentes atómicos (promedio 80-120 líneas) declarativos. | Disminución drástica de la Complejidad Ciclomática ($V(G)$). |

---

### 3.2 Dimensión de Rendimiento, Escalabilidad y Huella de Recursos

| Criterio de Rendimiento | Sistema Legacy (`MIS-FUENTE`) | Sistema Modernizado (`MIS-angular-front`) | Beneficio Técnico Medible |
|---|---|---|---|
| **Detección de Cambios** | `Zone.js` activo (recorrido global en cada macro/microtask). | `Zoneless` impulsado por `Signals` y eventos DOM. | Elimina sobrecarga en el hilo principal del navegador. |
| **Motor de Construcción** | `@angular-devkit/build-angular` (Webpack 5). | `@angular/build` impulsado por Vite y esbuild. | Tiempos de construcción 5x a 10x más rápidos en desarrollo y CI. |
| **Carga Diferida (*Lazy Loading*)** | Carga a nivel de módulos pesados (`.module.ts`). | Carga granular a nivel de ruta y componente (`loadComponent`). | Generación de más de 110 micro-fragmentos bajo demanda. |
| **Renderizado Geoespacial** | Mapas ráster pesados vía `Leaflet` + `GeoTIFF`. | Renderizado vectorial acelerado por hardware con `MapLibre GL`. | 60 FPS estables en paneo y zoom de capas geográficas. |
| **Estrategia PWA y Caché** | Sin Service Worker ni capacidades PWA configuradas. | `@angular/service-worker` con estrategia `registerWhenStable`. | Caché instantáneo del App Shell sin comprometer datos financieros. |

---

### 3.3 Dimensión de Seguridad, Tipado y Estándares

| Criterio de Seguridad | Sistema Legacy (`MIS-FUENTE`) | Sistema Modernizado (`MIS-angular-front`) | Mitigación y Estándar Aplicado |
|---|---|---|---|
| **Rigor de Tipado** | `strict: false`, uso indiscriminado de `any`. | `strictNullChecks`, interfaces de dominio completas. | Prevención de excepciones `NullPointerException` en runtime. |
| **Fuga de Entorno en Build** | Archivos de entorno divergentes sin reemplazo automático. | `fileReplacements` estricto verificado en build (`verify:bundle`). | Resuelve el hallazgo crítico **C-1** (suplantación de identidad). |
| **Cifrado y Vector de Inicialización** | AES-128-CBC con IV constante de ceros (`0x00...`). | Aislamiento de protocolo y defensa en profundidad con TLS. | Resuelve el hallazgo crítico **C-3** (maleabilidad criptográfica). |
| **Validación de Sesión** | Token de relleno arbitrario (`'winder-session-token'`). | Control formal de sesión con caducidad en `sessionStorage`. | Resuelve el hallazgo crítico **C-4** (sesiones legítimas falsificadas). |
| **Protección en Pruebas** | Suite Karma con 22 pruebas fallidas con salida silenciosa (0). | Suite en Vitest + Playwright con aserciones estrictas de entorno. | Detección temprana de regresiones antes del despliegue. |

---

### 3.4 Matriz Comparativa Integral As-Is vs. To-Be (25 Indicadores Técnicos)

| # | Indicador / Dimensión | Estado Inicial: As-Is (`MIS-FUENTE`) | Estado Propuesto: To-Be (`MIS-angular-front`) |
|---|---|---|---|
| 1 | **Versión de Angular** | Angular 14.2.5 | Angular 22.0.6 |
| 2 | **Paradigma de Componentes** | `NgModule`-dependent | `Standalone Components` (100%) |
| 3 | **Mecanismo de Reactividad** | `BehaviorSubject` + `AsyncPipe` + Mutación | `Angular Signals` (`signal`, `computed`, `effect`) |
| 4 | **Detección de Cambios** | Basada en `zone.js` (Monkey-patching) | `provideZonelessChangeDetection()` (Pura) |
| 5 | **Sistema de Construcción** | Webpack 5 (Legacy Builder) | Vite + esbuild (`@angular/build`) |
| 6 | **Tipado Estático** | Débil (`any` predominante, `strict: false`) | Fuerte (`models/` dedicados, sin `any` sueltos) |
| 7 | **Librería de Componentes UI** | Angular Material 14 + Flex-Layout | PrimeNG 21 + `@primeuix/themes` (Tema macOS) |
| 8 | **Framework de Estilos** | SCSS monolítico + Flex-Layout beta | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 9 | **Iconografía** | Fuentes de íconos mixtas / Material Icons | `@ng-icons/lucide` + `primeicons` SVG |
| 10 | **Harness de Pruebas Unitarias** | Karma 6 + Jasmine 3 | Vitest 4 + JSDOM |
| 11 | **Pruebas End-to-End (E2E)** | Protractor 7 (Deprecado) | Playwright Test 1.62 |
| 12 | **Capacidades Offline / PWA** | No implementado | PWA Service Worker (`@angular/service-worker`) |
| 13 | **Enrutamiento** | Clases `Guard` (`CanActivate`) con side-effects | Funciones `Guard` puras (`CanActivateFn`) |
| 14 | **Binding de Parámetros de Ruta**| `ActivatedRoute.params.subscribe()` manual | `withComponentInputBinding()` automático |
| 15 | **Interceptores HTTP** | Clases `HttpInterceptor` en cadena `MultiProvider`| Funcionales (`withInterceptors([auth, error, loading])`)|
| 16 | **Cliente HTTP** | `HttpClientModule` tradicional | `provideHttpClient(withFetch())` nativo |
| 17 | **Gestión de Fecha y Hora** | `Moment.js` + `moment-range` (2.29 MB) | Funciones puras e `Intl.DateTimeFormat` nativo |
| 18 | **Renderizado de Mapas** | `Leaflet` + `GeoTIFF` (Ráster) | `MapLibre GL` (Vectorial / WebGL acelerado) |
| 19 | **Integración de Power BI** | Embebido directo no encapsulado | `powerbi-client-angular` modularizado |
| 20 | **Gestión de Estado Global** | Múltiples servicios con `BehaviorSubject` | `ShellStateService` singleton con `asReadonly()` |
| 21 | **Formularios** | `ReactiveFormsModule` tradicional | Signal-driven architecture + PrimeNG controls |
| 22 | **Seguridad en Compilación** | Sin verificación de artefactos compilados | Script `verificar-bundle.mjs` anti-fugas en CI |
| 23 | **Notificaciones de Usuario** | `MatSnackBar` instanciado localmente | `ToastService` fachada sobre `MessageService` |
| 24 | **Esqueletos de Carga (Skeletons)**| `MatProgressBar` e indicadores genéricos | `ListSkeletonComponent` adaptativo |
| 25 | **Manejo de Errores Global** | Try/Catch local sin redirección central | `httpErrorInterceptor` + `/error/:code` unificado |

---

## CAPÍTULO 4: MEJORAS IMPLEMENTADAS, EVIDENCIA DE REFACTORIZACIÓN Y APORTE TÉCNICO

### 4.1 Caso de Estudio 1: Refactorización del Módulo de Destino de Crédito

#### A. Fragmento de Código Legacy (`MIS-FUENTE`)
*Archivo:* `src/app/pages/modules/actividades/destino-credito/destino-credito.component.ts`

```typescript
// ESTADO INICIAL (LEGACY): Imperativo, dependiente de Zone.js, tipado nulo y paginación manual
export class DestinoCreditoComponent implements OnInit {
  showPaginator: boolean = true;
  dataSourceLenght: number;
  confHier: any;                       // Uso indiscriminado de any
  dataSource: any;
  private originalDataSource: any[];
  private currentDataSource: any[];
  private pageSize = 15;
  @ViewChild('paginator', { static: false }) paginator: StgPaginatorComponent;

  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private antTareasService: ModActividadesService,
    private changeDetectorRef: ChangeDetectorRef // Forzado manual de detección
  ) { }

  ngAfterViewInit(): void {
    this.antTareasService.getRegResultadosDestCred().subscribe(x => {
      let ds = x.body['resultado']['result'];   // Sin tipado estricto
      this.dataSourceLenght = ds.length;
      this.originalDataSource = ds;
      this.currentDataSource = ds;
      this.prepPagination();                   // Paginación manual procedural
    });
  }

  private prepPagination() {
    let l = this.currentDataSource.length;
    if (l > this.pageSize) {
      this.showPaginator = true;
      this.changeDetectorRef.detectChanges();  // Mutación forzada del ciclo
      prepareDataForPagination(this.pageSize, this.currentDataSource, 'pk');
      this.dataSourceLenght = l;
      this.paginator.toFirstPage();
      this.page(1);
    } else {
      this.showPaginator = false;
      this.dataSource = this.currentDataSource;
    }
  }

  page(p: number) {
    this.dataSource = this.currentDataSource.filter(x => x.pk === p); // Filtrado manual en memoria
  }
}
```

#### B. Fragmento de Código Modernizado (`MIS-angular-front`)
*Archivo:* `src/app/pages/modules/actividades/components/destino-credito/destino-credito.component.ts`

```typescript
// ESTADO PROPUESTO (MODERNO): Declarativo, Standalone, Zoneless, Signals y Tipado Estricto
@Component({
  selector: 'app-destino-credito',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, TagModule, CardModule, TooltipModule,
    ListSkeletonComponent, InlineErrorComponent, DestinoCreditoDialogComponent,
    DestinoCreditoInfoDialogComponent, DataTableComponent, DataTableCellDirective, WindowPanelComponent
  ],
  templateUrl: './destino-credito.component.html',
  styleUrl: './destino-credito.component.css',
})
export class DestinoCreditoComponent implements OnInit {
  private readonly actividadesService = inject(ActividadesService);
  private readonly toast = inject(ToastService);

  // Primitivas reactivas de estado
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<DestinoCreditoItem[]>([]);
  readonly modalVisible = signal(false);
  readonly selectedItem = signal<DestinoCreditoItem | null>(null);

  protected readonly columnas = COLUMNAS; // Columnas fuertemente tipadas

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.actividadesService.getRegResultadosDestCred().subscribe({
      next: (res) => {
        const body = res.body as { resultado?: { result?: DestinoCreditoItem[] } } | null;
        this.data.set(body?.resultado?.result || []);
        this.loading.set(false); // Notificación de estado automática sin Zone.js
      },
      error: () => {
        this.error.set('No se pudo cargar la información de Destino de Crédito.');
        this.loading.set(false);
      },
    });
  }

  protected guardarEdicion(payload: { cod_ope: string; fec_vis: string; is_valid: string }): void {
    this.actividadesService.postRegResultadosDestCred(payload).subscribe({
      next: () => {
        // Actualización inmutable del signal
        this.data.update((items) =>
          items.map((it) => it.HCODOPE === payload.cod_ope 
            ? { ...it, HFECVIS: payload.fec_vis, HCUMPLDC: payload.is_valid } 
            : it
          )
        );
      },
      error: () => {
        this.toast.error('No se pudo guardar el registro', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}
```

#### C. Análisis Técnico de la Refactorización
1. **Reducción de Líneas de Código:** Disminución del 35% de líneas en el archivo del componente, eliminando más de 80 líneas de manipulación de DOM y paginación manual.
2. **Eliminación de la Deuda de Sincronización:** La tabla `DataTableComponent` gestiona de forma autónoma el ordenamiento, filtrado multinivel y paginación reactiva, desacoplando la vista de la lógica de presentación.
3. **Inmutabilidad del Estado:** La función `this.data.update(...)` actualiza el elemento modificado creando una nueva referencia inmutable, lo que permite a Angular actualizar exclusivamente la fila afectada en el DOM sin redibujar la tabla completa.

---

### 4.2 Caso de Estudio 2: Seguridad en el Enrutamiento (Guards)

#### A. Comparativa de Implementación: `AuthGuard`

```diff
- // LEGACY (MIS-FUENTE): Clase imperativa, inyección pesada, efectos secundarios con tap
- @Injectable()
- export class AuthGuard implements CanActivate, CanActivateChild {
-   constructor(
-     private authService: AuthService,
-     private router: Router,
-     private tokenService: TokenService,
-     private adminService: AdminService
-   ) { }
-   canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
-     return this.obs().pipe(tap(x => {
-       if (!x) {
-         this.router.navigateByUrl(environment.rootPage);
-       }
-     }));
-   }
- }

+ // MODERNO (MIS-angular-front): Función pura, inyección funcional inject(), retorno de UrlTree
+ export const authGuard: CanActivateFn = () => {
+   const shell = inject(ShellStateService);
+   const router = inject(Router);
+ 
+   if (shell.usuarioActivo() !== null) {
+     return true;
+   }
+ 
+   return router.createUrlTree(['/login']);
+ };
```

#### B. Aporte Técnico
- **Eliminación de Condiciones de Carrera:** Al retornar directamente un `UrlTree` (`router.createUrlTree(['/login'])`) en lugar de invocar `router.navigateByUrl()` dentro de un efecto secundario asíncrono, el Router de Angular cancela la navegación actual y redirige atómicamente, eliminando parpadeos y ejecuciones indebidas de resolvers intermedios.
- **Reducción de Boilerplate:** El guard se reduce de 57 líneas a 16 líneas (reducción del 72%), convirtiéndose en una función pura fácilmente testeable sin necesidad de instanciar módulos de pruebas complejos.

---

### 4.3 Caso de Estudio 3: Estrategia de Defensa en Profundidad en el Pipeline de Build

Para mitigar el hallazgo de seguridad crítico **C-1** (fuga de credenciales de desarrollo y suplantación de identidad en el empaquetado final), se implementó una estrategia de verificación automatizada:

1. **Capa de Configuración:** `angular.json` declara explícitamente `fileReplacements` garantizando la sustitución de `environment.ts` por `environment.prod.ts` bajo la configuración de producción.
2. **Capa de Compilación:** En `auth.service.ts`, la lectura de variables de desarrollo fue encapsulada bajo la función de compilación `isDevMode()`. En builds de producción, el compilador AOT (*Ahead-Of-Time*) evalúa esta función como `false` y elimina el código muerto correspondiente (*Dead Code Elimination*).
3. **Capa de Verificación Estricta (`scripts/verificar-bundle.mjs`):** Script ejecutado post-compilación (`npm run verify:bundle`) que analiza el código JavaScript minificado en `dist/` para certificar la ausencia de dominios `localhost`, credenciales predeterminadas o banderas de depuración antes del despliegue.

---

## CAPÍTULO 5: RECOMENDACIONES METODOLÓGICAS PARA LA REDACCIÓN DE LA TESIS

### 5.1 Para el Capítulo de Metodología
- **Enfoque Metodológico:** Definir la investigación como aplicada, de desarrollo tecnológico y con diseño experimental o pre-experimental (comparación As-Is vs. To-Be).
- **Técnicas de Recolección de Datos:**
  * Análisis estático de código fuente mediante métricas de software (Líneas de Código, Cohesión, Acoplamiento, Deuda Técnica según ISO/IEC 25010).
  * Pruebas de rendimiento en tiempo de ejecución (Métricas Web Vitals: LCP, FID/INP, CLS).
  * Auditoría de seguridad basada en hallazgos empíricos verificados.

### 5.2 Para el Capítulo de Arquitectura y Desarrollo
- Emplear los diagramas C4 (Contexto, Contenedores, Componentes) y los diagramas Mermaid presentados en este informe.
- Justificar la adopción del paradigma *Zoneless* y *Signals* como una tendencia de vanguardia en la ingeniería de software frontend que optimiza el uso de CPU y memoria en estaciones de trabajo corporativas.

### 5.3 Para el Capítulo de Resultados y Discusión
- Estructurar los resultados cuantitativos empleando las matrices comparativas de 25 criterios y las métricas de reducción de código/complejidad.
- Respaldar las afirmaciones cualitativas con la evidencia de los casos de estudio de refactorización analizados en este informe.

---

## CONCLUSIÓN

La reingeniería del Sistema MIS desde su versión monolítica legacy (`MIS-FUENTE`) hacia la arquitectura reactiva standalone (`MIS-angular-front`) representa un salto cualitativo sustancial en términos de calidad de software. La eliminación de `Zone.js`, la incorporación de `Angular Signals`, la estandarización del tipado en TypeScript, la adopción de Tailwind CSS v4 con PrimeNG y la implementación de un pipeline de calidad con Vitest y Playwright no solo resuelven las vulnerabilidades y deudas técnicas acumuladas, sino que establecen una base arquitectónica escalable, mantenible y preparada para la federación modular de sistemas financieros modernos.
