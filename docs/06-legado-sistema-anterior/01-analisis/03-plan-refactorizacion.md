# Plan de refactorización — `stg-app-mis-r22`

> **Para quien ejecute este plan:** los pasos usan casillas (`- [ ]`) para seguimiento. Las Fases 0–2 están detalladas a nivel de tarea ejecutable. Las Fases 3–5 definen objetivo, alcance y criterio de aceptación, y deben re-planificarse en detalle al llegar a ellas — planificar hoy 6 meses de trabajo con este nivel de detalle produciría ficción, no un plan.
>
> Documento 3 de 3. Anterior: [Análisis](./02-analisis-refactorizacion.md)

**Objetivo:** Convertir un portal Angular de 122k LOC que crece por duplicación en un sistema donde extender es más barato que copiar — ordenado, escalable y dirigido por configuración.

**Arquitectura:** Se conserva la separación de capas existente (`core` → `system` → `modules`), que está sana. Se ataca el *proceso de crecimiento*: primero red de seguridad y correcciones críticas, luego consolidación de duplicados, y finalmente la conversión del patrón `*.util.ts` en un motor de pantallas tipado con rutas generadas desde el backend.

**Stack:** Angular 14.2 → 17+ · TypeScript 4.6 → 5.x · RxJS 6.6 → 7 · Angular Material · Jest/Karma · ESLint · Playwright

---

## Restricciones globales

Aplican a **todas** las tareas de todas las fases:

- **Sin regresiones funcionales.** El sistema está en producción en una entidad financiera. Toda tarea que modifique comportamiento existente exige test de caracterización previo.
- **Commits atómicos** por tarea, con mensaje convencional (`fix:`, `refactor:`, `test:`, `chore:`).
- **Una rama por fase**, PR con revisión. Nunca commits directos a `main`.
- **Ningún `any` nuevo.** El código tocado se tipa; el no tocado se deja como está.
- **Ningún `console.log` nuevo.** Usar `debug.util.ts` hasta que exista `LoggerService`.
- **Nunca eliminar código sin verificar uso** — búsqueda de referencias + confirmación con negocio para módulos enrutados.
- **Los secretos no vuelven al repositorio.** Ninguna tarea puede introducir credenciales en el código fuente.
- **Idioma:** código y commits en español, coherente con la base existente.

---

## Mapa de fases

| Fase | Nombre | Duración est. | Hallazgos que cierra | Bloquea a |
|---|---|---|---|---|
| **0** | Estabilizar y medir | 1–2 sem | H-01, H-02, H-03, H-13, H-21 | Todo |
| **1** | Higiene y red de seguridad | 3–4 sem | H-12, H-15, H-17, H-22, H-10(inicio) | Fases 2+ |
| **2** | Consolidar duplicados | 6–8 sem | H-06, H-07, H-08, H-16 | Fase 4 |
| **3** | Seguridad y modernización | 6–8 sem | H-04, H-05, H-18, H-19 | Fase 5 |
| **4** | Rendimiento y estado | 4–6 sem | H-11, H-14, H-20 | Fase 5 |
| **5** | Motor dinámico | 8–12 sem | H-23, H-24 | — |
| **X** | Retirada de `legacy` | Paralelo | H-09 | — |

**Orden no negociable:** Fase 0 antes que todo. Fase 1 antes de consolidar nada. H-12 (selectores duplicados) **antes** de H-16 (consolidar módulos). H-14 (estado) **antes** de H-20 (`OnPush`).

---

# Fase 0 — Estabilizar y medir

> **Duración:** 1–2 semanas · **Riesgo:** bajo · **Retorno:** inmediato
>
> Cinco correcciones de pocas líneas que arreglan un bug de producción, un despliegue roto y un fallo de autorización. Se hace primero porque es barato, urgente e independiente del resto.

## Tarea 0.1 — Corregir la fuga de `FormData` en `WinderService`

