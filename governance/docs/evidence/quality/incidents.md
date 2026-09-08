# Incidentes de calidad

Registrar aqui defectos reproducibles de UI, contratos, navegacion o datos. Cada incidente debe incluir pantalla, usuario/rol, fecha de corte, pasos, resultado esperado, resultado actual y prueba de regresion.

Los campos obligatorios salen de la [política de evidencia](../evidence-policy.md).

---

## INC-2026-09-08-01 · La suite unitaria caía entera donde jsdom no da almacenamiento

| Campo | Valor |
|---|---|
| **Componente** | Entorno de pruebas unitarias (`src/test-setup.ts`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno** | Windows, ruta del proyecto con espacios (`D:\FINANCIERA CONFIANZA\…`); Vitest + jsdom 29.1.1 |
| **Estado** | **Corregido** |
| **Evidencia** | `governance/incidencias/incidencias-test.md` (log completo de la corrida) |

### Resultado observado

**92 pruebas fallidas en 12 archivos.** Los 12 son exactamente los que tocan
almacenamiento web, y el error es siempre el mismo:

```
TypeError: Cannot read properties of undefined (reading 'clear')
 ❯ ... localStorage.clear();
```

### Resultado esperado

Los 12 archivos en verde: ninguno prueba almacenamiento, solo lo usan para
aislarse entre casos.

### Causa raíz

**No son 92 defectos, es uno.** `localStorage` y `sessionStorage` llegaban
`undefined` al spec.

jsdom no expone el almacenamiento cuando el documento tiene un **origen opaco**.
Medido contra el jsdom del proyecto:

| URL del documento | `window.localStorage` |
|---|---|
| sin `url` / `about:blank` | **lanza** `SecurityError: localStorage is not available for opaque origins` |
| `file:///D:/FINANCIERA%20CONFIANZA/…` | **lanza** el mismo `SecurityError` |
| `http://localhost:3000` | `object` |

Cuando ese *getter* lanza, Vitest no puede copiar la propiedad al `globalThis`
del worker y el global queda sin definir. El log de la incidencia muestra rutas
`file:\D:\FINANCIERA%20CONFIANZA\…`, que es el escenario de la segunda fila.

`angular.json` es idéntico en las dos máquinas y `@angular/build:unit-test` no
expone ninguna opción de entorno para jsdom — el `schema.json` del builder tiene
`browsers`, `runner`, `runnerConfig` y `setupFiles`, pero nada de `url`. El
entorno lo arma Vitest, y ahí es donde las dos máquinas divergen.

> **En el contenedor de desarrollo el fallo no se reproduce**: ahí jsdom resuelve
> un origen real y la suite pasa. Por eso la corrección no intenta adivinar por
> qué diverge la máquina — hace que la suite deje de depender de eso.

### Corrección

`src/test-setup.ts` instala un almacén en memoria con la forma de `Storage`
**solo cuando el entorno no trae uno** (detectado con `try/catch`, porque el
acceso puede lanzar). Donde jsdom sí lo expone, no se instala nada.

El respaldo respeta los dobles de prueba: si un spec pisa `Storage.prototype.clear`
para simular un almacenamiento bloqueado —como hace
`almacenamiento-navegador.spec.ts`— el respaldo deja pasar ese doble primero. Sin
eso sería *más* tolerante que el almacén real y esa prueba habría pasado a verde
por el motivo equivocado.

### Prueba de regresión

`src/test-setup.spec.ts` — 5 casos que verifican que ambos almacenes existen,
guardan, borran y llegan vacíos a cada test. Es la prueba que faltaba: convierte
un problema de entorno en **un** fallo que se explica solo, en vez de 92
repartidos por el árbol.

Verificado simulando el entorno degradado (un `setupFile` previo que borra los
globales): **125 de 125 en verde**, incluidas las 92 que caían.

---

## INC-2026-09-08-02 · El spec de sesión seguía afirmando 30 minutos

| Campo | Valor |
|---|---|
| **Componente** | `AuthService` (`src/app/pages/full-pages/auth/service/auth.service.spec.ts`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno** | Reproducible en cualquier máquina |
| **Estado** | **Corregido** |

### Resultado observado

Dos casos en rojo:

```
AssertionError: expected 1788884015061 to be less than or equal to 1788882815061
```

La diferencia es de 1 200 000 ms — exactamente 20 minutos.

### Causa raíz

El mismo commit subió `DURACION_SESION_MS` de 30 a 50 minutos en
`src/app/app.global.ts`. El spec repetía el número `30 * 60 * 1000` en cuatro
lugares en vez de leer la constante, así que una decisión de producto legítima
dejó las pruebas en rojo.

### Corrección

El spec importa `DURACION_SESION_MS` y deriva de ahí la ventana de expiración y
los avances de reloj. La duración de la sesión puede volver a cambiar sin tocar
el spec.

### Prueba de regresión

Los mismos dos casos, ahora atados a la constante.

---

## INC-2026-09-08-03 · El anillo de carga ciclaba colores en vez del celeste de marca

| Campo | Valor |
|---|---|
| **Componente** | `<app-loading-overlay>` |
| **Fecha** | 2026-09-08 |
| **Navegador / viewport** | Chromium, 1280×800 y 375×780, claro y oscuro |
| **Estado** | **Corregido** |

### Resultado observado

El CSS declaraba `stroke: var(--mis-secondary)` y el anillo se veía verde,
amarillo y rojo alternándose.

### Causa raíz

Aura aplica **dos** animaciones a `.p-progressspinner-circle`:
`p-progressspinner-dash` (el trazo) y `p-progressspinner-color`, que recorre
cuatro colores y pisa el `stroke`. El override del proyecto ajustaba
`animation-duration`, lo que además comprimía el ciclo de color de 6 s a 1.6 s y
lo hacía más notorio.

### Corrección

Se declara solo la animación del trazo, con lo que el `stroke` de marca
prevalece. De paso se agrandó la composición a anillo 144 / avatar 104 px: a
112/80 el Puma seguía leyéndose como un ícono y no como la mascota.

### Prueba de regresión

Cubierto por `loading-overlay.component.spec.ts` en cuanto a estructura
(anillo + avatar + `aria-busy`). El color es una comprobación visual: capturas
en claro y oscuro.

---

## INC-2026-09-08-04 · Nueve E2E en rojo que no reproducen fuera de esa máquina

| Campo | Valor |
|---|---|
| **Componente** | Suite Playwright (lotes de actividad diaria/mensual y `responsive-movil`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno reportado** | Windows, `D:\FINANCIERA CONFIANZA\…` |
| **Estado** | **No reproducido** — sin cambio de código |
| **Evidencia** | `governance/incidencias/playwrithe/` (9 carpetas con `error-context.md` y captura) |

### Resultado observado en la máquina que reportó

Dos patrones:

1. `page.waitForLoadState` agotando los 30 s del timeout — siete casos, entre
   ellos `seguro-pasivos-grafico` y varios de los lotes 02 y 03.
2. `#tour-sidebar-icons` no visible en `/app/reportes` a 384 px
   (`responsive-movil`), con la navegación aún en curso.

### Resultado en el contenedor de verificación

**523 pasadas, 1 omitida, 0 fallidas** sobre el mismo commit, en los dos
proyectos (`desktop-chromium` y `mobile-chromium`).

### Lectura

Los dos patrones son de espera, no de comportamiento: en el primero la página
llegó a `load` y el test seguía esperando `networkidle`; en el segundo la
aserción corrió mientras la navegación no había terminado. Es lo que se ve
cuando la máquina va más lenta que los timeouts del spec, no cuando la pantalla
está rota.

**No se cambió código por esto.** Endurecer un timeout o relajar una aserción
para que pase en una máquina lenta esconde el problema en vez de resolverlo. Si
vuelve a aparecer conviene decidir entre subir los timeouts del proyecto o
cambiar `waitForLoadState('networkidle')` por una espera sobre un elemento
concreto, que es la práctica recomendada de Playwright y no depende de la
velocidad del equipo.
