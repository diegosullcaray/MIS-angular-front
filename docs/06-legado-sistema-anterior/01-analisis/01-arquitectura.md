# 01 — Arquitectura y contexto

> Documento 1 de 3. Siguiente: [Análisis de refactorización](./02-analisis-refactorizacion.md)

---

## 1. Qué es este sistema

`stg-app-mis-r22` es el frontend del **MIS (Management Information System)** de **Financiera Confianza** (`stg.confianza.pe`), una entidad de microfinanzas peruana.

No es una aplicación de un solo propósito: es un **portal corporativo multi-módulo** — un contenedor con escritorio, menú lateral, sesión y layout compartidos, dentro del cual conviven ~20 aplicaciones de negocio independientes. El sufijo `r22` sugiere "release 2022", coherente con Angular 14 (septiembre 2022).

### Dominios de negocio identificados

| Módulo | Qué resuelve |
|---|---|
| `reportes` | Reportería comercial y de cartera. 47 sub-reportes. **62% del código** |
| `incentivos2/3/4/-a` | Cálculo de incentivos y comisiones de la fuerza de ventas. Cuatro generaciones vivas |
| `kaypacha`, `Kaypacha2/3` | Evaluación de desempeño, puntajes, bonos y ranking de asesores (*kaypacha* = "mundo/tiempo presente" en quechua) |
| `presupuesto` | Gestión de líneas presupuestales |
| `corresponsales` | Red de corresponsales, prospección y transacciones |
| `actividades` | Registro de transacciones y destino de crédito |
| `analista` | Prospección, categorización, listas y becas |
| `basenegativa` | Consulta de base negativa (listas restrictivas / *blacklist* crediticia) |
| `sistematica` | Sistemática comercial, desembolsos, geolocalización |
| `framework-esg` | Indicadores ambientales, sociales y de gobernanza |
| `reportes-e` | Dashboards embebidos de Power BI |
| `ranking-k`, `reasignacion-cart-cap` | Ranking y reasignación de cartera/capacidad |
| `administracion` | Administración de usuarios y permisos |

Esto explica el tamaño: **no es una app inflada, es un ERP de front-end**. La deuda técnica no viene de sobre-ingeniería sino de veinte equipos-año de features entregadas por copia.

---

## 2. Stack

