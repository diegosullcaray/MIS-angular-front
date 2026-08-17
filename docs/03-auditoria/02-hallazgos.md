# Hallazgos

21 hallazgos ordenados por severidad. Cada uno indica la evidencia con la que se verificó, el
impacto real y la corrección propuesta. Todo lo marcado como *verificado* se comprobó
ejecutando el build o las pruebas, no leyendo el código.

---

## Críticos

### C-1 · Suplantación de identidad en el build de producción

> **CORREGIDO el 15/08/2026.** Ver [«Corrección aplicada»](#corrección-aplicada-c-1) al final
> de este hallazgo. Se conserva la descripción original porque explica el mecanismo del fallo,
> que es lo que evita repetirlo.

**Evidencia (verificada).** `angular.json` no contiene ninguna entrada `fileReplacements`. La
configuración `production` solo define `budgets` y `outputHashing`. Como consecuencia,
`src/environments/environment.prod.ts` **no lo importa nadie** y el build de producción
—que es el predeterminado, por `"defaultConfiguration": "production"`— empaqueta
`environment.ts`.

Extraído del bundle compilado en `dist/mis-host/browser/chunk-CLzhstK8.js`:

```js
production:!1,structure:`corredor`,devTracing:!1,devAd:!1,
ipProvider:`http://api.ipify.org/?format=json`,
cypherSecret:`85A99A2F37313C…`,
…,devUser:`oscar.sanchez@confianza.pe`
```

`production:!1` es `production: false` tras la minificación.

**Impacto.** En [`auth.service.ts:55`](../../src/app/pages/full-pages/auth/service/auth.service.ts#L55):

```ts
const email = !environment.production && environment.devUser ? environment.devUser : claims['email'];
```

En producción esto evalúa `!false && 'oscar.sanchez@confianza.pe'`, que es verdadero. **Todo
usuario que inicia sesión con Google se autentica ante el backend Ant como
oscar.sanchez@confianza.pe**, y hereda su rol, su `cod_bt`, su jerarquía organizativa, su menú
y sus datos. En un sistema de información de una entidad financiera esto significa: cero
trazabilidad de quién consultó qué, y escalada de privilegios para cualquiera que tenga una
cuenta de Google del dominio.

Dos efectos secundarios del mismo origen: `redirectUri` queda en
`http://localhost:4200/login`, lo que rompe el retorno de OAuth en producción, y `rootDomain`
apunta también a localhost.

**Agravante.** La prueba [`auth.service.spec.ts:114`](../../src/app/pages/full-pages/auth/service/auth.service.spec.ts#L114)
afirma `expect(environment.production).toBe(false)`, de modo que el comportamiento defectuoso
está fijado por una prueba en verde.

**Corrección.**

1. Añadir a la configuración `production` de `angular.json`:
   ```json
   "fileReplacements": [{
     "replace": "src/environments/environment.ts",
     "with": "src/environments/environment.prod.ts"
   }]
   ```
2. Antes de activarlo, alinear los dos archivos de entorno: `environment.prod.ts` no tiene
   `structure` ni `externalLinks.helpdesk`, y `redirect-overlay.service.ts` sí usa
   `externalLinks`. Ver hallazgo M-6.
3. Eliminar el atajo `devUser` del código de producción. Lo correcto es que la sustitución de
   identidad viva únicamente en el archivo de entorno de desarrollo y que
   `auth.service.ts` no tenga ninguna rama condicional sobre `environment.production`.
4. Añadir una prueba que falle si `environment.production !== true` en un build de producción,
   y corregir la aserción actual del spec.

#### Corrección aplicada (C-1)

Se aplicó defensa en tres capas, porque cualquiera de ellas por separado puede fallar.

**Capa 1 — el archivo correcto.** `angular.json` ya declara `fileReplacements` en la
configuración `production`. `src/environments/environment.model.ts` define la interfaz
`Environment` que tipa ambos archivos, de modo que no pueden volver a divergir sin que el
compilador lo note. `environment.prod.ts` ya no declara `devUser` en absoluto: la clave es
opcional en el contrato, y solo existe en desarrollo.

**Capa 2 — el guardián correcto.** `auth.service.ts` sustituyó
`!environment.production && environment.devUser` por el método `emailDePrueba()`, protegido
por `isDevMode()`. La diferencia es la que importa: `environment.production` es un *dato*
leído del archivo de entorno, y si el archivo es el equivocado el dato también lo es;
`isDevMode()` es una *condición de compilación*. Verificado sobre el bundle: en producción
Angular la compila literalmente como `function d0(){return!1}`, así que la expresión queda en
`return false && (…) || null` y la rama es inalcanzable.

**Capa 3 — la verificación automática.** `scripts/verificar-bundle.mjs`, expuesto como
`npm run verify:bundle` y encadenado en `npm run build:prod`, recorre los JS de `dist/` y
falla el build si encuentra un correo de prueba o una URL de localhost. Está en Node y no en
`grep` para que funcione igual en Windows y en CI.

**Verificación del resultado.** Build de producción limpio: `production:!0`,
`redirectUri: https://stg.confianza.pe/login`, y cero coincidencias de correos de desarrollo o
`localhost`. Build de desarrollo intacto: `devUser` presente y operativo.

**La capacidad de desarrollo se conserva**, y mejora: ya no hay que descomentar líneas en
`environment.ts` —el flujo que causó la fuga—, sino que se cambia de perfil desde la consola
del navegador, sin tocar archivos que se puedan commitear por accidente:

```js
localStorage.setItem('mis.devUser', 'flor.garcia@confianza.pe'); location.reload();
localStorage.removeItem('mis.devUser'); location.reload();  // vuelve a la cuenta real
```

**Pruebas.** Se corrigió la aserción de `auth.service.spec.ts` para que compruebe el
comportamiento en lugar del valor de `environment.production`, y se añadieron dos pruebas: una
que exige que la configuración de producción no declare `devUser` ni un `redirectUri` con
localhost, y otra que verifica la prioridad de `localStorage` sobre el valor por defecto.

---

### C-2 · Las claves AES viajan dentro del bundle público

**Evidencia (verificada).** El bundle de producción contiene las ocho claves hexadecimales:
`cypherSecret` más los siete `moduleSecrets` (`session`, `app`, `sis`, `admin`, `secciones`,
`reporting`, `rep2`). Se localizan abriendo las herramientas de desarrollo del navegador.
Además están en el historial de Git desde el commit `ec4aec3`.

**Impacto.** El cifrado del protocolo Winder es **ofuscación, no seguridad**: la clave que lo
protege se entrega al atacante junto con el código. Cualquiera puede construir peticiones
válidas contra cualquiera de los nueve puertos del backend Ant, incluido el 6301 (`admin`).

Esto no se arregla escondiendo mejor la clave —en una aplicación de navegador es imposible—
sino cambiando el modelo de confianza: **el backend no debe conceder autorización a cambio de
conocer un secreto de módulo**.

**Corrección.**

1. Asumir que el canal Winder es público. La confidencialidad la aporta TLS, no el AES del
   cliente.
2. El backend debe autorizar cada petición con un token de sesión emitido y verificado en
   servidor, comprobando que el `email` del `Strand` coincide con el de la sesión. Esto también
   cierra C-1 y C-4.
3. Rotar las claves actuales, ya que están en el historial público del repositorio.
4. Sacar los secretos de los archivos de entorno versionados.

---

### C-3 · AES-128-CBC con vector de inicialización fijo en cero y sin autenticación

**Evidencia.** [`cypher.service.ts`](../../src/app/core/services/cypher.service.ts):

```ts
const iv = new Uint8Array(16); // todo ceros
```

**Impacto.** Tres problemas independientes:

- **IV constante.** El cifrado se vuelve determinista: el mismo texto claro produce siempre el
  mismo texto cifrado. Un observador puede reconocer peticiones repetidas, construir un
  diccionario de valores conocidos y reproducir peticiones anteriores.
- **Sin autenticación.** CBC sin MAC es maleable: se puede alterar el texto cifrado y provocar
  cambios controlados en el descifrado. Si el backend distingue entre error de relleno y error
  de negocio, queda expuesto a un ataque de oráculo de relleno.
- **Implementación propia.** 302 líneas de AES escritas a mano. `gmul()` usa ramificación
  dependiente de los datos, es decir, no es de tiempo constante. Además es síncrona y bloquea
  el hilo principal en cada petición.

El comentario del archivo explica que la implementación en JavaScript existe porque
`WinderService` construye la URL de forma síncrona y `SubtleCrypto` es asíncrona. Es una
justificación válida para la restricción actual, pero la restricción misma es la que conviene
eliminar.

**Corrección.**

- *Inmediata, si el backend puede acompañar el cambio:* IV aleatorio por mensaje, transmitido
  como prefijo del texto cifrado, y migración a AES-GCM mediante `SubtleCrypto`. Requiere que
  `winderConfig()` pase a ser asíncrona, lo que se resuelve haciendo que `prepare()` devuelva
  una promesa o encadenando con `from()`.
- *De fondo:* retirar el cifrado del cliente. Con TLS y un token de sesión verificado en
  servidor, este cifrado no aporta ninguna garantía que no exista ya.

---

### C-4 · La autorización vive solo en el cliente, y el token puede ser un valor de relleno

**Evidencia.** En [`auth.service.ts`](../../src/app/pages/full-pages/auth/service/auth.service.ts):

```ts
const sessionToken = lr.sid || lr.token || 'winder-session-token';
```

En [`auth.guard.ts`](../../src/app/core/guards/auth.guard.ts):

```ts
if (shell.usuarioActivo() !== null) return true;
```

**Impacto.**

- Si el backend no devuelve `sid` ni `token`, la aplicación considera la sesión válida usando
  una cadena constante inventada. Un fallo del backend se convierte en una sesión aparentemente
  legítima en lugar de un error de autenticación.
- `authGuard` solo comprueba que exista un usuario en memoria, restaurado desde
  `sessionStorage`. Editando esa clave en las herramientas de desarrollo se entra al cascarón.
- `role.guard` deriva el rol de `profile.tip_use === 0 ? 'admin-sistema' : 'supervisor-area'`:
  dos roles para toda la aplicación, decididos por un único campo numérico y evaluados en el
  navegador.

Los guards de Angular son experiencia de usuario, no seguridad. Está bien que existan; el
problema es que no hay una segunda barrera en el servidor.

**Corrección.**

1. Sustituir el valor de relleno por un fallo explícito: si el backend no emite token, la
   autenticación no se completa.
2. El backend debe validar el token en cada petición Winder y resolver la autorización él mismo,
   sin confiar en el `email` que llega en el `Strand`.
3. Considerar el modelo de roles: dos niveles derivados de `tip_use` se quedarán cortos en
   cuanto haya un tercer perfil operativo.

---

## Altos

### A-1 · TypeScript sin modo estricto

`tsconfig.json` activa `noImplicitOverride`, `noImplicitReturns`,
`noPropertyAccessFromIndexSignature` y `noFallthroughCasesInSwitch`, pero **no** `strict`, y
`angularCompilerOptions` **no** incluye `strictTemplates`.

Sobre 35 583 líneas y 106 plantillas, esto significa que `null` y `undefined` no se verifican
en ningún punto, y que los errores de tipo dentro de las plantillas son invisibles para el
compilador. Es la causa raíz de buena parte de la fragilidad en tiempo de ejecución.

**Corrección.** Activar por etapas: primero `strict: true` con `strictNullChecks` y corregir
la cascada de errores; después `strictTemplates`. Conviene hacerlo módulo por módulo, no de
golpe.

### A-2 · No hay linter

No existe `eslint.config.js` ni `.eslintrc`, y no hay ninguna dependencia de ESLint. No hay
reglas de Angular (`@angular-eslint`), ni detección de promesas sin gestionar, ni de variables
sin usar, ni de importaciones circulares.

**Corrección.** `ng add @angular-eslint/schematics`, y activar al menos
`@typescript-eslint/no-floating-promises`, `no-unused-vars` y las reglas recomendadas de
Angular.

### A-3 · No hay integración continua

No existe el directorio `.github/`. Nada verifica el build, las pruebas ni el formato antes de
integrar cambios en `main`.

**Corrección.** Un flujo de trabajo que ejecute `npm ci`, `ng build --configuration production`,
`ng test`, `ng lint` y `playwright test` en cada *pull request*, con protección de rama.

### A-4 · Hay 22 pruebas fallando y el comando termina con código 0

**Evidencia (verificada).** `ng test --watch=false` reporta `22 failed | 991 passed (1013)`,
`6 failed | 165 passed (171)` archivos — y **sale con código de salida 0**.

Archivos afectados:

| Archivo | Pruebas rojas |
|---|---|
| `incentivos/ui/detalle-variable-content/…spec.ts` | 8 |
| `herramientas/components/herramientas-home/…spec.ts` | 6 |
| `layout/components/sidebar/…spec.ts` | 3 |
| `shared/ui/data-table/…spec.ts` | 3 |
| `incentivos/ui/avances-grid/…spec.ts` | 1 |
| `core/services/message.service.spec.ts` | 1 |

**Impacto.** El código de salida 0 es lo más grave: cuando se añada CI (hallazgo A-3), el
pipeline pasará en verde con las pruebas rojas. La suite deja de ser una red de seguridad.

**Corrección.** Verificar la propagación del código de salida del constructor
`@angular/build:unit-test` y, si no lo propaga, invocar Vitest directamente en CI. Después,
arreglar las 22 pruebas: la de `detalle-variable-content` (`expected '0.5' to be '50%'`)
apunta a un cambio real en `formatearCelda()` que la prueba nunca reflejó.

### A-5 · Sin política de seguridad de contenido

`src/index.html` no declara ninguna `Content-Security-Policy`, y no hay evidencia de cabeceras
de seguridad configuradas (`X-Frame-Options`, `Referrer-Policy`,
`Strict-Transport-Security`).

Con la sesión guardada en `sessionStorage`, cualquier XSS equivale al robo completo de la
sesión. El riesgo es hoy bajo porque no se encontró ningún uso de `innerHTML` ni de
`bypassSecurityTrust` en el código de la aplicación —solo en `main.ts`, con una cadena
literal, y en un archivo de pruebas—, pero la aplicación embebe informes de Power BI mediante
iframes, lo que amplía la superficie.

**Corrección.** Definir una CSP en el servidor que sirve la aplicación, con `frame-src`
limitado a los dominios de Power BI y `connect-src` limitado a `stg.confianza.pe` y
`accounts.google.com`. Añadir las cabeceras de seguridad habituales en el mismo punto.

### A-6 · OAuth con flujo implícito

`google-auth.config.ts` usa `oauthService.initImplicitFlow()`. El flujo implícito está
desaconsejado desde OAuth 2.0 Security BCP: devuelve el token en el fragmento de la URL, donde
queda expuesto al historial del navegador y a los *referrers*. Además,
`strictDiscoveryDocumentValidation: false` desactiva una validación de seguridad.

**Corrección.** Migrar a *code flow* con PKCE (`initCodeFlow()`), que `angular-oauth2-oidc`
soporta de forma nativa, y volver a activar la validación estricta del documento de
descubrimiento.

---

## Medios

### M-1 · `WinderService` es un singleton con estado mutable de petición

[`winder.service.ts`](../../src/app/core/winder/winder/winder.service.ts) está declarado
`providedIn: 'root'` y guarda `strands`, `formData`, `options` y `config` como campos de
instancia. `prepare()` los escribe y `.get()` los lee.

Hoy funciona porque `AntService` siempre encadena de forma síncrona
(`prepare(...).get()`), sin ceder el control entre ambas llamadas. Pero es una mina: en cuanto
alguien escriba `const w = winder.prepare(...); await algo; w.get();`, o se añada cualquier
paso asíncrono —por ejemplo el AES-GCM del hallazgo C-3—, dos peticiones concurrentes
mezclarán su configuración y una saldrá con el puerto y el secreto de otro módulo.

**Corrección.** Que `prepare()` devuelva un objeto nuevo e inmutable con su propio estado, en
lugar de `this`. Es un cambio contenido y elimina la clase entera de problema.

### M-2 · Ningún componente usa OnPush

**Verificado:** 0 de 107 componentes declaran `ChangeDetectionStrategy.OnPush`.

En modo zoneless las señales disparan la detección de cambios, pero los componentes con
estrategia `Default` se revisan igualmente en cada ciclo, se hayan ensuciado o no. Con 107
componentes y tablas de datos densas, el coste es real y crece con cada módulo migrado.

**Corrección.** Añadir `changeDetection: ChangeDetectionStrategy.OnPush` como predeterminado
en los esquemas de `angular.json` y aplicarlo progresivamente. Dado que el estado ya se maneja
con señales, la mayoría de componentes debería funcionar sin cambios.

### M-3 · El overlay de carga se activa en toda petición sin excepción

[`loading.interceptor.ts`](../../src/app/core/interceptors/loading.interceptor.ts) llama a
`loading.show()` en cada petición, sin lista de exclusión ni posibilidad de exclusión por
petición. Cualquier llamada de fondo —refresco de menú, sondeo, precarga— enciende el overlay
global y bloquea visualmente la interfaz.

**Corrección.** Añadir un `HttpContextToken` que permita marcar peticiones silenciosas, e
integrarlo en los helpers de `AntService`.

### M-4 · El menú no reintenta si la primera carga falla

En [`menu-stg.service.ts`](../../src/app/pages/full-pages/layout/services/menu-stg.service.ts):

```ts
cargar(email: string): void {
  if (this.emailCargado === email) return;
  this.emailCargado = email;          // ← se marca antes de saber si funcionó
  this.modSysAdminService.getMenuItems(email).subscribe({ … });
}
```

Si `list_sec` falla, `emailCargado` ya quedó fijado y el error solo se registra en consola. El
usuario se queda sin menú lateral hasta que recargue la página entera.

**Corrección.** Marcar `emailCargado` en el `next`, limpiarlo en el `error`, y mostrar un
estado de error recuperable en el sidebar en lugar de un `console.error`.

### M-5 · El bundle inicial supera el presupuesto

**Verificado:** 595,73 kB sin comprimir (110,22 kB transferidos) frente a un límite de 500 kB.
El build avisa pero no falla, porque `maximumError` está en 1 MB.

El fragmento inicial arrastra PrimeNG, el tema y el cascarón completo. Power BI (234 kB) sí
está correctamente diferido.

**Corrección.** Analizar el fragmento inicial con `--stats-json` y un visor de bundles. Los
candidatos habituales son importaciones de PrimeNG que podrían diferirse junto al primer
módulo que las usa, y `chart.js`, que solo hace falta en las pantallas con gráficos.

### M-6 · Los dos archivos de entorno han divergido y no comparten tipo

> **CORREGIDO el 15/08/2026** junto con C-1. `src/environments/environment.model.ts` define la
> interfaz `Environment` y ambos archivos la implementan. Se añadió `externalLinks.helpdesk` a
> producción y se eliminaron las nueve claves muertas: `structure`, `devTracing`, `devAd`,
> `rootPage`, `homePage`, `rootDomain`, `ipProvider`, `moduleSecrets.sis` y
> `moduleSecrets.rep2`.

`environment.ts` tiene `structure` y `externalLinks.helpdesk`; `environment.prod.ts` no tiene
ninguno de los dos. Como no hay una interfaz común, TypeScript no detecta la divergencia.

Esto es un bloqueante para corregir C-1: activar `fileReplacements` sin alinear antes los dos
archivos rompería `redirect-overlay.service.ts`, que lee `externalLinks`.

**Verificado además**, estas claves no se usan en ningún punto de `src/`: `structure`,
`devTracing`, `devAd`, `rootPage`, `homePage`, `rootDomain`, `ipProvider`, y el secreto
`rep2`.

**Corrección.** Declarar `export interface Environment { … }` y tipar ambos archivos con ella.
Eliminar las ocho claves muertas.

### M-7 · Sesión de 15 minutos sin renovación ni aviso

`DURACION_SESION_MS = 15 * 60 * 1000`, con un `setTimeout` que cierra la sesión al cumplirse.
No se renueva por actividad del usuario ni hay aviso previo. Alguien que esté rellenando un
formulario largo pierde el trabajo sin previo aviso.

**Corrección.** Renovar la caducidad ante actividad real del usuario y mostrar un diálogo de
aviso a los 60 segundos del cierre, con opción de continuar.

### M-8 · Suscripciones sin desvinculación explícita

116 llamadas a `.subscribe()` frente a 9 usos de `takeUntilDestroyed`/`DestroyRef`. En la
práctica no hay fuga de memoria, porque `AntService` aplica `first()` a todas las respuestas y
los flujos se completan solos. El efecto residual es menor: si el componente se destruye
mientras la petición está en vuelo, el callback se ejecuta igualmente y escribe en señales de
un componente muerto.

**Corrección.** Añadir `takeUntilDestroyed()` en los helpers de `AntService`, o migrar las
lecturas a `httpResource()`, que gestiona la cancelación por sí mismo y encaja mejor con el
resto del código basado en señales.

---

## Bajos

### B-1 · El código legado vive dentro del repositorio

`docs/07-modulos/` contiene **904 archivos** de código fuente del sistema STG antiguo
(`.ts`, `.html`, `.scss`, incluidos `.module.ts` de Angular clásico). Es material de
referencia útil durante la migración, pero infla el repositorio, contamina las búsquedas de
texto y puede confundir a herramientas de análisis.

**Corrección.** Moverlo a un repositorio de referencia aparte o a una rama huérfana, y dejar
en `docs/` solo el enlace.

### B-2 · README genérico y sin manejador global de errores

El `README.md` de la raíz es el que genera Angular CLI por defecto: no menciona el protocolo
Winder, ni el backend Ant, ni cómo configurar el entorno local. Además no hay ningún
`ErrorHandler` de Angular registrado, así que las excepciones no capturadas fuera de HTTP se
pierden en la consola. Hay 22 llamadas a `console.*` en el código de producción.

**Corrección.** Reescribir el README con el arranque real del proyecto, y registrar un
`ErrorHandler` que centralice el registro de errores.

### B-3 · Sin monitorización en producción

No hay ninguna herramienta de observabilidad (Sentry, Application Insights o equivalente). Hoy
no hay forma de saber si un usuario tuvo un error, cuántas veces falló una petición al backend
Ant, ni qué módulos se usan realmente.

**Corrección.** Integrar un recolector de errores conectado al `ErrorHandler` de B-2 y al
`httpErrorInterceptor`, cuidando de no enviar datos personales ni financieros.
