# Incidencias de rendimiento y carga de datos

Registro de la auditoría contra **MIS-FUENTE** (el STG original) que se abrió
con este reporte:

> *"En el legacy la carga de datos es más rápida, e incluso en algunos reportes
> en el legacy sí carga mientras en el que migraste no carga porque veo que
> tiene un temporizador."*

Las dos observaciones eran correctas y tenían causas distintas. El análisis
completo está en
[`02-arquitectura/07-rendimiento-legacy-vs-host.md`](../02-arquitectura/07-rendimiento-legacy-vs-host.md);
acá va el registro de cada incidencia con su evidencia y su corrección.

**Resultado:** 5 defectos, todos corregidos. 1793 pruebas unitarias y 499 de
Playwright en verde.

---

## R-01 · Un timeout de 30 s que el original no tiene · **Crítico**

**Síntoma.** Reportes que en el STG cargan y en el Host no: "Seguimiento
Reprogramados", "Seguimiento de Portafolio", las proyecciones, Mentoring.

**Causa.** `auth.interceptor.ts` cortaba toda request al backend Ant a los 30 s:

```ts
const ANT_TIMEOUT_MS = 30_000;   // el comentario decía "igual que el STG"
return next(req).pipe(timeout(req.context.get(TIMEOUT_MS)));
```

**El comentario era falso.** En todo el `src/` del legado hay **cero**
ocurrencias de `timeout(`. Comprobado con:

```bash
grep -rn "timeout" src --include=*.ts | grep -vi "settimeout\|cleartimeout"
# (sin resultados)
```

Su único interceptor (`token.interceptor.ts`) refresca el token y llama a
`next.handle(request)` sin ningún operador. No hay techo de espera en el STG.

**Agravante.** Ya se había parcheado dos veces subiendo el techo para reportes
concretos (`TIMEOUT_REPORTE_PESADO_MS` = 120 s,
`TIMEOUT_ESTRUCTURA_DESEMBOLSOS_MS` = 180 s). Eso mueve el problema: sigue
habiendo un límite arbitrario elegido por el frontend para una consulta cuya
duración la decide el backend.

**Corrección.** Quitado el timeout. Eliminados los cuatro tokens y los
`HttpContext` que los pasaban.

**Contrapartida, dicha explícitamente.** Una request que el backend nunca
conteste deja el spinner girando, igual que en el STG. Es el comportamiento
pedido y el del original; la salida del usuario es navegar a otra pantalla.

---

## R-02 · Cualquier fallo se mostraba como "sin datos" · **Alto**

**Síntoma.** El reporte "no carga" sin ningún mensaje de error: sale la tabla
vacía. Es lo que hacía que R-01 fuera invisible en vez de un error legible.

**Causa.** `BloqueReporteService` absorbía **todo** error:

```ts
catchError(() => of(TABLA_VACIA))
```

en `regularTolerante`, `regularLento`, `graficos` y `periodos`.

El `catchError` existe por una razón real: **Ant responde HTTP 500 a un bloque
legítimamente vacío** (`NullPointerException: Resultado vacio para:
regularData`), y dentro de un `forkJoin` eso tumbaría el reporte entero. El
defecto no es absorber, es absorber sin distinguir: un timeout, una caída de red
o un error de mapeo se veían idénticos a un bloque sin filas.

**Corrección.** `utils/error-bloque.util.ts` traza la línea en si el servidor
llegó a contestar:

- `status >= 400` → Ant contestó; puede ser bloque vacío. Se absorbe.
- `status === 0` → la request nunca llegó. Se propaga.
- Cualquier otro error (uno de mapeo) tampoco se absorbe.

---

## R-03 · La jerarquía se volvía a pedir en cada pantalla · **Alto**

**Síntoma.** Toda pantalla de reporte tarda en arrancar, incluso volviendo a una
recién visitada.

**Causa.** El STG cachea cada nivel resuelto en `localStorage` y decide en una
línea si sale a la red:

```ts
locally(r) { !this.ca.isCache(r) ? this.external(r) : this.internal(r); }
```

`HierSelectorComponent` no cacheaba nada. En cada `ngOnInit` hacía tres viajes
**en serie** —`base_hier` → `level_hier` de la raíz → `level_hier` del nivel
siguiente— y recién después arrancaba la consulta del reporte. **44 pantallas**
montan este selector.

