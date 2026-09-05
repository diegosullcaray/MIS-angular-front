# Pruebas de responsive y de color

Catálogo de la batería que cubre **dos cosas que no se ven en un code review**:
si la interfaz entra en un teléfono, y si sus colores se distinguen. Ambas eran
puntos ciegos: no había ninguna prueba que midiera un ancho de pantalla real ni
un contraste, y los dos defectos que aparecen ahí solo se notan cuando ya están
en producción y alguien no puede leer una etiqueta.

Se apoyan en dos utilidades nuevas:

| Archivo | Qué aporta |
|---|---|
| [`src/app/theme/contraste.util.ts`](../../src/app/theme/contraste.util.ts) | Contraste WCAG, composición alfa, OKLab/OKLCH, distancia perceptual y simulación de los tres daltonismos |
| [`e2e/fixtures/dispositivos.ts`](../../e2e/fixtures/dispositivos.ts) | Los 13 dispositivos del parque real, Android e iOS |
| [`e2e/fixtures/desbordes.ts`](../../e2e/fixtures/desbordes.ts) | Detección de desborde horizontal y de objetivos táctiles chicos |

---

## 1 · Color: 66 pruebas unitarias

### Por qué existen

Los tokens de `tokens.css` son la **única** fuente de color del Host: Tailwind
los consume con `text-[var(--mis-*)]` y PrimeNG a través del preset `MisTheme`.
Si un par texto/fondo no llega al umbral, no queda floja una pantalla: queda
floja **toda** la interfaz que use ese par. Por eso se mide el token, no el
componente.

### Cómo llegan los tokens al test

Los specs **no leen `tokens.css`**: el builder de `@angular/build:unit-test`
empaqueta los specs y ahí `node:fs` no existe. En su lugar,
[`scripts/generar-tokens-paleta.mjs`](../../scripts/generar-tokens-paleta.mjs)
parsea los bloques `:root` y `.dark` del CSS y emite
`src/app/theme/tokens.paleta.ts` con los 45 tokens de color de cada tema. El
modo `--check` falla si el generado quedó viejo, así que **los tests miden los
valores reales del sistema, no una copia a mano**.

### `src/app/theme/tokens.paleta.spec.ts` — 52 pruebas

25 por tema (claro y oscuro) más 2 de coherencia entre ambos.

| Grupo | Qué exige | Umbral |
|---|---|---|
| Texto de cuerpo | `text-primary` y `text-secondary` sobre `bg`, `surface` y `panel-bg` | 4.5:1 (WCAG AA) |
| Texto sobre marca | `text-on-primary` sobre `primary`; `text-on-secondary` sobre `secondary` | 4.5:1 |
| Colores de estado como texto | `success`, `warning`, `danger` sobre la superficie y sobre su propia variante clara | 4.5:1 |
| Componentes de interfaz | `border-control` y `accent` sobre las tres superficies; `primary` sobre `bg` | 3:1 (WCAG 1.4.11) |
| Bordes decorativos | `border` y `border-strong` son **perceptibles**, y el fuerte contrasta más que el normal | 1.2:1 |
| Texto terciario | metadatos y estados apagados sobre la superficie | 3:1 (AA grande) |
| Coherencia | los dos temas declaran los mismos tokens; ninguno de texto o superficie quedó con el mismo valor en ambos | — |

Dos decisiones que valen la pena explicar:

- **Los bordes decorativos no llevan 3:1.** `--mis-border` y `--mis-border-strong`
  son divisores, no contornos de control. Subirlos a 3:1 encuadraría toda la
  interfaz en líneas duras. Lo que sí tienen que hacer es **verse**: por debajo
  de 1.2:1 el divisor desaparece contra la superficie y la retícula se pierde.
  Para el caso que sí necesita 3:1 —el borde de un input, que delimita el
  control por sí solo— se agregó `--mis-border-control`.
- **La mitad de los tokens son `rgba`.** Por eso `contraste.util.ts` compone
  sobre el fondo antes de medir: un borde a 12 % de alfa no tiene contraste
  propio, lo tiene el color resultante.

### `src/app/shared/ui/graficos/utils/paleta-colores.armonia.spec.ts` — 14 pruebas

En un gráfico **el color es el dato**: si dos series no se distinguen, el
gráfico miente. Se mide en Delta E de OKLab ×100:

- **15** — piso para visión normal. Por debajo, un lector sin ninguna
  dificultad ya no separa las dos series.
- **8** — objetivo bajo daltonismo simulado (protanopía, deuteranopía y
  tritanopía, matrices de Machado-Oliveira-Fernandes 2009 a severidad 1.0).
- **6** — piso de daltonismo, aceptable **solo** con una segunda codificación
  (etiqueta directa, forma o textura).

La regla de qué pares se comparan depende de si la paleta tiene orden:

| Paleta | Pares que se comparan | Por qué |
|---|---|---|
| `PALETA_SERIES` (10 series genéricas) | contiguos | Es una lista ordenada: lo que cae junto en la leyenda es el color *n* con el *n+1* |
| `PALETA_TRAMOS` (6 tramos de mora) | contiguos | Es una escala ordenada de mora |
| Roles de reportes mixtos (navy / magenta / naranja / azul) | **todos** | Los roles no tienen orden: cualquiera puede caer al lado de cualquiera |

Además: ningún color se lee como gris (croma OKLCH ≥ 0.06), ninguna serie
desaparece contra el fondo del gráfico en ninguno de los dos temas, y el texto
de ejes y leyenda de Highcharts es legible sobre su fondo.

---

## 2 · Responsive: 53 pruebas de navegador + 7 unitarias

