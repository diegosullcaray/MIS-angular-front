# Por qué el legado cargaba más rápido

Comparación del MIS Host contra **MIS-FUENTE** (`stg-app-mis-r22`, Angular 14),
el sistema original. Nace de un reporte concreto: *"en el legacy la carga de
datos es más rápida, e incluso hay reportes que en el legacy sí cargan y en el
migrado no"*.

Las dos observaciones eran correctas y tenían **causas distintas**. Este
documento explica cada una, con lo que se midió y lo que se cambió.

> Todo lo que sigue está medido contra el código de los dos repos, no estimado.
> El legado está en `github.com/diegosullcaray/mis-fuente`.

---

## Resumen

| Síntoma | Causa | Estado |
|---|---|---|
| Reportes que en el legado cargan y acá no | Un `timeout` de 30 s en el interceptor que el legado no tiene | Quitado |
| Un reporte lento se muestra como "sin datos" | Todo error se convertía en tabla vacía | Corregido: solo se absorbe la respuesta del servidor |
| Cada pantalla tarda en arrancar | La jerarquía se volvía a pedir entera, en serie, en cada montaje | Cacheada |

---

## 1 · El temporizador que el original no tiene

### Lo que había

`auth.interceptor.ts` cortaba **toda** request al backend Ant a los 30 s:

```ts
const ANT_TIMEOUT_MS = 30_000;   // "igual que el STG"
return next(req).pipe(timeout(req.context.get(TIMEOUT_MS)));
```

El comentario decía "igual que el STG". **No lo era.** En todo `src/` del
legado hay **cero** ocurrencias de `timeout(`: no existe interceptor de timeout,
ni configuración de `HttpClient` que lo imponga, ni nada equivalente. Su único
interceptor (`token.interceptor.ts`) solo refresca el token y llama a
`next.handle(request)` sin operadores.

Verificable en el legado con:

```bash
grep -rn "timeout" src --include=*.ts | grep -vi "settimeout\|cleartimeout"
# (sin resultados)
```

### Por qué rompía justo esos reportes

Los reportes de data masiva —"Seguimiento Reprogramados", "Seguimiento de
Portafolio", las proyecciones, Mentoring— tardan legítimamente más de 30 s. En
el legado el usuario espera y el reporte aparece. Acá la request se abortaba en
el cliente cuando el backend todavía la estaba resolviendo.

Se le había puesto un parche: un timeout largo (120 s, y 180 s para Estructura
de Desembolsos) que cada reporte pesado pedía por `HttpContext`. Eso mueve el
problema en vez de resolverlo: sigue habiendo un techo arbitrario, elegido por
el frontend, para una consulta cuya duración la decide el backend.

### Lo que quedó

Sin timeout, igual que el original. El interceptor pasa la request tal cual:

```ts
if (req.url.startsWith(environment.requestConfigRootURL)) {
  return next(req);
}
```

Se eliminaron `ANT_TIMEOUT_MS`, `TIMEOUT_MS`, `TIMEOUT_REPORTE_PESADO_MS` y
`TIMEOUT_ESTRUCTURA_DESEMBOLSOS_MS`, y los `HttpContext` que los pasaban.

**La contrapartida, dicha claramente**: una request que el backend nunca
conteste deja el spinner girando indefinidamente, igual que en el legado. Es el
comportamiento que se pidió y el que el original tiene; la salida del usuario es
navegar a otra pantalla.

---

## 2 · Un fallo que se veía como "no hay datos"

Esto agravaba lo anterior y es independiente de él.

`BloqueReporteService` absorbía **cualquier** error y devolvía una tabla vacía:

```ts
catchError(() => of(TABLA_VACIA))
```

Existe por una razón real: **Ant responde HTTP 500 a un bloque legítimamente
vacío** (`NullPointerException: Resultado vacio para: regularData`), y dentro de
un `forkJoin` eso tumba el reporte entero. Absorberlo es correcto.

El problema es que absorbía *todo*. Un timeout, una caída de red o un error de
mapeo se veían idénticos a un bloque sin filas: la pantalla decía "sin
información" cuando en realidad nunca se llegó a preguntar. Combinado con el
punto 1, el resultado exacto era el síntoma reportado — el reporte "no carga",
sin ningún error a la vista.

Ahora la línea se traza en si el servidor llegó a contestar
(`utils/error-bloque.util.ts`):