**Medición**, contando peticiones en Chromium sobre tres visitas (reporte A →
reporte B → reporte A):

| | `base_hier` | `level_hier` | Total |
|---|---|---|---|
| Antes | 3 | 6 | **9** |
| Ahora | 1 | 2 | **3** |

La cuenta de "antes" crece con cada pantalla abierta; la de "ahora" queda fija
por sesión de pestaña.

**Corrección.** `JerarquiaCacheService`, con caché en memoria (que además
comparte la petición en vuelo) respaldado en `sessionStorage` (que sobrevive al
F5, como el del STG). Se vacía al cerrar sesión y al cambiar de usuario alterno.

**Diferencia deliberada con el original.** El STG cachea en `localStorage` con
una clave —`{tip_cod, cod_rel, level_load, jerar}`— que **no incluye la fecha de
corte**: puede servir el árbol de ayer. Acá la fecha va en la clave y el caché
muere con la pestaña.

---

## R-04 · `regularLento` perdió su tolerancia al refactorizar · **Medio**

Detectado durante la propia corrección, antes de llegar a producción.

Al vaciar `regularLento` de su timeout quedó delegando en `regularExacto`, que
**no** tolera el bloque vacío. Sus seis llamadores van todos dentro de un
`forkJoin` (Proyecciones, "Seguimiento de Portafolio" con sus tres `mode`,
Mentoring), así que un solo bloque vacío habría tumbado el reporte entero — el
bug que las tareas M3/M4 y P1 ya habían corregido.

**Corrección.** `regularLento` delega en `regularTolerante`. Conserva el nombre
propio porque sigue diciendo algo cierto: marca cuáles son los bloques que
tardan de verdad.

---

## R-05 · Los tests simulaban el 500 con un `Error` plano · **Medio**

Los specs de tolerancia simulaban el 500 de Ant así:

```ts
throwError(() => new Error('500 Resultado vacio para: regularData'))
```

Un `Error` genérico, no un `HttpErrorResponse`. Mientras el `catchError`
absorbía todo, la diferencia no se notaba; con R-02 corregido, el test dejó de
representar lo que pasa de verdad.

**Corrección.** Los cuatro specs usan
`new HttpErrorResponse({ status: 500, statusText: '...' })`, y se agregaron dos
tests del caso nuevo: que una caída de red (`status: 0`) **sí** se propague en
vez de disfrazarse de tabla vacía.

---

## Qué se descartó, con evidencia

Anotado para que nadie vuelva a investigarlo:

- **El motor Winder no hace más trabajo que el del STG.** `WinderService`,
  `RESTService`, `RESTPacket` y `Strand` son puertos fieles: mismo cifrado,
  mismo header `Winder-Params`, mismas rutas. La única diferencia es de estilo
  (`inject()` en vez de constructor, tipos en vez de `any`).
- **Los bloques ya se piden en paralelo.** Los reportes de varios bloques usan
  `forkJoin`; solo 11 archivos tienen 3 o más `subscribe` sin `forkJoin`, y son
  cargas independientes, no cadenas.
- **No hay doble carga por efectos de señales.**

---

## Regresión

```bash
npx playwright test e2e/jerarquia-cache.spec.ts   # cuenta peticiones reales
npx ng test --watch=false                         # tolerancia y ausencia de timeouts
grep -rn "timeout(" src --include=*.ts            # no debería volver a aparecer
```

## Lecciones

1. **Un comentario que dice "igual que el legado" hay que verificarlo.** El del
   timeout afirmaba paridad con el STG y era exactamente lo contrario. Costó los
   reportes pesados y dos parches que no atacaban la causa.
2. **Subir un límite dos veces es la señal de que el límite sobra.** Los dos
   parches previos (120 s, 180 s) eran la pista de que el techo no debía existir.
3. **Absorber errores sin distinguirlos convierte un fallo en un dato falso.**
   Una tabla vacía es una afirmación sobre el negocio: "no hay filas". Decirla
   cuando en realidad no se pudo preguntar es peor que mostrar un error.
4. **Antes de optimizar, mirar qué hacía el original.** Las tres causas estaban
   a la vista en el código del STG; ninguna requirió perfilar.