### El parque de dispositivos

[`e2e/fixtures/dispositivos.ts`](../../e2e/fixtures/dispositivos.ts) — 13
equipos, ordenados de más angosto a más ancho. **El primero es el caso duro**:

| Android | px | iOS | px |
|---|---|---|---|
| Galaxy Z Fold (plegado) | 280 × 653 | iPhone SE (2ª/3ª gen) | 375 × 667 |
| Galaxy S8 / gama baja | 360 × 740 | iPhone 13 mini | 375 × 812 |
| Galaxy A54 | 384 × 854 | iPhone 14 / 15 | 390 × 844 |
| Pixel 5 | 393 × 851 | iPhone 14 Pro | 393 × 852 |
| Pixel 7 | 412 × 915 | iPhone 15 Pro Max | 430 × 932 |
| Galaxy S20 Ultra | 412 × 915 | | |

Tablets, que cruzan el breakpoint `sm` y activan el layout de escritorio: iPad
mini 768 × 1024 e iPad Pro 11" 834 × 1194.

### `e2e/responsive-movil.spec.ts` — 53 pruebas

Corren en los dos proyectos de Playwright (`desktop-chromium` y
`mobile-chromium`), o sea 106 ejecuciones.

| Bloque | Cobertura |
|---|---|
| Sin scroll horizontal en ningún teléfono | 11 teléfonos × 4 pantallas (Dashboard, Explorador de reportes, Actividades, Base negativa) = 44 |
| El shell en el ancho más chico (280px) | el rail es la barra inferior y no la columna lateral; el header entra completo sin comerse el breadcrumb; el contenido no queda tapado por la barra fija |
| Diálogos en móvil | el diálogo de configuración entra en el ancho del teléfono |
| Objetivos táctiles | los botones del header llegan a 44×44; ningún control del shell baja de 24×24 (WCAG 2.5.8); los íconos del rail son cómodos de tocar |
| Tablets | iPad mini e iPad Pro montan el rail lateral y no desbordan |

### Cómo se detecta un desborde sin falsos positivos

Es la parte que más costó afinar, y la lógica está en
[`e2e/fixtures/desbordes.ts`](../../e2e/fixtures/desbordes.ts):

- **La aserción dura es a nivel de página**: `scrollWidth === clientWidth` del
  documento. Esa es la que decide si el test pasa. La lista de elementos se usa
  solo para *localizar la causa* cuando falla.
- **Un elemento más ancho que el viewport no es un defecto** si algún ancestro
  con `overflow-x: auto | scroll | hidden | clip` lo contiene. Una tabla de
  reportes de 600px dentro de su contenedor con scroll propio es el
  comportamiento correcto, no un bug. `estaContenido()` camina los ancestros
  para decidirlo.
- **El desborde respecto del contenedor solo cuenta** para elementos que ocupan
  al menos el 25 % del ancho del viewport: por debajo son etiquetas truncadas,
  no problemas de layout.

### Pruebas unitarias de contrato responsive

jsdom **no calcula layout** (`getBoundingClientRect()` devuelve ceros), así que
estas pruebas no miden un tamaño: verifican que **las clases que producen ese
tamaño sigan declaradas**. Son la red barata que atrapa la regresión —alguien
vuelve a poner `w-8` y el botón queda en 32px— sin levantar un navegador. La
medición real, en píxeles y en dispositivos, es la de Playwright.

| Spec | Pruebas | Qué fija |
|---|---|---|
| [`header.responsive.spec.ts`](../../src/app/pages/full-pages/layout/components/header/header.responsive.spec.ts) | 3 | Los botones de acción declaran `w-[44px] h-[44px]` en móvil y `sm:w-8 sm:h-8` en escritorio; la píldora de usuario reserva el alto táctil; el botón del rail superpuesto solo existe desde `sm` |
| [`shell-layout.responsive.spec.ts`](../../src/app/pages/full-pages/layout/components/shell-layout/shell-layout.responsive.spec.ts) | 4 | `pb-16 sm:pb-0` reserva el espacio de la barra fija; la columna de contenido puede encogerse (`min-w-0`); el área principal desplaza en vertical y nunca en horizontal; el fondo cubre la pantalla sin desbordarla |

**Por qué `w-[44px]` y no `w-11`.** El `rem` del proyecto está escalado:
`w-11` (2.75rem) renderiza a **41px**, por debajo del mínimo de 44×44 de la
guía de Apple y del AAA de WCAG 2.5.5. El píxel explícito es intencional.

---

## Cómo correrlas

```bash
npx ng test --watch=false                    # unitarias, incluye color y contrato responsive
npx playwright test e2e/responsive-movil.spec.ts   # responsive real, en los 13 dispositivos
node scripts/generar-tokens-paleta.mjs --check     # falla si tokens.paleta.ts quedó viejo
```

Si cambiás un color en `tokens.css`, regenerá la paleta antes de correr los
tests:

```bash
node scripts/generar-tokens-paleta.mjs
```

## Lo que estas pruebas NO cubren

- **Safari real.** Playwright corre Chromium; el layout de iOS se aproxima por
  viewport, no por motor. Un bug propio de WebKit no lo atrapa esta batería.
- **Orientación horizontal.** Los 13 dispositivos están en vertical.
- **Contraste de texto sobre imágenes.** El fondo institucional es una foto: el
  contraste real depende del píxel debajo de cada letra, y eso no se calcula
  desde un token.
- **Zoom y tamaño de fuente del sistema.** WCAG 1.4.4 (redimensionar al 200 %)
  no está cubierto.