| Capa | Tecnología | Estado |
|---|---|---|
| Framework | **Angular 14.2** | 2 versiones LTS fuera de soporte |
| Lenguaje | TypeScript 4.6 | `strict` **desactivado** |
| Reactividad | RxJS 6.6 + **`rxjs-compat`** | `rxjs-compat` es un *shim* de migración desde RxJS 5 que sigue instalado |
| UI | Angular Material 14 + CDK + **`@angular/flex-layout`** | `flex-layout` está **deprecado y archivado** por el equipo Angular |
| Gráficos | Highcharts 9, Chart.js 4 + ng2-charts, **3 librerías en paralelo** | Redundancia |
| Mapas | Leaflet + `@asymmetrik/ngx-leaflet` + `@angular/google-maps` + proj4 | Dos proveedores de mapas |
| BI | `powerbi-client-angular` | — |
| Auth | `angular-oauth2-oidc` (Implicit Flow con Google) | **Implicit Flow está deprecado** por OAuth 2.1 |
| Cripto | `crypto-js` (AES-CBC), `sha.js` | Ver [H-04](./02-analisis-refactorizacion.md#h-04) |
| Lint | **TSLint 6.1** | Deprecado desde 2019; sucesor es ESLint |
| E2E | **Protractor 7** | Fin de vida desde 2023 |
| Unit | Karma + Jasmine | 28 specs |

**Conclusión del stack:** cinco dependencias estructurales (`flex-layout`, `rxjs-compat`, TSLint, Protractor, Implicit Flow) están en fin de vida. Ninguna rompe hoy, pero **todas bloquean la actualización de Angular**, que es el prerequisito de cualquier plan de escalabilidad.

---

## 3. Arquitectura en capas

El proyecto tiene una separación de capas **real y respetada**. Esto es lo mejor que tiene y es la base sobre la que se puede construir.

```
src/app/
├── core/        ← Infraestructura transversal, sin conocimiento del negocio
│   ├── data/
│   │   ├── local/        LocalStoreService (localStorage cifrado)
│   │   └── remote/       Protocolo Winder/Ant + REST + instancias de servicio
│   ├── screen/
│   │   ├── components/   Librería de UI propia: 24 componentes `stg-*`
│   │   ├── directives/  pipes/  services/  animations/  base/
│   └── shared/           cypher, token, functions.util, debug.util
│
├── system/      ← El "sistema operativo" del portal
│   ├── admin/            Layout, sidenav, menú, guards, interceptores, tema
│   └── session/          OAuth, login, guards de sesión
│
└── modules/     ← Los ~20 dominios de negocio (lazy-loaded)
    └── <dominio>/
        ├── compartido/servicios/   Servicio de estado + servicio Ant del dominio
        ├── <pantalla>/
        │   ├── *.component.ts      Renderiza
        │   ├── *.util.ts           Configuración declarativa de la pantalla
        │   └── *-base.component.ts Lógica compartida entre variantes
        └── <dominio>.module.ts + -routing.module.ts
```

### Verificación de la disciplina de capas

Comprobado por búsqueda: **`core/` y `system/` no importan nada de `modules/`**. La dependencia fluye en una sola dirección. Solo hay una infracción menor: `app-routing.module.ts:9` importa `DummyComponent` desde `modules/reportes`, lo que ancla ese módulo al bundle inicial.

El acoplamiento cruzado entre módulos de negocio también es bajo: solo `corresponsales` importa de `reportes`. Cada dominio es, en la práctica, extraíble.

> **Esto es importante para el plan:** la refactorización no requiere reescribir la arquitectura. Requiere *aplicar la arquitectura que ya existe* a las partes que la eludieron.

---

## 4. El protocolo Winder / Ant

Es la pieza más singular del sistema y hay que entenderla antes de tocar nada.

En vez de una API REST con un endpoint por recurso, el backend expone **dos endpoints universales** y toda la semántica viaja cifrada en una cabecera. Es un RPC por lotes sobre HTTP.

### Anatomía

```
Strand   → una operación individual: nombre de acción + payload
           ej. Strand("incentivos.calculadora").pushToPayload("cod_bt", "X")

Winder   → empaqueta N strands, cifra la configuración de conexión (AES),
           serializa los strands en la cabecera "Winder-Params"

RESTPacket → construye la URL final y las opciones HTTP

Endpoints: POST /v1/p    (post)
           POST /v1/pf   (post con FormData / archivos)
           GET  /v1/g    (get)
```

### Cadena de llamada

```
Componente
   → <Dominio>Service          (estado de pantalla, orquestación)
      → Mod<Dominio>Service    (extiende AntService — el catálogo de acciones del dominio)
         → AntService          (métodos protegidos: getSimpleResponseString, postFile...)
            → WinderService    (empaqueta y cifra)  ⚠️ SINGLETON CON ESTADO
               → RESTService   (HttpClient)
                  → TokenInterceptor
```

### Instancias por dominio

Cada dominio declara su propia subclase de `AntService` con una tripleta `{ port, secret, appId }`:

```typescript
// src/app/core/data/remote/instances/mod-app-service.ts
export class ModAppService extends AntService {
   constructor(private winderService: WinderService) {
      super({ port: 6302, secret: "CCAFE0F473E9B66F2EA57D46C5C3047E", appId: "app" }, winderService);
   }
   public getIncentivosResumen(cod_bt: string): Observable<IWinderResponse> {
      return this.getSimpleResponseString("incentivos.resumen", { cod_bt }, "resumen");
   }
}
```

Hay **27 subclases de `AntService`** repartidas por todo el árbol, con **7 secretos distintos** correspondientes a 7 puertos/microservicios del backend (6300 sesión, 6302 app, etc.).

### Valoración

**A favor:** el patrón es coherente, reduce el *boilerplate* por endpoint a una línea, y permite agrupar varias operaciones en un viaje.

**En contra:**
- El contrato es **invisible para TypeScript**. Todo entra y sale como `any` y el nombre de la acción (`"incentivos.resumen"`) es un *string mágico*. Un typo se descubre en runtime, en producción.
- `WinderService` es un **singleton mutable compartido por las 27 subclases** — origen del bug crítico [H-01](./02-analisis-refactorizacion.md#h-01).
- Los secretos viven en el bundle del navegador ([H-04](./02-analisis-refactorizacion.md#h-04)).
- `delete()` y `update()` están declarados como `//TODO` vacíos en las tres capas (`WinderService`, `RESTService`, `AntService`). El protocolo solo soporta GET y POST.

---

## 5. Autenticación y autorización

### Flujo

```
1. Google OAuth (Implicit Flow) vía angular-oauth2-oidc
2. El hash de retorno se parsea a mano y se guarda en localStorage (auth_resp)
3. ModSysLoginService.login(email) → el backend devuelve perfil + menú (user_mr)
4. NavigationService.initMenu(mr) construye el árbol de menú Y la lista de rutas permitidas
5. AuthGuard protege /app; RouteGuard valida la ruta contra el menú
```

### El menú es dirigido por datos — y eso es un activo

`NavigationService` recibe del backend un array plano de registros (`cod_sec`, `cod_par`, `desc_sec`, `act_sec`, `icon_sec`, `order_sec`, `tip_sec`) y construye recursivamente el árbol jerárquico del menú lateral y los accesos directos del escritorio.

**Esto significa que el backend ya controla qué ve cada usuario.** Es la mitad de un sistema dinámico, y es la base sobre la que el plan propone construir la otra mitad (rutas generadas, no declaradas).

### Pero la autorización tiene tres grietas

1. **`RouteGuard` casi no se aplica.** De ~22 rutas en `app-routing.module.ts`, solo **2** lo usan (`presupuesto`, `actividades`). En el resto está comentado:
   ```typescript
   { path: 'kaypacha',
     //canActivate:[RouteGuard],          ← desactivado
     loadChildren: () => import(...) }
   ```
   La protección efectiva es la del menú: si no aparece, el usuario no navega ahí — pero **escribiendo la URL sí entra**.

2. **`routesArray` nunca se reinicia** — ver [H-03](./02-analisis-refactorizacion.md#h-03).

3. **`isLoged` no valida el token, solo su presencia:**
   ```typescript
   public get isLoged(){
     let v = this.storage.getItem(system_keys.auth_resp);
     return (v!==null);                   // ← no comprueba expiración
   }
   ```
   Y en `AuthGuard.obs()` la comprobación de expiración está comentada. En `TokenInterceptor`, el bloque que adjuntaba la cabecera `Authorization` también está comentado — hoy el interceptor solo llama a `updateToken()` y deja pasar la petición sin tocarla.

---

## 6. El patrón de UI: configuración declarativa

Aquí está la intención más interesante del proyecto y la clave del objetivo "más dinámico".

### Cómo funciona

Cada pantalla tiene un `*.util.ts` que exporta un objeto de configuración plano, y un servicio de dominio que lo clona a estado mutable:

```typescript
// principal.util.ts
export const principalConfig = { loading: true }

// incentivos3.service.ts
private setDefaults() {
    this.principal   = cloneObject(principalConfig);
    this.perfil      = cloneObject(perfilConfig);
    this.avances     = cloneObject(avancesConfig);
    this.composicion = cloneObject(composicionConfig);
    this.tabla       = cloneObject(tablaConfig);
    // ...
}

// principal.component.ts — el componente es una cáscara
export class PrincipalComponent implements OnInit {
  config: any;
  ngOnInit(): void { this.config = this.inc3.principal; }
}
```

El componente casi no tiene lógica: recibe un objeto de configuración y lo pinta. Hay **11 archivos `principal.util.ts`** y **4 `detalle.util.ts`** siguiendo este molde.

### Valoración

**La idea es correcta y es exactamente la dirección "dinámica" que se busca.** Es un motor de pantallas guiado por configuración: para añadir una pantalla, describes su configuración en lugar de programar un componente.

**Lo que le falta para funcionar de verdad:**
- La configuración es `any`. No hay contrato, no hay autocompletado, no hay validación. Un campo mal escrito falla silenciosamente.
- El estado vive como **campos públicos mutables** en un servicio (`principal`, `perfil`, `avances`, `tabla`... todos `any`), mutados directamente por los componentes. No hay flujo unidireccional ni observables, así que la detección de cambios no puede optimizarse — de ahí que `OnPush` esté en 1 de 302 componentes.
- La configuración vive en el frontend. Si estuviera tipada y viniera del backend (como ya viene el menú), añadir una pantalla no requeriría desplegar el front.

### La librería de componentes `stg-*`

`core/screen/components/` contiene 24 componentes propios (`stg-table`, `stg-form`, `stg-window`, `stg-binput`, `stg-paginator`...) expuestos por `SharedCWCModule`, que es importado por **121 archivos**. Es un *design system* interno real y en uso.

Su problema es el mismo del resto: **versionado por copia**. Existen `stg-table`, `stg-table2`, `stg-table3` y `stg-table4`. Los dos últimos son forks casi idénticos (ver [H-06](./02-analisis-refactorizacion.md#h-06)).

---

## 7. Estrategia de build

| Aspecto | Estado |
|---|---|
| Lazy loading | ✅ Bien aplicado: 22 rutas con `loadChildren` |
| `defaultConfiguration` | 🔴 **`""`** — `ng build` produce build de desarrollo |
| Budgets | Solo en `production`; `initial` con error a **5 MB** (irreal) |
| `sourceMap` en dev | `true` — y dev es el default de `ng build` |
| Configuración `staging` | No existe. Solo `production` |
| `strictTemplates` | `false` |
| `strict` (TS) | Ausente → `false` |

`angular.json` no define `"defaultConfiguration": "production"` en el target `build`. Por tanto `npm run build` (`ng build`) usa las `options` base: `optimization: false`, `buildOptimizer: false`, `sourceMap: true`, `vendorChunk: true` y **sin** el `fileReplacements` que sustituye el `environment.ts`.

Consecuencia: si el pipeline de despliegue ejecuta `npm run build`, publica un bundle de desarrollo — sin minificar, con source maps, y apuntando al `environment.ts` de desarrollo que contiene `devUser: 'oscar.sanchez@confianza.pe'` incrustado.

---

## 8. Mapa de tamaño

```
modules/reportes           75.058 LOC  ████████████████████████████████  62%
core                        7.214 LOC  ███
modules/incentivos3         4.786 LOC  ██
modules/analista            4.513 LOC  ██
modules/corresponsales      4.084 LOC  ██
modules/actividades         3.777 LOC  █
system                      3.046 LOC  █
modules/incentivos2         2.433 LOC  █
modules/presupuesto         2.347 LOC  █
modules/incentivos-a        2.164 LOC  █
modules/reasignacion...     1.738 LOC
modules/kaypacha            1.463 LOC
modules/shared              1.433 LOC
modules/sistematica         1.294 LOC
modules/framework-esg       1.230 LOC
modules/Kaypacha2           1.029 LOC
modules/reportes-e            895 LOC
modules/incentivos4           836 LOC
modules/ranking-k             827 LOC
modules/administracion        754 LOC
modules/Kaypacha3             616 LOC
modules/basenegativa          504 LOC
```

### Dentro de `reportes`

```
repositorio/   45.794 LOC   345 archivos   47 sub-reportes — la generación actual
legacy/        27.013 LOC   270 archivos   la generación anterior, aún enrutada
organizacion/   1.898 LOC    76 archivos
components/       130 LOC     5 archivos
compartido/        77 LOC     1 archivo
```

`legacy/` contiene los dos archivos individuales más grandes del proyecto: `comercial/rda/administracion/cra-map.ts` (**3.088 líneas**) y `comercial/rma/administracion/cra-map.ts` (1.103 líneas). Un módulo llamado `legacy` con 27.000 líneas activas no es legacy: es la mitad del sistema sin dueño.

---

## 9. Lectura final de la arquitectura

**Lo que está bien y hay que preservar:**
- Separación de capas real y no violada (`core` → `system` → `modules`)
- Lazy loading correcto en las 22 rutas de negocio
- Bajo acoplamiento entre dominios de negocio
- Un design system propio (`stg-*`) genuinamente adoptado (121 importadores)
- Menú dirigido por datos desde el backend
- El patrón de configuración declarativa (`*.util.ts`) — la idea correcta, mal ejecutada

**Lo que rompe la escalabilidad:**
- La evolución se hace **forkeando** (`incentivos2/3/4/-a`, `Kaypacha/2/3`, `stg-table/2/3/4`), no parametrizando
- El tipado está desactivado de facto (3.014 `any`)
- 339 NgModules para 302 componentes: ceremonia sin beneficio
- Sin red de seguridad (28 specs) para poder refactorizar con confianza
- Cinco dependencias en fin de vida bloqueando la actualización de Angular

**La conclusión operativa:** el problema no es la arquitectura, es el **proceso de crecimiento**. El plan debe cambiar el incentivo — hacer que extender sea más barato que copiar.

---

> Siguiente: [02 — Análisis de refactorización](./02-analisis-refactorizacion.md)
