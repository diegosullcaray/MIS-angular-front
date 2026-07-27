# 02 — Análisis de refactorización

> Documento 2 de 3. Anterior: [Arquitectura](./01-arquitectura.md) · Siguiente: [Plan](./03-plan-refactorizacion.md)

24 hallazgos con evidencia verificada en el código. Prioridad: 🔴 crítico · 🟠 alto · 🟡 medio · 🔵 estratégico.

---

## Tabla de hallazgos

| # | Hallazgo | Prio | Esfuerzo | Impacto |
|---|---|---|---|---|
| [H-01](#h-01) | `WinderService`: singleton con fuga de `FormData` | 🔴 | XS | Corrección |
| [H-02](#h-02) | `ng build` produce bundle de desarrollo | 🔴 | XS | Rendimiento |
| [H-03](#h-03) | `routesArray` acumula permisos entre usuarios | 🔴 | XS | Seguridad |
| [H-04](#h-04) | 7 claves AES incrustadas en el cliente | 🔴 | M | Seguridad |
| [H-05](#h-05) | Validación de sesión y token desactivada | 🔴 | M | Seguridad |
| [H-06](#h-06) | `stg-table2` y `stg-table4` son forks gemelos | 🟠 | S | Orden |
| [H-07](#h-07) | `mod-reportes-e.service.ts` triplicado byte a byte | 🟠 | XS | Orden |
| [H-08](#h-08) | 4 generaciones de `incentivos` en paralelo | 🟠 | L | Escalabilidad |
| [H-09](#h-09) | `reportes/legacy`: 27k LOC sin retirar | 🟠 | L | Escalabilidad |
| [H-10](#h-10) | 3.014 `any` — tipado desactivado | 🟠 | L | Escalabilidad |
| [H-11](#h-11) | 671 `subscribe` vs 52 `takeUntil`: fugas | 🟠 | M | Rendimiento |
| [H-12](#h-12) | 14 selectores de componente duplicados | 🟠 | S | Corrección |
| [H-13](#h-13) | `cypher.service` importa `environment.prod` | 🟠 | XS | Corrección |
| [H-14](#h-14) | Estado como campos `any` mutables públicos | 🟠 | L | Dinamismo |
| [H-15](#h-15) | 28 specs para 302 componentes | 🟠 | L | Escalabilidad |
| [H-16](#h-16) | 339 NgModules para 302 componentes | 🟡 | M | Orden |
| [H-17](#h-17) | 671 `console.log` sin capa de logging | 🟡 | S | Orden |
| [H-18](#h-18) | 5 dependencias en fin de vida | 🟡 | M | Escalabilidad |
| [H-19](#h-19) | 3 librerías de gráficos, 2 de mapas | 🟡 | M | Rendimiento |
| [H-20](#h-20) | `OnPush` en 1 de 302 componentes | 🟡 | M | Rendimiento |
| [H-21](#h-21) | Presupuestos de bundle irreales | 🟡 | XS | Rendimiento |
| [H-22](#h-22) | ~3.500 líneas de código comentado | 🟡 | S | Orden |
| [H-23](#h-23) | Rutas estáticas contra menú dinámico | 🔵 | L | **Dinamismo** |
| [H-24](#h-24) | `*.util.ts` sin contrato tipado | 🔵 | L | **Dinamismo** |

---

# 🔴 Críticos

## H-01
### `WinderService` es un singleton mutable con fuga de `FormData`

**Archivo:** `src/app/core/data/remote/winder/winder.service.ts:23-35`

`WinderService` se declara una sola vez en `system.module.ts:41`, dentro de un módulo importado *eagerly* por `AppModule`. Es por tanto **una única instancia compartida por las 27 subclases de `AntService`** de todo el sistema.

El método `prepare()` reinicia `strands` pero **no reinicia `formData`**:

```typescript
public prepare(conn: IWinderConnectionConf, conf: IWinderRequestConfig): WinderService {
    this.strands = [];          // ← se limpia
    // this.formData             ← NUNCA se limpia
    ...
}

private addStrand(strand: Strand) {
    if (strand.haveFormData()) {
        this.formData = strand.getFormData();   // ← solo se asigna, nunca se borra
    }
    this.strands.push(strand);
}

public post<T>(): Observable<T> {
    var rp = new RESTPacket();
    if (this.formData) {                 // ← queda permanentemente en true
        rp.baseRoute = "v1/pf";          // ← ruta de multipart
        fd.append("w", this.winderConfig());
        rp.setFormData(fd);
    } else {
        rp.baseRoute = "v1/p";
    }
    ...
}
```

**Escenario de fallo:** un usuario sube un archivo en `framework-esg`. A partir de ese momento y hasta que recargue la página, **cualquier POST de cualquier módulo** (registrar transacción, guardar presupuesto, reasignar cartera) se envía a `/v1/pf` como `multipart/form-data`, arrastrando el `FormData` con el archivo original. El backend recibe una petición con la forma equivocada y el archivo de otra operación adjunto.

**Corrección inmediata (una línea):**
```typescript
public prepare(conn, conf): WinderService {
    this.strands = [];
    this.formData = undefined;   // ← añadir
    ...
}
```

**Corrección estructural:** el estado no debe vivir en el servicio. `prepare()` debe devolver un objeto `WinderRequest` inmutable en lugar de `this`. Esto elimina la clase entera de bugs, no solo esta instancia.

---

## H-02
### `ng build` genera un bundle de desarrollo

**Archivo:** `angular.json:94`

```json
"defaultConfiguration": ""
```

El target `build` no declara configuración por defecto. `ng build` (es decir, `npm run build`) usa las `options` base:

| Opción | Valor en build por defecto |
|---|---|
| `optimization` | `false` |
| `buildOptimizer` | `false` |
| `sourceMap` | **`true`** |
| `vendorChunk` | `true` |
| `outputHashing` | ausente |
| `fileReplacements` | **no se aplica** |

Consecuencias si el pipeline usa `npm run build`:
- Bundle sin minificar ni *tree-shaking* — para 122k LOC más Highcharts, Chart.js, Leaflet, Google Maps y Power BI, la diferencia es de varios megabytes.
- **Source maps publicados**: el código fuente completo queda legible en el navegador — incluidos los secretos de [H-04](#h-04).
- Se usa `environment.ts` (desarrollo), que contiene `devUser: 'oscar.sanchez@confianza.pe'` y `production: false`. Con `production: false`, `LocalStoreService` **deja de cifrar** el almacenamiento local:
  ```typescript
  if (environment.production) { value = this.cypherService.encrypt(value); }
  ```

**Corrección:** `"defaultConfiguration": "production"` y añadir una configuración `staging`.

---

## H-03
### `routesArray` acumula permisos de rutas entre usuarios

**Archivos:** `navigation.service.ts:59,113,136` · `route-guard.guard.ts:24`

```typescript
public routesArray: string[] = [];       // línea 59 — inicializado UNA vez

private menu(mr: any[]) {
    this.menuItemsBuffer = [];           // ← se limpia
    this.shortcutItemsBuffer = [];       // ← se limpia
    // this.routesArray                  ← NO se limpia
    mr.filter(...).forEach(e => {
        if (!isNullOrUndefined(e.act_sec)) {
            this.routesArray.push(e.act_sec);   // línea 113 — solo push
        }
        ...
    });
}
```

`RouteGuard` autoriza exactamente contra este array:
```typescript
let v = this.navService.routesArray.includes(state.url);
```

**Escenario de fallo:** el sistema tiene una función de suplantación (*alt user* — `UserService.isAlt`, `AltUserDialogComponent`, `initMenu(mr, isAlt)`). Cuando un administrador suplanta a otro usuario, `initMenu()` llama a `menu()` de nuevo. El menú visible se reemplaza correctamente, pero `routesArray` **suma** las rutas del nuevo perfil a las del anterior. Tras volver a `original()`, el array conserva las rutas de ambos.

El resultado es una **escalada de privilegios acumulativa**: cada suplantación amplía permanentemente el conjunto de rutas que `RouteGuard` autoriza en esa sesión.

**Atenuante:** `RouteGuard` solo protege 2 de ~22 rutas (el resto está comentado), así que la superficie real es reducida — pero eso es un segundo problema, no una mitigación.

**Corrección:** añadir `this.routesArray = [];` al inicio de `menu()`. Y aplicar `RouteGuard` a todas las rutas de negocio.

---

## H-04
### Siete claves AES incrustadas en el código cliente

**Archivos:** 32 ubicaciones. Ejemplos:

```typescript
// core/data/remote/instances/mod-app-service.ts:12
secret: "CCAFE0F473E9B66F2EA57D46C5C3047E"     // appId "app",     puerto 6302
// core/data/remote/instances/mod-sys-login.service.ts:16
secret: "8A9ABC5A76E1A86B26402C32DD355394"     // appId "session", puerto 6300
// core/data/remote/instances/mod-sys-admin.service.ts:14
secret: "29A832E1F8C68ECB46E7C89716BB68E2"
// modules/analista/compartido/servicios/mod-sec.service.ts:18
secret: "D4305E5943A377227C6BF78C8E3278AD"
// modules/reportes/compartido/servicios/mod-rep.service.ts:23
secret: "B0ECE459601D3577F7408D5C8DEA314A"
// modules/reportes/repositorio/mon-imr/.../mon-imr-ant.service.ts:20
secret: "8982D9BA889F825E1360E0C594653C68"
// modules/sistematica/compartido/servicios/mod-sistematica.service.ts:20
secret: "AF2D32E4D26CCDCCE753ABA562C41D67"
// environments/environment.ts + .prod.ts
cypherSecret: '85A99A2F37313C9B921BCC827AB7FC67'
```

Todo código de frontend se entrega al navegador. Estas claves son **públicas de facto** para cualquiera con acceso a la aplicación, y trivialmente extraíbles del bundle (más aún con los source maps de [H-02](#h-02)).

Se suma una debilidad criptográfica en `cypher.service.ts:28`:
```typescript
var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');   // IV fijo en cero
```
Un IV constante en AES-CBC hace el cifrado determinista: el mismo texto plano produce siempre el mismo texto cifrado, lo que filtra información y permite reconocer valores repetidos.

**Qué significa realmente:** si el backend usa estos secretos como control de acceso, el control no existe. Si los usa solo como ofuscación del transporte, entonces la seguridad real recae íntegramente en el token OAuth — que hoy no se está validando ([H-05](#h-05)).

**Corrección — no es solo código:**
1. Determinar con el equipo de backend qué garantiza realmente el secreto de Winder.
2. Si es autenticación → **rotar las 7 claves** y moverlas al servidor. El navegador nunca debe poseerlas.
3. Si es ofuscación → documentarlo explícitamente y basar la autorización en el token.
4. Consolidar los 7 secretos en un único punto de configuración inyectado en build.
5. Si el repositorio ha sido alguna vez público o compartido con terceros, tratar las claves como comprometidas.

---

## H-05
### Validación de sesión y de token desactivada

**Archivos:** `auth.service.ts:200` · `auth.guard.ts:47-57` · `TokenInterceptor.ts:22-36`

**a) `isLoged` comprueba presencia, no validez:**
```typescript
public get isLoged(){
    let v = this.storage.getItem(system_keys.auth_resp);
    return (v !== null);          // ← no mira exp, ni firma, ni validez
}
```

**b) La comprobación de expiración en `AuthGuard` está comentada:**
```typescript
private obs() {
    if (this.authService.isLoged) {
        /*let tk = this.tokenService.getAccessToken();
        if (tk) {
            if (!this.tokenService.validateTimeToken()) {
                this.adminService.openSessionEndDialog();
                return of(false);
            }
        }*/
        return of(true);          // ← entra siempre
    }
    ...
}
```

**c) `TokenInterceptor` ya no adjunta la cabecera `Authorization`:**
```typescript
intercept(request, next) {
    if(this.isAntDomain(request.url)) { this.tokenService.updateToken(); }
    /*  ...todo el bloque que hacía request.clone({ setHeaders: { Authorization: tk }})
        y que cortaba la petición si el token era inválido, está comentado...  */
    return next.handle(request);   // ← pasa sin credencial
}
```

**Consecuencia combinada:** la sesión del frontend dura mientras exista una entrada en `localStorage`, independientemente de la expiración del token, y las peticiones al backend viajan sin cabecera de autorización. La identidad efectiva del usuario es el `email` enviado en el payload del strand.

**Corrección:** reactivar (b) y (c) coordinadamente con backend, y reescribir `isLoged` para validar `exp`. Requiere verificar primero cómo autentica hoy el backend, porque el código sugiere que la cabecera se retiró deliberadamente.

---

# 🟠 Altos

## H-06
### `stg-table2` y `stg-table4` son forks gemelos

**Archivos:** `core/screen/components/stg-table2/` y `stg-table4/`

Ambos componentes tienen **exactamente 464 líneas** y **API idéntica**:

```typescript
@Input() options: any;          @Input() dataSource: any[];
@Input() headers: any[];        @Input() optionsObserver: Subject<any>;
@Input() enableSort: number = 0;
@Output() onSelectRow;          @Output() onClickCell;
```

Un `diff` normalizando los nombres `table2`/`table4` arroja 283 líneas de diferencia, y en su mayoría son **ruido cosmético**: espacios en blanco, `changes.headers` vs `changes['headers']`, comentarios eliminados. La única divergencia funcional real es que `stg-table2` implementa ordenamiento con `MatSort` (`@ViewChild(MatSort)`, `sortReady`) y `stg-table4` no.

La familia completa:

| Componente | LOC | API | Estado |
|---|---|---|---|
| `stg-table` | 397 | 13 `@Input` sin tipar | Original |
| `stg-table2` | 464 | `any` | Fork con `MatSort` |
| `stg-table3` | 254 | **`IStgTable3Header[]`, `StgTable3Options` — tipada** | El mejor diseño |
| `stg-table4` | 464 | `any` | Gemelo de `stg-table2` sin `MatSort` |

**Recomendación:** `stg-table3` es el único con contrato tipado y el más compacto. Debe ser la base de la tabla unificada. `stg-table4` puede colapsarse contra `stg-table2` de inmediato (la diferencia es una funcionalidad opcional que ya es un `@Input`).

---

## H-07
### `mod-reportes-e.service.ts` triplicado byte a byte

**Archivos:**
- `modules/reportes-e/compartido/servicios/mod-reportes-e.service.ts` (42 líneas)
- `modules/ranking-k/compartido/servicios/mod-reportes-e.service.ts` (42 líneas)
- `modules/reasignacion-cart-cap/compartido/servicios/mod-reportes-e.service.ts` (67 líneas)

Los dos primeros difieren en **un único espacio en blanco al final de una línea**. Los tres declaran la clase `ModReportesEService` con el mismo `secret` y el mismo `appId`.

Es el caso más limpio del patrón general: cuando un módulo nuevo necesita hablar con un servicio existente, se copia el archivo en lugar de importarlo.

**Corrección:** un único `ModReportesEService` en `core/data/remote/instances/`, importado por los tres módulos. Es la refactorización de menor riesgo y mayor valor demostrativo del proyecto — sirve como prueba de concepto para el resto.

---

## H-08
### Cuatro generaciones de `incentivos` conviviendo

```
incentivos2   2.433 LOC   33 archivos   sin ruta activa
incentivos3   4.786 LOC   67 archivos   ruta /app/incentivos3
incentivos4     836 LOC   35 archivos   ruta /app/incentivos4
incentivos-a  2.164 LOC   36 archivos   ruta /app/incentivos-a
                                        ── total 10.219 LOC
```

Las tres rutas activas comparten `data: { title: 'Incentivos' }` — desde la perspectiva del usuario **son la misma sección**.

Cada generación reimplementa la misma estructura: `calculadora/`, `principal/`, `perfil/`, `compartido/servicios/`. Comparando los `calculadora-base.component.ts`:

| Versión | LOC |
|---|---|
| `incentivos2` | 98 |
| `incentivos3` | 178 |
| `incentivos-a` | 75 |

Las variantes divergieron lo suficiente como para no ser un `diff` trivial, pero resuelven el mismo problema de negocio con distintos parámetros de campaña.

Síntoma revelador — en `incentivos3/principal/principal.component.ts:6`:
```typescript
selector: 'app-principal-incentivos2',      // ← dentro de incentivos3
```
El fork nunca se renombró del todo. Lo mismo ocurre en `Kaypacha/2/3` (3.108 LOC en tres módulos) y `reportes` / `reportes-e`.

**Diagnóstico de fondo:** cuando cambia el modelo de incentivos (2025 → 2026, campaña A → B), el equipo copia el módulo entero. Ya existe la prueba de que el problema es *parametrizable* — dentro de `incentivos3.service.ts:91`:
```typescript
changeModel() {
    this.model = this.model == '2025' ? '2026' : '2025';
    ...
}
```
Ahí sí se resolvió con un parámetro. El resto del tiempo, con `Ctrl+C`.

**Corrección:** un único módulo `incentivos` con el **modelo de campaña como dato de configuración**, no como directorio. Es la refactorización de mayor retorno del proyecto y el caso de prueba del objetivo "dinámico".

---

## H-09
### `reportes/legacy`: 27.013 líneas sin retirar

```
reportes/repositorio/   45.794 LOC   345 archivos   47 sub-reportes
reportes/legacy/        27.013 LOC   270 archivos   ← generación anterior
reportes/organizacion/   1.898 LOC    76 archivos
```

`legacy/` contiene los dos archivos más grandes del repositorio:
- `legacy/comercial/rda/administracion/cra-map.ts` — **3.088 líneas**
- `legacy/comercial/rma/administracion/cra-map.ts` — 1.103 líneas

y ficheros de routing desproporcionados (`rda-administracion-routing.module.ts`, 726 líneas).

`legacy` está bajo `rep01.module.ts`, que sí se enruta desde `app-routing.module.ts`. No hay marcadores de fecha de retirada ni de sustituto.

**Corrección:** este es el mayor bloque de valor recuperable del proyecto (22% del código). Requiere una auditoría de uso real — telemetría de rutas o consulta a negocio — para decidir qué se migra y qué se elimina. No es refactorización: es **retirada**.

---

## H-10
### 3.014 ocurrencias de `: any` — el tipado está desactivado

**Configuración:** `tsconfig.json` no declara `strict`, y `strictTemplates: false`.

3.014 anotaciones `: any` sobre 941 archivos `.ts` ≈ **3,2 por archivo**. Se concentran donde más daño hacen:

```typescript
// incentivos3.service.ts — el estado completo de un dominio
principal: any;  perfil: any;  avances: any;  superPlus: any;
composicion: any; tabla: any;  monetizado: any; aportes: any;
detalle: any;    calculadora: any;  usuCfg: any;

// winder.interface.ts — la frontera con el backend
export interface IWinderResponse { code:string, headers:any, body:any, errors?:any }
```

`body: any` significa que **ninguna respuesta del backend está tipada en todo el sistema**. Cada acceso a un campo es una apuesta verificada en producción.

**Corrección incremental (no big-bang):**
1. `strict: true` + `strictTemplates: true` en `tsconfig.json`.
2. `"files"` / `"include"` progresivo, o `// @ts-nocheck` temporal en los archivos aún no migrados.
3. Empezar por la frontera: tipar `IWinderResponse<T>` genérico y los payloads de los dominios más activos.
4. Regla de lint que impide *nuevos* `any` — el objetivo es detener la hemorragia antes que curar la herida.

---

## H-11
### 671 `subscribe` contra 52 archivos con `takeUntil`

| Señal | Valor |
|---|---|
| Llamadas a `.subscribe(` | 671 |
| Archivos con `ngOnDestroy` | 95 |
| Archivos con `takeUntil` | 52 |

Menos del 10% de las suscripciones tiene una vía de cancelación identificable. En una SPA con navegación intensa entre 47 sub-reportes, cada componente destruido sin desuscribir deja vivo su callback: acumulación de memoria, peticiones huérfanas y, en el caso de subjects compartidos, **actualizaciones aplicadas a componentes ya destruidos**.

Caso concreto en `incentivos3.service.ts:97-118` — un servicio que gestiona sus propias suscripciones con un *flag* manual:
```typescript
private subscribe() {
    if (this.subsF) {
        this.subsF = false;
        this.subs1 = this.secPicker.selectedSec$.subscribe(...);
        this.subs2 = this.tblPicker.afterCloseEvent$.subscribe(...);
    }
}
clean() {
    this.subs1.unsubscribe();   // ← si clean() se llama antes que subscribe(), NPE
    this.subs2.unsubscribe();
}
```

**Corrección:** `async` pipe en plantillas donde sea posible; `takeUntilDestroyed()` en el resto; regla de lint `rxjs/no-ignored-subscription`.

---

## H-12
### 14 selectores de componente duplicados

```
4  app-buscador-kaypacha
2  app-usuarios-reportes-e        2  app-usuarios-framework-esg
2  app-transaccion-popup          2  app-transaccion
2  app-rep2-principal-mon-salidas 2  app-principal-reportes-k
2  app-principal-incentivos2      2  app-mapa-simple
2  app-detallek                   2  app-detalle-dialog
2  app-detalle2-incentivos4       2  app-cra-aut-tasa
2  app-calculadora-dialog-incentivos2
```

Angular tolera selectores repetidos **mientras los componentes vivan en NgModules distintos**. En cuanto dos de ellos coincidan en el mismo módulo — algo que ocurre al consolidar módulos, exactamente lo que propone [H-16](#h-16) — el compilador falla o, peor, resuelve al componente equivocado silenciosamente.

Es una **mina antipersona para la refactorización**: hay que desactivarla *antes* de empezar a consolidar.

`app-principal-incentivos2` apareciendo dentro de `incentivos3` confirma además el origen: forks sin renombrar ([H-08](#h-08)).

---

## H-13
### `cypher.service.ts` importa `environment.prod` directamente

**Archivo:** `core/shared/cypher.service.ts:3`

```typescript
import { environment } from 'environments/environment.prod';   // ← ruta .prod explícita
```

El mecanismo `fileReplacements` de Angular sustituye `environment.ts` por `environment.prod.ts` **solo cuando se importa `environments/environment`**. Al importar el archivo `.prod` por su nombre, este servicio **queda anclado a la configuración de producción en todos los entornos**.

Hoy es inocuo porque ambos archivos comparten `cypherSecret`. Deja de serlo en el momento en que se separen las claves por entorno — que es precisamente lo que exige [H-04](#h-04). Se convertiría en un fallo de descifrado silencioso en desarrollo.

**Corrección:** `import { environment } from 'environments/environment';` Un carácter. Hacerlo antes de tocar los secretos.

---

## H-14
### El estado vive como campos `any` públicos y mutables

**Archivo representativo:** `modules/incentivos3/compartido/servicios/incentivos3.service.ts`

```typescript
@Injectable()
export class Incentivos3Service {
  tip_cod: number;  cod_rel: string;  firstLoad: boolean;
  principal: any;   perfil: any;      avances: any;    superPlus: any;
  composicion: any; tabla: any;       monetizado: any; aportes: any;
  detalle: any;     calculadora: any;
  // ...

  private setDefaults() {
    this.principal = cloneObject(principalConfig);
    this.perfil    = cloneObject(perfilConfig);
    // ...
  }
}
```

Los componentes leen y **escriben** directamente estos campos. No hay observables, no hay inmutabilidad, no hay una única fuente de verdad ni trazabilidad de quién cambió qué.

**Por qué importa más allá del estilo:** este patrón es la razón técnica de que `OnPush` esté en 1 de 302 componentes ([H-20](#h-20)). Angular no puede detectar mutaciones internas de un objeto `any` compartido, así que la app está condenada a la detección de cambios por defecto — que recorre el árbol completo en cada evento. Con tablas de miles de filas, eso es el cuello de botella de rendimiento del sistema.

**Corrección:** convertir cada servicio de dominio en un *store* mínimo con `BehaviorSubject<EstadoTipado>` y actualizaciones inmutables. No hace falta NgRx; basta con la disciplina. Habilita `OnPush` de forma segura y hace el estado depurable.

---

## H-15
### 28 specs para 302 componentes

```
Componentes:  302        Servicios: 84
Archivos .spec.ts:  28   (≈9% de cobertura estructural)
E2E:  Protractor (fin de vida), un único app.e2e-spec.ts
```

Varios de los 28 specs son plantillas generadas por el CLI (`should create`), no pruebas de comportamiento.

**Consecuencia directa sobre este plan:** sin red de seguridad, toda refactorización de las secciones anteriores es **una apuesta**. Por eso el plan sitúa la infraestructura de pruebas en la Fase 0, antes que cualquier consolidación, y exige tests de caracterización sobre la lógica de negocio (cálculo de incentivos, agregación de reportes) *antes* de unificar los forks de [H-08](#h-08).

---

# 🟡 Medios

## H-16
### 339 NgModules para 302 componentes

Más módulos que componentes. La causa es el patrón "un módulo + un routing module por pantalla", con archivos de routing de hasta 726 líneas (`rda-administracion-routing.module.ts`).

Angular 14 soporta **componentes `standalone`**, y el proyecto tiene **0**. Consolidar módulos y migrar a `standalone` elimina la mayor parte de esta ceremonia. Prerequisito obligatorio: resolver [H-12](#h-12) primero.

## H-17
### 671 `console.log` sin capa de logging

Existe `core/shared/debug.util.ts` con `printLog`/`printWarn`/`printError` — y aun así hay 671 `console.log` directos. No hay niveles, ni supresión en producción, ni envío a un colector.

Además `RouteGuard` y `AuthGuard` registran cada intento de navegación en consola, incluyendo URLs de negocio.

**Corrección:** un `LoggerService` con niveles, silenciado en producción salvo `error`. Regla de lint `no-console`.

## H-18
### Cinco dependencias en fin de vida

| Dependencia | Situación | Bloquea |
|---|---|---|
| `@angular/flex-layout` | **Deprecado y archivado** por Angular | Actualización de Angular |
| `rxjs-compat` | *Shim* de migración RxJS 5→6, ya innecesario | RxJS 7 |
| `tslint` 6.1 | Deprecado desde 2019 | Reglas modernas |
| `protractor` 7 | Fin de vida | E2E moderno |
| OAuth *Implicit Flow* | Desaconsejado por OAuth 2.1 | Seguridad |

Ninguna rompe hoy. Todas juntas hacen que actualizar Angular 14 → 17+ sea un proyecto en lugar de una tarea. Y sin esa actualización no hay `signals`, ni control flow nuevo, ni las mejoras de rendimiento que el objetivo de escalabilidad requiere.

**Orden recomendado:** `rxjs-compat` (verificar y eliminar) → TSLint → ESLint → `flex-layout` → CSS Grid/Flex nativo → Protractor → Playwright/Cypress → Angular 15/16/17 por saltos → Code Flow + PKCE.

## H-19
### Tres librerías de gráficos y dos de mapas

```
Gráficos:  highcharts 9 + highcharts-angular + @highcharts/map-collection
           chart.js 4 + ng2-charts
Mapas:     leaflet + @asymmetrik/ngx-leaflet
           @angular/google-maps + @types/google.maps
           proj4 (reproyección)
Utilidad:  lodash.clonedeep + lodash.merge + una función cloneObject propia
```

Highcharts es además **licencia comercial** — conviene verificar que la licencia cubre el uso actual.

**Corrección:** elegir una de gráficos y una de mapas. La eliminación de la otra es tanto peso de bundle como superficie de mantenimiento.

## H-20
### `OnPush` en 1 de 302 componentes

Consecuencia técnica directa de [H-14](#h-14). Con detección por defecto, cada evento del navegador dispara un recorrido completo del árbol. En pantallas con `stg-table` de miles de filas, es el principal cuello de botella percibido.

`OnPush` solo puede activarse de forma segura *después* de migrar el estado a flujos inmutables. Orden obligatorio: H-14 → H-20.

## H-21
### Presupuestos de bundle irreales

```json
{ "type": "initial", "maximumWarning": "500kb", "maximumError": "5mb" }
```

Un error a 5 MB no es un presupuesto, es una ausencia de presupuesto. Y solo aplica en `production`, que hoy no es el default ([H-02](#h-02)).

**Corrección:** medir el tamaño real tras arreglar H-02, fijar el umbral de error un 10% por encima, y bajarlo en cada fase. Un presupuesto que nunca falla no informa nada.

## H-22
### ~3.500 líneas de código comentado

```
Líneas con // al inicio:  3.024
Bloques /* */:              499
TODO / FIXME / HACK:         69
```

No es cosmético: en `auth.guard.ts`, `TokenInterceptor.ts` y `app-routing.module.ts` el código comentado es **lógica de seguridad desactivada** ([H-05](#h-05), [H-03](#h-03)). Un lector no puede distinguir "esto se probó y se descartó" de "esto está roto temporalmente".

**Corrección:** git es el historial. Eliminar todo bloque comentado, salvo los que documenten una decisión — y esos convertirlos en comentario explicativo con fecha y motivo.

---

# 🔵 Estratégicos — el objetivo "dinámico"

Estos dos hallazgos no son deuda: son **la oportunidad**. Responden directamente al pedido de que el proyecto sea más dinámico.

## H-23
### Rutas estáticas contra un menú dinámico

El sistema ya tiene la mitad de un enrutado dinámico:

```typescript
// NavigationService — el backend decide qué ve cada usuario
private menu(mr: any[]) {
    mr.filter(e => isNullOrUndefined(e.cod_par))
      .sort(this.compareItems)
      .forEach(e => { /* construye el árbol con act_sec, icon_sec, desc_sec */ });
}
```

Pero la otra mitad está escrita a mano en `app-routing.module.ts`: 22 rutas declaradas estáticamente, cada una con su `loadChildren` y su `path` literal. Cuando negocio pide una sección nueva, hay que **modificar el código y desplegar el frontend**, aunque el menú ya sea capaz de mostrarla.

Peor: las dos mitades pueden desincronizarse. El menú puede ofrecer una ruta que no existe en el router, o el router exponer una ruta que ningún menú muestra (y que, sin `RouteGuard`, es accesible escribiendo la URL — ver [H-03](#h-03)).

**Propuesta:** un **registro de módulos** que asocie una clave lógica con su cargador perezoso:

```typescript
export const MODULE_REGISTRY: Record<string, () => Promise<Type<unknown>>> = {
  'incentivos':  () => import('app/modules/incentivos/incentivos.module').then(m => m.IncentivosModule),
  'presupuesto': () => import('app/modules/presupuesto/presupuesto.module').then(m => m.PresupuestoModule),
  // ...
};
```

Con las rutas generadas a partir del menú del backend usando `router.resetConfig()` tras el login. El backend pasa a controlar **qué módulos existen para cada usuario, con qué ruta y en qué orden** — y `RouteGuard` deja de ser necesario porque una ruta no autorizada simplemente no se registra.

Esto convierte "publicar una sección nueva" de un despliegue en un cambio de configuración.

## H-24
### El patrón `*.util.ts` sin contrato tipado

El proyecto ya inventó un motor de pantallas declarativo:

```typescript
export const principalConfig = { loading: true }
export const tablaConfig = { /* columnas, formato, acciones... */ }
```

11 archivos `principal.util.ts`, 4 `detalle.util.ts`, 47 sub-reportes construidos así. **La intuición arquitectónica es correcta** — es exactamente el camino hacia el dinamismo. Lo que falta es hacerlo real:

| Hoy | Objetivo |
|---|---|
| La config es `any` | Interfaces `ScreenConfig`, `TableConfig`, `FilterConfig` tipadas |
| Vive en el bundle del front | Servida por el backend, versionada |
| Se copia entre módulos | Se compone desde primitivas reutilizables |
| Sin validación | Validada contra un esquema al cargar |
| Cambiar una pantalla = desplegar | Cambiar una pantalla = editar configuración |

Combinado con [H-23](#h-23), el resultado es que **añadir un reporte nuevo deja de requerir código**: se declara su configuración y su entrada de menú. Para un sistema con 47 sub-reportes y crecimiento constante, ese es el cambio que decide si el proyecto escala o se ahoga.

Y es alcanzable de forma incremental: tipar las configuraciones existentes ya da autocompletado y validación en compilación, sin mover nada al backend todavía.

---

## Síntesis: por qué crece el desorden

Los 24 hallazgos tienen una sola causa raíz:

> **Extender por copia es más barato que extender por parámetro — porque no hay tests que hagan segura la modificación de código compartido.**

Sin cobertura, tocar `incentivos3` para soportar un caso nuevo arriesga romper lo que funciona. Copiarlo a `incentivos4` no arriesga nada hoy... y duplica el coste de mañana. Cuatro generaciones de incentivos, tres de Kaypacha, cuatro tablas y tres servicios idénticos son el resultado acumulado de esa decisión, repetida racionalmente.

**El plan no puede empezar por limpiar duplicados. Tiene que empezar por hacer que no copiar sea la opción segura.**

---

> Siguiente: [03 — Plan de refactorización](./03-plan-refactorizacion.md)