Cierra [H-01](./02-analisis-refactorizacion.md#h-01). **Es un bug activo en producción.**

**Archivos:**
- Modificar: `src/app/core/data/remote/winder/winder.service.ts:23-35`
- Crear: `src/app/core/data/remote/winder/winder.service.spec.ts`

- [ ] **Paso 1: Escribir el test que falla**

```typescript
// src/app/core/data/remote/winder/winder.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WinderService } from './winder.service';
import { RESTService } from '../rest/rest.service';
import { CypherService } from 'app/core/shared/cypher.service';
import { TokenService } from 'app/core/shared/token.service';
import { Strand } from './strand.class';

describe('WinderService', () => {
  let service: WinderService;
  let httpMock: HttpTestingController;
  const conn = { port: 6302, secret: '00000000000000000000000000000000', appId: 'test' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WinderService, RESTService, CypherService, TokenService]
    });
    service = TestBed.inject(WinderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('no debe reutilizar el FormData de una peticion anterior', () => {
    // 1. Peticion CON archivo
    const conArchivo = new Strand('subir.archivo');
    conArchivo.setFile(new File(['x'], 'test.pdf'), 'id-1');
    service.prepare(conn, { responseType: 'JSON', strands: conArchivo }).post().subscribe();
    httpMock.expectOne(r => r.url.endsWith('/v1/pf')).flush({});

    // 2. Peticion SIN archivo — debe ir a /v1/p, no a /v1/pf
    const sinArchivo = new Strand('guardar.datos');
    sinArchivo.pushToPayload('campo', 'valor');
    service.prepare(conn, { responseType: 'JSON', strands: sinArchivo }).post().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/v1/'));
    expect(req.request.url).toContain('/v1/p');
    expect(req.request.url).not.toContain('/v1/pf');
    expect(req.request.body instanceof FormData).toBe(false);
    req.flush({});
  });
});
```

- [ ] **Paso 2: Ejecutar y verificar que falla**

Ejecutar: `npm test -- --include='**/winder.service.spec.ts' --watch=false`
Esperado: FALLA — la segunda petición va a `/v1/pf` con `FormData`.

- [ ] **Paso 3: Aplicar la corrección mínima**

```typescript
// winder.service.ts — en prepare(), tras la línea 24
public prepare(conn: IWinderConnectionConf, conf: IWinderRequestConfig): WinderService {
    this.strands = [];
    this.formData = undefined;    // ← AÑADIR: evita arrastrar FormData entre peticiones
    ...
}
```

- [ ] **Paso 4: Ejecutar y verificar que pasa**

Ejecutar: `npm test -- --include='**/winder.service.spec.ts' --watch=false`
Esperado: PASA.

- [ ] **Paso 5: Verificar manualmente el flujo de subida**

Arrancar `npm start`, subir un archivo en `framework-esg`, y a continuación ejecutar cualquier acción de guardado en otro módulo. Confirmar en la pestaña Red que la segunda petición va a `/v1/p`.

- [ ] **Paso 6: Commit**

```bash
git add src/app/core/data/remote/winder/
git commit -m "fix(winder): limpiar FormData en prepare() para no contaminar peticiones posteriores"
```

---

## Tarea 0.2 — Arreglar la configuración de build de producción

Cierra [H-02](./02-analisis-refactorizacion.md#h-02) y [H-21](./02-analisis-refactorizacion.md#h-21).

**Archivos:**
- Modificar: `angular.json` (target `build`)
- Crear: `src/environments/environment.staging.ts`

- [ ] **Paso 1: Medir la línea base actual**

```bash
npm run build
du -sh dist/stg-app-mis-r22
ls -la dist/stg-app-mis-r22/*.js
```
Anotar el tamaño total y si existen archivos `.map`. Este número es la referencia contra la que se mide la mejora.

- [ ] **Paso 2: Establecer producción como configuración por defecto**

En `angular.json`, target `build`, reemplazar `"defaultConfiguration": ""` por:
```json
"defaultConfiguration": "production"
```

- [ ] **Paso 3: Añadir configuración de staging**

En `angular.json`, dentro de `build.configurations`, junto a `production`:
```json
"staging": {
  "fileReplacements": [
    { "replace": "src/environments/environment.ts", "with": "src/environments/environment.staging.ts" }
  ],
  "optimization": true,
  "outputHashing": "all",
  "sourceMap": true,
  "namedChunks": true,
  "extractLicenses": true,
  "vendorChunk": false,
  "buildOptimizer": true
}
```
Y en `serve.configurations`: `"staging": { "browserTarget": "stg-app-mis-r22:build:staging" }`

- [ ] **Paso 4: Crear el environment de staging**

```typescript
// src/environments/environment.staging.ts
export const environment = {
  production: true,
  devTracing: false,
  devAd: false,
  ipProvider: 'https://api.ipify.org/?format=json',
  cypherSecret: '85A99A2F37313C9B921BCC827AB7FC67',
  rootPage: '/session/signin',
  rootDomain: 'https://stg.confianza.pe',
  homePage: '/app/desktop',
  redirectUri: 'https://stg.confianza.pe/login',
  googleOAuthClientId: '690217690558-7l16jg0u9r7udt2jjp6tjmtd3mhkgihu.apps.googleusercontent.com',
  requestConfigRootURL: 'https://stg.confianza.pe/cores2/ant',
  devUser: ''
};
```

- [ ] **Paso 5: Medir y comparar**

```bash
rm -rf dist && npm run build
du -sh dist/stg-app-mis-r22
find dist -name "*.map" | wc -l      # debe ser 0
```
Esperado: reducción sustancial de tamaño y cero source maps.

- [ ] **Paso 6: Fijar presupuestos realistas**

Tomar el tamaño real de `initial` del paso 5 y fijar en `budgets`:
```json
{ "type": "initial", "maximumWarning": "<real>", "maximumError": "<real + 10%>" },
{ "type": "anyComponentStyle", "maximumWarning": "4kb", "maximumError": "16kb" }
```

- [ ] **Paso 7: Verificar el pipeline de despliegue**

Revisar con Infraestructura qué comando ejecuta el despliegue. Si usa `ng build --prod` (bandera eliminada en Angular 12+), corregir a `ng build --configuration production`.

- [ ] **Paso 8: Commit**

```bash
git add angular.json src/environments/environment.staging.ts
git commit -m "fix(build): produccion por defecto, configuracion staging y presupuestos reales"
```

---

## Tarea 0.3 — Corregir la acumulación de rutas autorizadas

Cierra [H-03](./02-analisis-refactorizacion.md#h-03). **Fallo de autorización.**

**Archivos:**
- Modificar: `src/app/system/admin/services/navigation.service.ts:100`
- Crear: `src/app/system/admin/services/navigation.service.spec.ts`

- [ ] **Paso 1: Escribir el test que falla**

```typescript
// src/app/system/admin/services/navigation.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation.service';
import { LocalStoreService } from 'app/core/data/local/local-store.service';
import { AuthService } from 'app/system/session/authentication/auth.service';

describe('NavigationService', () => {
  let service: NavigationService;

  const menuUsuarioA = [{ cod_sec: 'A1', cod_par: null, desc_sec: 'Presupuesto',
                          act_sec: '/app/presupuesto', order_sec: 1, menu_sec: 0 }];
  const menuUsuarioB = [{ cod_sec: 'B1', cod_par: null, desc_sec: 'Actividades',
                          act_sec: '/app/actividades', order_sec: 1, menu_sec: 0 }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: LocalStoreService, useValue: { getItem: () => null, setItem: () => true } },
        { provide: AuthService, useValue: { isLoged: false } }
      ]
    });
    service = TestBed.inject(NavigationService);
  });

  it('no debe conservar rutas del perfil anterior al cambiar de usuario', () => {
    service.initMenu(menuUsuarioA, false);
    expect(service.routesArray).toContain('/app/presupuesto');

    service.initMenu(menuUsuarioB, true);   // suplantacion
    expect(service.routesArray).toContain('/app/actividades');
    expect(service.routesArray).not.toContain('/app/presupuesto');  // ← falla hoy
  });
});
```

- [ ] **Paso 2: Ejecutar y verificar que falla**

Ejecutar: `npm test -- --include='**/navigation.service.spec.ts' --watch=false`
Esperado: FALLA — `/app/presupuesto` sigue presente tras cambiar de usuario.

- [ ] **Paso 3: Aplicar la corrección**

```typescript
// navigation.service.ts — al inicio de menu()
private menu(mr: any[]) {
    this.menuItemsBuffer = [];
    this.shortcutItemsBuffer = [];
    this.routesArray = [];        // ← AÑADIR
    ...
}
```

- [ ] **Paso 4: Ejecutar y verificar que pasa**

Ejecutar: `npm test -- --include='**/navigation.service.spec.ts' --watch=false`
Esperado: PASA.

- [ ] **Paso 5: Commit**

```bash
git add src/app/system/admin/services/
git commit -m "fix(navigation): limpiar routesArray en menu() para no acumular permisos entre perfiles"
```

---

## Tarea 0.4 — Corregir el import de environment en `CypherService`

Cierra [H-13](./02-analisis-refactorizacion.md#h-13). Prerequisito de la Fase 3.

**Archivos:** Modificar `src/app/core/shared/cypher.service.ts:3`

- [ ] **Paso 1: Corregir el import**

```typescript
// antes
import { environment } from 'environments/environment.prod';
// despues
import { environment } from 'environments/environment';
```

- [ ] **Paso 2: Buscar el mismo error en el resto del proyecto**

```bash
grep -rn "environments/environment.prod" src --include=*.ts
```
Esperado tras la corrección: ninguna coincidencia fuera de `angular.json`.

- [ ] **Paso 3: Verificar que compila y que el cifrado sigue funcionando**

```bash
npm run build
npm test -- --watch=false
```
Comprobar además, arrancando en dev, que el login funciona y `localStorage` se lee correctamente.

- [ ] **Paso 4: Commit**

```bash
git add src/app/core/shared/cypher.service.ts
git commit -m "fix(cypher): importar environment generico para respetar fileReplacements"
```

---

## Tarea 0.5 — Aplicar `RouteGuard` a todas las rutas de negocio

Complemento de [H-03](./02-analisis-refactorizacion.md#h-03).

**Archivos:** Modificar `src/app/app-routing.module.ts`

- [ ] **Paso 1: Inventariar la cobertura actual**

Listar las ~22 rutas hijas de `/app` y marcar cuáles tienen `canActivate: [RouteGuard]` (hoy: `presupuesto`, `actividades`) y cuáles lo tienen comentado.

- [ ] **Paso 2: Verificar que el menú del backend cubre cada ruta**

Para cada ruta, confirmar con backend/negocio que existe una entrada de menú (`act_sec`) equivalente. **Sin esto, activar el guard deja usuarios fuera de secciones legítimas.** Documentar el mapeo en una tabla dentro del PR.

- [ ] **Paso 3: Activar el guard ruta por ruta**

Descomentar `canActivate: [RouteGuard]` en cada ruta verificada. Dejar fuera únicamente `desktop` (destino de redirección) y las rutas sin equivalente en menú confirmado, con un comentario que explique el motivo.

- [ ] **Paso 4: Probar con perfiles reales**

Con al menos dos perfiles de distinto nivel (ej. asesor y administrador): navegar por menú a cada sección visible (debe entrar) e introducir a mano la URL de una sección no visible (debe redirigir a `homePage`).

- [ ] **Paso 5: Commit**

```bash
git add src/app/app-routing.module.ts
git commit -m "fix(routing): aplicar RouteGuard a las rutas de negocio verificadas"
```

---

### ✅ Criterio de salida de la Fase 0

- [ ] Los 3 tests nuevos pasan en verde
- [ ] `npm run build` produce bundle optimizado, sin source maps, con `environment.prod`
- [ ] Tamaño del bundle documentado y presupuestos ajustados a la realidad
- [ ] `RouteGuard` activo en las rutas de negocio verificadas
- [ ] Bug de `FormData` confirmado resuelto en staging con prueba manual

---

# Fase 1 — Higiene y red de seguridad

> **Duración:** 3–4 semanas · **Riesgo:** bajo · **Retorno:** habilita todo lo demás
>
> Sin esta fase, la Fase 2 es una apuesta. El objetivo no es cobertura alta: es **cobertura donde va a doler**.

## Tarea 1.1 — Migrar TSLint a ESLint con reglas de contención

Cierra parte de [H-18](./02-analisis-refactorizacion.md#h-18). Instala los guardarraíles que evitan que la deuda crezca durante la refactorización.

**Archivos:** Crear `.eslintrc.json` · Modificar `angular.json`, `package.json` · Eliminar `tslint.json`

- [ ] **Paso 1: Instalar y migrar**

```bash
ng add @angular-eslint/schematics
ng g @angular-eslint/schematics:convert-tslint-to-eslint
```

- [ ] **Paso 2: Establecer la línea base**

```bash
npx eslint "src/**/*.ts" --format stylish > doc/baseline-eslint.txt 2>&1 || true
npx eslint "src/**/*.ts" --format json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log('errores:',r.reduce((a,f)=>a+f.errorCount,0),'avisos:',r.reduce((a,f)=>a+f.warningCount,0))})"
```
Anotar el número. **No se corrige nada todavía.**

- [ ] **Paso 3: Añadir las reglas de contención como aviso**

En `.eslintrc.json`, dentro de `overrides` para `*.ts`:
```json
"rules": {
  "@typescript-eslint/no-explicit-any": "warn",
  "no-console": ["warn", { "allow": ["error"] }],
  "@typescript-eslint/no-unused-vars": "warn",
  "rxjs/no-ignored-subscription": "warn"
}
```

- [ ] **Paso 4: Añadir el script de contención**

En `package.json`:
```json
"lint": "ng lint",
"lint:nuevos": "eslint $(git diff --name-only origin/main...HEAD -- '*.ts' | tr '\\n' ' ') --max-warnings 0"
```
`lint:nuevos` solo evalúa archivos modificados en la rama. **Regla de equipo: ningún PR se fusiona si `lint:nuevos` falla.** Así la deuda existente no bloquea, pero la nueva no entra.

- [ ] **Paso 5: Commit**

```bash
git rm tslint.json
git add .eslintrc.json angular.json package.json doc/baseline-eslint.txt
git commit -m "chore(lint): migrar a ESLint con reglas de contencion sobre codigo nuevo"
```

---

## Tarea 1.2 — Resolver los 14 selectores duplicados

Cierra [H-12](./02-analisis-refactorizacion.md#h-12). **Bloqueante obligatorio de la Fase 2** — sin esto, consolidar módulos rompe la compilación.

**Archivos:** los 28 componentes listados en H-12 y sus plantillas

- [ ] **Paso 1: Generar el inventario exacto**

```bash
grep -rn "selector: *['\"]" src --include=*.ts | sed "s/\(.*\):.*selector: *['\"]\([^'\"]*\)['\"].*/\2\t\1/" | sort > doc/selectores.txt
```
Cruzar con la lista de H-12 para obtener las 28 rutas de archivo concretas.

- [ ] **Paso 2: Definir la convención de nombres**

`app-<dominio>-<pantalla>` — el dominio es el directorio bajo `modules/`. Ejemplos:
`app-incentivos3-principal`, `app-kaypacha2-buscador`, `app-reportes-e-usuarios`.

- [ ] **Paso 3: Renombrar un par y verificar**

Empezar por `app-principal-incentivos2` en `incentivos3/principal/principal.component.ts:6` → `app-incentivos3-principal`. Buscar usos de la etiqueta antigua en plantillas:
```bash
grep -rn "app-principal-incentivos2" src --include=*.html
```
Actualizar cada uso. Compilar: `npm run build`.

- [ ] **Paso 4: Repetir para los 13 pares restantes**

Un commit por dominio, no uno por componente. Tras cada dominio: `npm run build` y prueba manual de la pantalla afectada.

- [ ] **Paso 5: Verificar que no queda ninguno**

```bash
grep -rho "selector: *['\"][^'\"]*['\"]" src --include=*.ts | sort | uniq -d
```
Esperado: sin salida.

- [ ] **Paso 6: Añadir la regla que lo impide en el futuro**

En `.eslintrc.json`: `"@angular-eslint/component-selector": ["error", { "type": "element", "prefix": "app", "style": "kebab-case" }]`

---

## Tarea 1.3 — Tests de caracterización sobre la lógica de negocio crítica

Cierra parcialmente [H-15](./02-analisis-refactorizacion.md#h-15). **Es el prerequisito real de la Fase 2.**

Un test de caracterización no valida que el código sea correcto: **congela lo que hace hoy**, para que la refactorización no lo altere sin que nadie se entere.

**Prioridad de cobertura** (por riesgo de negocio × frecuencia de cambio):

1. Cálculo de incentivos — `incentivos3/compartido/servicios/incentivos3.service.ts` (584 líneas)
2. Utilidades de agregación de reportes — `gestion-comercial.util.ts` (543), `cero-cuotas.util.ts` (543)
3. Capa de transporte — `AntService`, `RESTPacket.computeURL()`, `Strand`
4. `NavigationService.menu()` — construcción del árbol y autorización
5. Formateo compartido — `functions.util.ts`, `DynamicFormatPipe`

- [ ] **Paso 1: Configurar cobertura y establecer la línea base**

```bash
npm test -- --code-coverage --watch=false
```
Anotar el porcentaje inicial en `doc/baseline-cobertura.txt`.

- [ ] **Paso 2: Capturar datos reales de entrada/salida**

Para cada una de las 5 áreas, capturar de staging (con datos anonimizados) un conjunto representativo de entradas y sus salidas actuales. Guardar como *fixtures* en `src/testing/fixtures/`.

> ⚠️ Los fixtures no deben contener datos personales reales de clientes ni empleados. Anonimizar nombres, DNI, correos y códigos de cliente antes de commitear.

- [ ] **Paso 3: Escribir el test de caracterización de `computeURL()`**

Se empieza por aquí porque no tiene dependencias y valida la frontera del protocolo:

```typescript
// src/app/core/data/remote/rest/rest-packet.class.spec.ts
import { RESTPacket } from './rest-packet.class';
import { environment } from 'environments/environment';

describe('RESTPacket.computeURL', () => {
  it('construye una URL sin parametros', () => {
    const p = new RESTPacket();
    p.baseRoute = 'v1/p';
    expect(p.computeURL()).toBe(`${environment.requestConfigRootURL}/v1/p`);
  });

  it('concatena parametros de ruta separados por &', () => {
    const p = new RESTPacket();
    p.baseRoute = 'v1/g';
    p.pushRouteParam('w', 'abc');
    p.pushRouteParam('x', 'def');
    expect(p.computeURL()).toBe(`${environment.requestConfigRootURL}/v1/g?w=abc&x=def`);
  });

  it('no añade ? cuando no hay parametros', () => {
    const p = new RESTPacket();
    p.baseRoute = 'v1/p';
    expect(p.computeURL()).not.toContain('?');
  });
});
```

- [ ] **Paso 4: Ejecutar y confirmar que pasan contra el código actual**

Ejecutar: `npm test -- --include='**/rest-packet.class.spec.ts' --watch=false`
Esperado: PASAN. Si alguno falla, **es un bug encontrado** — documentarlo antes de decidir si se corrige o se congela el comportamiento actual.

- [ ] **Paso 5: Repetir para las 4 áreas restantes**

Un commit por área. Meta de la fase: **≥60% de cobertura en las 5 áreas listadas** (no en el proyecto entero — eso llega solo con el tiempo).

- [ ] **Paso 6: Añadir umbral de cobertura al CI**

En `karma.conf.js`, `coverageReporter.check.global`: fijar el umbral al valor alcanzado. Solo puede subir.

---

## Tarea 1.4 — Introducir `LoggerService` y eliminar `console.log`

Cierra [H-17](./02-analisis-refactorizacion.md#h-17).

**Archivos:** Crear `src/app/core/shared/logger.service.ts` · Modificar `debug.util.ts` y 671 puntos de llamada

- [ ] **Paso 1: Crear el servicio**

```typescript
// src/app/core/shared/logger.service.ts
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

export enum NivelLog { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3 }

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly nivel = environment.production ? NivelLog.ERROR : NivelLog.DEBUG;

  debug(mensaje: string, ...datos: unknown[]): void { this.log(NivelLog.DEBUG, mensaje, datos); }
  info(mensaje: string, ...datos: unknown[]): void  { this.log(NivelLog.INFO,  mensaje, datos); }
  warn(mensaje: string, ...datos: unknown[]): void  { this.log(NivelLog.WARN,  mensaje, datos); }
  error(mensaje: string, ...datos: unknown[]): void { this.log(NivelLog.ERROR, mensaje, datos); }

  private log(nivel: NivelLog, mensaje: string, datos: unknown[]): void {
    if (nivel < this.nivel) { return; }
    const prefijo = `[${NivelLog[nivel]}]`;
    switch (nivel) {
      case NivelLog.ERROR: console.error(prefijo, mensaje, ...datos); break;
      case NivelLog.WARN:  console.warn(prefijo, mensaje, ...datos); break;
      default:             console.log(prefijo, mensaje, ...datos);
    }
  }
}
```

- [ ] **Paso 2: Redirigir `debug.util.ts` al servicio**

Reimplementar `printLog`/`printWarn`/`printError` sobre `LoggerService` para que los usos existentes se beneficien sin tocarlos.

- [ ] **Paso 3: Sustituir los `console.log` directos por módulo**

```bash
grep -rln "console\.log" src --include=*.ts | sed 's|src/app/modules/\([^/]*\)/.*|\1|' | sort | uniq -c | sort -rn
```
Un commit por módulo, empezando por los de menor volumen.

- [ ] **Paso 4: Elevar `no-console` a error**

En `.eslintrc.json`: `"no-console": ["error", { "allow": [] }]` (el servicio queda exento vía `overrides`).

- [ ] **Paso 5: Verificar el silencio en producción**

Build de producción, abrir la consola del navegador, recorrer 3 módulos. Esperado: sin salida salvo errores reales.

---

## Tarea 1.5 — Eliminar el código comentado

Cierra [H-22](./02-analisis-refactorizacion.md#h-22).

- [ ] **Paso 1: Clasificar los bloques comentados**

Recorrer los archivos con mayor densidad. Tres categorías:
- **Lógica desactivada** (`auth.guard.ts`, `TokenInterceptor.ts`, rutas con `canActivate` comentado) → **NO tocar aquí**: se decide en Fase 0.5 y Fase 3.
- **Código muerto** (imports comentados, alternativas descartadas, plantillas del CLI) → eliminar.
- **Decisiones documentadas** → convertir en comentario explicativo con fecha y motivo.

- [ ] **Paso 2: Eliminar el código muerto, un módulo por commit**

Antes de cada commit: `npm run build && npm test -- --watch=false`.

- [ ] **Paso 3: Convertir los 69 TODO/FIXME en tickets**

Cada uno se convierte en incidencia del gestor de tareas, y el comentario se sustituye por `// TODO(MIS-123): <resumen>` o se elimina si ya no aplica.

---

### ✅ Criterio de salida de la Fase 1

- [ ] ESLint activo; `lint:nuevos` bloqueando PRs con deuda nueva
- [ ] Cero selectores duplicados, verificado por comando
- [ ] ≥60% de cobertura en las 5 áreas críticas, con umbral fijado en CI
- [ ] Cero `console.log` directos; `no-console` en modo error
- [ ] Código muerto eliminado; TODOs convertidos en tickets
- [ ] `npm run build` y la suite completa en verde

---

# Fase 2 — Consolidar duplicados

> **Duración:** 6–8 semanas · **Riesgo:** medio-alto · **Retorno:** el mayor del plan
>
> Aquí se recupera el código. **No empezar sin haber cerrado la Fase 1** — especialmente los tests de caracterización y los selectores.

## Tarea 2.1 — Unificar `ModReportesEService` (prueba de concepto)

Cierra [H-07](./02-analisis-refactorizacion.md#h-07). Se hace primero por ser el caso más limpio: sirve para validar el procedimiento con riesgo casi nulo.

**Archivos:**
- Crear: `src/app/core/data/remote/instances/mod-reportes-e.service.ts`
- Eliminar: las 3 copias en `reportes-e/`, `ranking-k/`, `reasignacion-cart-cap/`
- Modificar: los 3 `*.module.ts` que las proveen

- [ ] **Paso 1: Diff de las tres copias**

```bash
diff src/app/modules/reportes-e/compartido/servicios/mod-reportes-e.service.ts \
     src/app/modules/ranking-k/compartido/servicios/mod-reportes-e.service.ts
diff src/app/modules/reportes-e/compartido/servicios/mod-reportes-e.service.ts \
     src/app/modules/reasignacion-cart-cap/compartido/servicios/mod-reportes-e.service.ts
```
Confirmar que la única divergencia real está en la copia de `reasignacion-cart-cap` (67 líneas frente a 42).

- [ ] **Paso 2: Crear la versión unificada**

En `core/data/remote/instances/mod-reportes-e.service.ts`, con la **unión** de métodos de las tres copias. Mantener nombre de clase `ModReportesEService`, `secret` y `appId` idénticos a los actuales.

- [ ] **Paso 3: Repuntar el primer módulo**

En `reportes-e.module.ts`, cambiar el import al servicio de `core/`. Eliminar la copia local. Compilar y probar la pantalla.

- [ ] **Paso 4: Repetir para `ranking-k` y `reasignacion-cart-cap`**

- [ ] **Paso 5: Verificar que no quedan copias**

```bash
find src -name "mod-reportes-e.service.ts"
```
Esperado: una sola ruta, bajo `core/`.

- [ ] **Paso 6: Commit**

```bash
git commit -m "refactor(core): unificar las 3 copias de ModReportesEService en core/data/remote/instances"
```

---

## Tarea 2.2 — Colapsar `stg-table4` sobre `stg-table2`

Cierra la mitad de [H-06](./02-analisis-refactorizacion.md#h-06).

**Archivos:** Eliminar `core/screen/components/stg-table4/` · Modificar `shared-cwc.module.ts` y los consumidores

- [ ] **Paso 1: Localizar los consumidores de `stg-table4`**

```bash
grep -rn "stg-table4\|StgTable4Component" src --include=*.html --include=*.ts
```

- [ ] **Paso 2: Confirmar la equivalencia de API**

Verificado en el análisis: `@Input`/`@Output` idénticos. La única diferencia funcional es que `stg-table2` añade ordenamiento con `MatSort`, controlado por el `@Input() enableSort` que **ambos ya exponen**.

- [ ] **Paso 3: Escribir el test de caracterización de `stg-table4`**

Antes de sustituir nada: test que renderiza `stg-table4` con un `dataSource` y `headers` de ejemplo y verifica filas, cabeceras y emisión de `onSelectRow`. Ese mismo test debe pasar después contra `stg-table2`.

- [ ] **Paso 4: Sustituir cada uso, una plantilla por commit**

`<app-stg-table4 ...>` → `<app-stg-table2 ... [enableSort]="0">`. El `enableSort="0"` explícito preserva el comportamiento actual (sin ordenamiento).

- [ ] **Paso 5: Eliminar el componente y su declaración**

Borrar el directorio `stg-table4/` y sus entradas en `shared-cwc.module.ts` (import, array `components`).

- [ ] **Paso 6: Verificar**

`npm run build` + prueba manual de cada pantalla que usaba `stg-table4`.

---

## Tarea 2.3 — Definir la tabla unificada sobre `stg-table3` ✅ CERRADA

Cierra el resto de [H-06](./02-analisis-refactorizacion.md#h-06). Trabajo de diseño, no solo de borrado.

**Justificación original:** `stg-table3` es la única de las cuatro con contrato tipado (`IStgTable3Header[]`, `StgTable3Options`) y la más compacta (254 líneas frente a 397/464). Es la base correcta.

> ⚠️ **Desviación documentada tras el inventario real (Paso 1):** el inventario de los 82
> consumidores reales mostró que `stg-table3` tenía **1 solo consumidor** (`demo-table3`, un
> demo) mientras que `stg-table2` ya era el estándar de facto con **60 consumidores** y el
> sistema de formato más rico (`DynamicFormatPipe`). Se extendió **`stg-table2`**, no
> `stg-table3` — misma clase de corrección que ya aplicó Tarea 2.2 sobre H-06. Detalle completo
> en `doc/04-componentes/stg-table.md`.

- [x] **Paso 1: Inventariar las capacidades de las tres tablas restantes** — 82 consumidores reales auditados con 5 agentes en paralelo.
- [x] **Paso 2: Diseñar la API de `StgTableComponent` unificada** — documentada en `doc/04-componentes/stg-table.md` antes de escribir código.
- [x] **Paso 3: Extender la base hasta cubrir el superconjunto** — TDD por capacidad: `onEditCell`, `actions`/`actionTrigger`, `loadingObs`, `resolveFormatType`, `globalStyle`, escape hatch `raw` del pipe. Ver `stg-table2.component.spec.ts`.
- [x] **Paso 4: Migrar consumidores por dominio** — los 22 archivos que usaban `stg-table` v1 migraron a `stg-table2`, un dominio por commit, verificados con `npm run build` + suite completa en cada uno.
- [x] **Paso 5: Eliminar `stg-table` (v1) y `stg-table3`** — confirmado con `grep` cero referencias. `demo-table3` (único consumidor de v3) se eliminó con acuerdo del usuario. `stg-table.util.ts` se conservó (utilidades genéricas sin relación con el componente).

---

## Tarea 2.4 — Unificar la familia `incentivos`

Cierra [H-08](./02-analisis-refactorizacion.md#h-08). **La tarea de mayor valor y mayor riesgo del plan.** 10.219 LOC en cuatro módulos.

> Requiere participación de negocio. No es una decisión técnica: hay que determinar qué diferencias entre generaciones son reglas de negocio vigentes y cuáles son residuos.

- [ ] **Paso 1: Auditoría funcional con negocio**

Para `incentivos2`, `incentivos3`, `incentivos4` e `incentivos-a`, responder por escrito:
- ¿Qué perfiles de usuario acceden a cada uno? (`incentivos2` no tiene ruta activa — ¿es código muerto?)
- ¿Qué modelo de campaña implementa cada uno?
- ¿Cuál es la fecha de retirada prevista?

Salida: `doc/incentivos-auditoria.md`. **Sin este documento la tarea no arranca.**

- [ ] **Paso 2: Tests de caracterización del cálculo**

Con fixtures reales anonimizados, congelar la salida del cálculo de incentivos de cada generación activa. Este es el activo que hace segura toda la tarea.

- [ ] **Paso 3: Eliminar `incentivos2` si se confirma muerto**

No está enrutado en `app-routing.module.ts`. Si la auditoría lo confirma: `grep` de referencias externas, eliminar, compilar, commit. **−2.433 LOC de un golpe.**

- [ ] **Paso 4: Modelar la campaña como configuración**

Diseñar `ConfiguracionCampania` tipada que capture las diferencias entre las generaciones vivas: fórmulas, indicadores, jerarquías, período. Precedente que ya existe en el código — `incentivos3.service.ts:91`:
```typescript
changeModel() { this.model = this.model == '2025' ? '2026' : '2025'; ... }
```

- [ ] **Paso 5: Construir el módulo `incentivos` unificado**

Un módulo, parametrizado por `ConfiguracionCampania`. Los tests de caracterización del paso 2 deben pasar sin modificarse.

- [ ] **Paso 6: Migrar ruta por ruta con bandera de activación**

`/app/incentivos3`, `/app/incentivos4` e `/app/incentivos-a` se redirigen al módulo unificado con su configuración. Mantener los módulos antiguos accesibles tras una bandera durante un ciclo de release completo.

- [ ] **Paso 7: Eliminar los módulos antiguos**

Tras un ciclo sin incidencias.

---

## Tarea 2.5 — Aplicar el mismo procedimiento a `Kaypacha`

`kaypacha` (1.463) + `Kaypacha2` (1.029) + `Kaypacha3` (616) = **3.108 LOC**, con rutas `/app/kaypacha`, `/app/Kaypacha_` y `/app/Kaypacha__` (nombres que ya delatan el problema).

Mismo procedimiento que 2.4: auditoría → caracterización → unificación → migración → eliminación. Menor escala y menor riesgo; buena candidata para ejecutarse en paralelo por otra persona.

- [ ] Auditoría funcional con negocio
- [ ] Tests de caracterización
- [ ] Módulo `kaypacha` unificado y parametrizado
- [ ] Rutas migradas a nombres legibles (`/app/kaypacha/desempenio`, `/app/kaypacha/ranking`)
- [ ] Módulos antiguos eliminados

---

## Tarea 2.6 — Consolidar NgModules y migrar a `standalone`

Cierra [H-16](./02-analisis-refactorizacion.md#h-16). **Requiere la Tarea 1.2 cerrada.**

- [ ] **Paso 1: Inventariar los 339 NgModules** y clasificar: de routing / de un solo componente / agrupadores reales
- [ ] **Paso 2: Fusionar los módulos de un solo componente** en el módulo de su dominio
- [ ] **Paso 3: Migrar los componentes hoja a `standalone: true`**, empezando por la librería `stg-*`
- [ ] **Paso 4: Simplificar los routing modules desproporcionados** (`rda-administracion-routing.module.ts`, 726 líneas)
- [ ] **Paso 5: Medir** — objetivo: menos NgModules que componentes

---

### ✅ Criterio de salida de la Fase 2

- [ ] Una sola familia de tabla; `stg-table`, `2` y `4` eliminados
- [ ] `ModReportesEService` unificado en `core/`
- [ ] Un solo módulo `incentivos` y un solo `kaypacha`
- [ ] Reducción de LOC documentada (objetivo: **−12.000 a −15.000**)
- [ ] Cobertura sin retroceder respecto a la Fase 1
- [ ] Sin regresiones funcionales reportadas tras un ciclo de release

---

# Fase 3 — Seguridad y modernización

> **Duración:** 6–8 semanas · **Riesgo:** alto (coordinación con backend) · **Prerequisito:** Fases 0 y 1
>
> Se detalla al llegar. Objetivos y criterios de aceptación:

## 3.1 — Gestión de secretos ([H-04](./02-analisis-refactorizacion.md#h-04))

> ⚠️ **Requiere decisión conjunta con el equipo de backend y con Seguridad de la información. No es una tarea que el equipo de frontend pueda cerrar por su cuenta.**

- [ ] Determinar qué garantiza realmente el `secret` de Winder: ¿autenticación o solo ofuscación del transporte?
- [ ] Si autentica → **rotar las 7 claves** y trasladar el cifrado al servidor
- [ ] Si ofusca → documentarlo por escrito y basar la autorización exclusivamente en el token OAuth
- [ ] Consolidar los 7 secretos en un único punto de configuración inyectado en build
- [ ] Sustituir el IV fijo en cero por IV aleatorio por mensaje (`cypher.service.ts:28`)
- [ ] Evaluar si el historial del repositorio requiere tratamiento (claves comprometidas)

**Aceptación:** cero secretos en `src/`, verificado por escáner en CI.

## 3.2 — Restablecer la validación de sesión ([H-05](./02-analisis-refactorizacion.md#h-05))

- [ ] Averiguar con backend cómo autentica hoy, y por qué se retiró la cabecera `Authorization`
- [ ] Reescribir `AuthService.isLoged` para validar `exp` del token, no la presencia de una clave
- [ ] Reactivar la validación de expiración en `AuthGuard`
- [ ] Reactivar la inyección de `Authorization` en `TokenInterceptor`
- [ ] Implementar renovación silenciosa y diálogo de fin de sesión

**Aceptación:** un token expirado provoca cierre de sesión; ninguna petición a Winder viaja sin credencial.

## 3.3 — Retirar dependencias en fin de vida ([H-18](./02-analisis-refactorizacion.md#h-18))

Orden obligatorio (cada paso habilita el siguiente):

- [ ] Verificar y eliminar `rxjs-compat`; migrar a RxJS 7
- [ ] Sustituir `@angular/flex-layout` por CSS Grid/Flexbox nativo
- [ ] Sustituir Protractor por Playwright; escribir E2E de los 5 flujos críticos
- [ ] Angular 14 → 15 → 16 → 17, un salto por PR con regresión completa entre saltos
- [ ] Migrar OAuth Implicit Flow a Authorization Code + PKCE

**Aceptación:** `npm outdated` sin paquetes en fin de vida; build en verde en Angular 17.

## 3.4 — Consolidar librerías redundantes ([H-19](./02-analisis-refactorizacion.md#h-19))

- [ ] Elegir una librería de gráficos (verificar antes la licencia de Highcharts) y eliminar la otra
- [ ] Elegir un proveedor de mapas y eliminar el otro
- [ ] Sustituir `lodash.clonedeep`/`lodash.merge` por `structuredClone` nativo

**Aceptación:** reducción de tamaño de bundle documentada.

---

# Fase 4 — Rendimiento y gestión de estado

> **Duración:** 4–6 semanas · **Prerequisito:** Fase 2
>
> **Orden obligatorio: 4.1 antes que 4.3.** `OnPush` sobre estado mutable produce bugs de renderizado sutiles e intermitentes.

## 4.1 — Convertir los servicios de dominio en stores tipados ([H-14](./02-analisis-refactorizacion.md#h-14))

- [ ] Definir la interfaz de estado tipada de cada dominio (empezando por `incentivos`, ya unificado en Fase 2)
- [ ] Sustituir los campos públicos `any` por `BehaviorSubject<EstadoTipado>` con selectores de solo lectura
- [ ] Convertir las mutaciones directas de los componentes en métodos del store con actualización inmutable
- [ ] Consumir el estado en plantillas con `async` pipe

**Aceptación:** ningún componente muta directamente el estado de un servicio.

## 4.2 — Cerrar las fugas de suscripción ([H-11](./02-analisis-refactorizacion.md#h-11))

- [ ] Auditar las 671 llamadas a `.subscribe(`
- [ ] Sustituir por `async` pipe donde la plantilla lo permita
- [ ] Aplicar `takeUntilDestroyed()` al resto
- [ ] Corregir el patrón manual de `incentivos3.service.ts:97-118`
- [ ] Elevar `rxjs/no-ignored-subscription` a error

**Aceptación:** navegación repetida entre 10 pantallas sin crecimiento sostenido de memoria en el perfilador.

## 4.3 — Activar `OnPush` ([H-20](./02-analisis-refactorizacion.md#h-20))

- [ ] Activar en la librería `stg-*` primero
- [ ] Extender por dominio, con verificación visual de cada pantalla
- [ ] Medir el rendimiento de renderizado en la tabla de mayor volumen, antes y después

**Aceptación:** `OnPush` en >80% de los componentes; mejora medida y documentada.

---

# Fase 5 — Motor dinámico

> **Duración:** 8–12 semanas · **Prerequisito:** Fases 2 y 4
>
> **Este es el objetivo final: que añadir una pantalla deje de requerir un despliegue.**

## 5.1 — Tipar el motor de configuración ([H-24](./02-analisis-refactorizacion.md#h-24))

- [ ] Definir `ScreenConfig`, `TableConfig`, `FilterConfig`, `ChartConfig` tipadas
- [ ] Migrar los `*.util.ts` existentes a las interfaces (11 `principal.util.ts` + 4 `detalle.util.ts` primero)
- [ ] Construir un `ScreenRendererComponent` que renderice una `ScreenConfig` completa
- [ ] Validar la configuración contra esquema al cargar, con error explícito si no cumple
- [ ] Migrar 3 sub-reportes de `repositorio/` al renderizador como prueba

**Aceptación:** un sub-reporte nuevo se crea escribiendo solo configuración tipada, sin componente propio.

## 5.2 — Rutas generadas desde el menú ([H-23](./02-analisis-refactorizacion.md#h-23))

- [ ] Crear `MODULE_REGISTRY`: clave lógica → cargador perezoso
- [ ] Extender el contrato del menú del backend para incluir la clave de módulo
- [ ] Generar la configuración de rutas tras el login con `router.resetConfig()`
- [ ] Reemplazar el array estático de `app-routing.module.ts` por el registro
- [ ] Retirar `RouteGuard`: una ruta no autorizada deja de existir para ese usuario
- [ ] Gestionar 404 y estados de carga de módulos

**Aceptación:** publicar una sección nueva para un perfil se hace con un cambio de configuración en backend, sin desplegar frontend.

## 5.3 — Configuración servida por el backend

- [ ] Endpoint de Winder que sirve `ScreenConfig` versionada
- [ ] Caché en cliente con invalidación por versión
- [ ] Respaldo a la configuración empaquetada si el endpoint no responde
- [ ] Herramienta de previsualización para que negocio valide antes de publicar

**Aceptación:** cambiar columnas de un reporte no requiere despliegue de frontend.

---

# Fase X — Retirada de `legacy` (paralela)

> Cierra [H-09](./02-analisis-refactorizacion.md#h-09). **27.013 LOC — 22% del proyecto.**
>
> Se ejecuta en paralelo desde la Fase 1 porque no bloquea a nadie y es el mayor bloque de valor recuperable.

- [ ] **Instrumentar el uso real.** Añadir telemetría de navegación a las rutas de `reportes/legacy` y **recolectar durante 4–8 semanas**. Sin datos de uso, la eliminación es adivinación.
- [ ] Clasificar los 47 sub-reportes: en uso / sin uso / duplicado en `repositorio/`
- [ ] Eliminar los sin uso, uno por commit, con confirmación de negocio por escrito
- [ ] Migrar los que estén en uso a `repositorio/` o al motor de la Fase 5
- [ ] Descomponer `cra-map.ts` (3.088 líneas) si sobrevive a la clasificación
- [ ] Eliminar el directorio `legacy/` completo

**Aceptación:** `modules/reportes/legacy/` no existe.

---

# Seguimiento

## Indicadores

Medir al cierre de cada fase y registrar en `doc/metricas.md`:

| Indicador | Hoy | Meta Fase 2 | Meta Fase 5 |
|---|---|---|---|
| LOC totales | 122.000 | 108.000 | 85.000 |
| NgModules | 339 | 200 | <100 |
| Ocurrencias de `: any` | 3.014 | 2.400 | <500 |
| Archivos `.spec.ts` | 28 | 120 | 250 |
| Cobertura en áreas críticas | ~0% | 60% | 80% |
| Componentes `OnPush` | 1 | 1 | >240 |
| Componentes `standalone` | 0 | 80 | 250 |
| `console.log` directos | 671 | 0 | 0 |
| Secretos en `src/` | 8 | 8 | **0** |
| Tamaño bundle inicial | *(medir en 0.2)* | −20% | −40% |

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Refactorización rompe cálculos de incentivos | **Alto** — impacto salarial en la fuerza de ventas | Tests de caracterización obligatorios (1.3) antes de tocar; validación con negocio de resultados antes y después |
| `legacy` contiene reportes en uso no documentados | Alto | Telemetría 4–8 semanas antes de eliminar nada |
| La rotación de secretos requiere despliegue coordinado | Alto | Planificar con backend en ventana de mantenimiento; soporte temporal de clave antigua y nueva |
| Consolidar módulos rompe la compilación por selectores | Medio | Tarea 1.2 es bloqueante estricto de la Fase 2 |
| El equipo sigue copiando durante la refactorización | Medio | `lint:nuevos` en CI + revisión obligatoria de PR + acuerdo explícito de equipo |
| Salto de 4 versiones de Angular introduce regresiones | Medio | Un salto por PR, E2E de flujos críticos entre saltos |

## Recomendación de secuencia

**Ahora (esta semana):** Fase 0 completa. Son cinco correcciones pequeñas que resuelven un bug de producción, un despliegue roto y un fallo de autorización.

**Siguiente mes:** Fase 1 + arrancar la telemetría de la Fase X en paralelo (necesita 4–8 semanas de recolección, cuanto antes empiece mejor).

**Trimestre siguiente:** Fase 2, empezando por 2.1 como prueba de concepto de bajo riesgo.

**Después:** Fases 3 y 4 pueden solaparse parcialmente. La Fase 5 solo tiene sentido con las anteriores cerradas — construir un motor dinámico sobre estado mutable y tipos `any` reproduciría el problema en una capa más alta.

---

## Nota sobre este plan

Las Fases 0, 1 y 2 están detalladas a nivel de paso ejecutable porque son accionables con la información disponible hoy. Las Fases 3, 4 y 5 definen objetivo, alcance y criterio de aceptación, pero **deben re-planificarse en detalle al llegar a ellas**: dependen de decisiones que aún no se han tomado (respuesta de backend sobre los secretos, resultado de la telemetría de `legacy`, auditoría funcional de incentivos con negocio).

Un plan que finge conocer hoy el detalle de un trabajo a seis meses es un plan que se abandona en la semana tres.