- `status >= 400` — Ant contestó; puede ser un bloque vacío. Se absorbe.
- `status === 0` — la request nunca llegó. Se propaga.
- Cualquier otro error (uno de mapeo) tampoco se absorbe: es un bug nuestro y
  esconderlo detrás de una tabla vacía lo vuelve invisible.

---

## 3 · La jerarquía, pedida de nuevo en cada pantalla

Esta es la causa del "carga más lento" en general, y la de mayor impacto.

### Lo que hace el legado

`CacheService` guarda cada nivel resuelto en `localStorage`, y
`SelectGroupComponent` decide en una línea si sale a la red:

```ts
locally(r?: {}) {
  !this.ca.isCache(r) ? this.external(r) : this.internal(r);
}
```

`internal()` lee de disco y no hace ninguna petición. La primera vez que el
usuario abre un reporte se paga la jerarquía; de ahí en adelante, no.

### Lo que hacía el Host

`HierSelectorComponent` no cacheaba nada. En cada `ngOnInit`:

1. `base_hier` — la raíz
2. `level_hier` del nivel de la raíz — **espera a (1)**
3. `level_hier` del nivel siguiente (auto-descenso) — **espera a (2)**

Tres viajes **en serie**, y recién después arranca la consulta del reporte. Son
tres latencias de red completas frente a un spinner, antes del primer byte de
data útil. **44 pantallas montan este selector**, y el costo se repetía entero
al cambiar de reporte y al recargar.

### Medición

Contando peticiones de jerarquía en el navegador (Chromium, backend simulado),
sobre tres visitas: reporte A → reporte B → reporte A.

| | `base_hier` | `level_hier` | Total |
|---|---|---|---|
| **Antes** | 3 | 6 | **9** |
| **Ahora** | 1 | 2 | **3** |

La cuenta de "antes" crece linealmente: cada pantalla que el usuario abre suma
3 peticiones más. La de "ahora" queda fija en 3 por sesión de pestaña.

### Lo que quedó

`JerarquiaCacheService`, con dos niveles:

- **Memoria** (`Map` de observables con `shareReplay({ refCount: false })`).
  Sirve la navegación dentro de la SPA y, de yapa, **comparte la petición en
  vuelo**: si dos componentes piden el mismo nivel a la vez sale una sola
  request. El legado dispara las dos, porque su caché recién se escribe en el
  `subscribe`.
- **`sessionStorage`.** Sobrevive al F5, que es lo que hace el caché del legado.

#### Por qué `sessionStorage` y no `localStorage` como el original

La clave del legado —`{tip_cod, cod_rel, level_load, jerar}`— **no incluye la
fecha de corte**. Su caché puede servir el árbol de ayer sin darse cuenta. Acá
la fecha va en la clave y además el caché muere con la pestaña: se toma la
velocidad sin heredar esa forma de quedar desactualizado.

Se vacía además al **cerrar sesión** y al **cambiar de usuario alterno**: el
árbol que ve cada persona depende de quién es.

---

## Lo que NO resultó ser la causa

Se descartó con evidencia, y queda anotado para no volver a investigarlo:

- **El motor Winder no hace más trabajo.** `WinderService`, `RESTService`,
  `RESTPacket` y `Strand` son puertos fieles: mismo cifrado (`CypherService`),
  mismo header `Winder-Params`, mismas rutas `v1/g` y `v1/p`. La única
  diferencia es de estilo (`inject()` en vez de constructor, tipos en vez de
  `any`).
- **Los bloques ya van en paralelo.** Los reportes de varios bloques usan
  `forkJoin`; solo 11 archivos tienen 3 o más `subscribe` sin `forkJoin`, y son
  cargas independientes, no cadenas.
- **No hay doble carga por efectos de señales.** Ningún `effect()` vuelve a
  disparar la consulta del reporte.

---

## Cómo verificar que esto no se pierda

```bash
# La jerarquía se pide una vez por sesión, no una por pantalla (cuenta requests reales)
npx playwright test e2e/jerarquia-cache.spec.ts

# Ningún reporte manda contexto de timeout, y el bloque vacío se sigue tolerando
npx ng test --watch=false
```

Y para comprobar que no volvió a aparecer un timeout:

```bash
grep -rn "timeout(" src --include=*.ts   # solo debería aparecer en tests, si acaso
```
