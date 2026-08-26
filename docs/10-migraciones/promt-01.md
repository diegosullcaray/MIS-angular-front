# Prompt general para migraciones

> Versión 2 — reescrito después del ejercicio 01 ("Cartera en Mora", 17
> pantallas). Los cambios respecto de la v1 están al final, en "Qué cambió y por
> qué".

Copiá el bloque siguiente para tus próximas solicitudes.

---

Actúa como desarrollador experto en Angular y arquitectura limpia. Tu tarea es
migrar un módulo legacy del sistema MIS a nuestra estructura de standalone
components.

## Datos de entrada

- **Nombre del módulo:** `[NOMBRE_DEL_MODULO]`
- **Ruta destino:** `src/app/pages/modules/reportes/components/actividad-diaria/components/[NOMBRE_DEL_MODULO]/`
- **Inventario de rutas:** `docs/10-migraciones/sintaxis.json` (nodo
  `[ID_DEL_NODO]`)
- **Fuente legada de referencia** (solo lectura):
  - `docs/07-modulos/reportes/legacy/comercial/rda/administracion/cra-map.ts`
  - `docs/07-modulos/reportes/legacy/comercial/com-map.module.ts`
  - `docs/07-modulos/reportes/legacy/comercial/rda/administracion/rda-administracion-routing.module.ts`
  - `docs/07-modulos/reportes/repositorio/` (para las rutas `repositorio/*`)
- **Estado actual:** `docs/10-migraciones/estado-migracion.md`

## Estructura destino

```
[NOMBRE_DEL_MODULO]/
├── [nombre-modulo].routes.ts    # rutas lazy con standalone components
├── models/                      # interfaces, tipos y catálogos de filtro
├── services/                    # consumo de API y lógica de negocio
├── components/                  # sub-nodos propios de este módulo
│   └── [Sub Nodo]/items/
└── items/                       # reportes del nivel del nodo
```

Convención de nombres, tomada de los módulos ya migrados (`Captaciones`,
`Cartera`, `Clientes`, `Portafolio Reasignado`, `Cartera en Mora`): la carpeta
del módulo y de los sub-nodos va con mayúscula y espacios; todo lo de adentro,
en kebab-case.

## Reglas de desarrollo

### 1. Verificá antes de escribir — no asumas

Para **cada** reporte, andá a la fuente y anotá:

| Dato | Dónde sale |
|---|---|
| `cod_rep` y `title` | `rda-administracion-routing.module.ts`, entrada `path:` |
| Host (`cra-v1p1`, `cra-v4`, `cra-V10`, …) | ídem, campo `component:` |
| Bloques (`id`), params y `content.higher`/`lower` | `cra-map.ts` o `com-map.module.ts`, entrada `module:` |
| Jerarquía (`jerar`) | ídem |
| Strand | ídem, campo `reportType` |

Seis trampas, todas encontradas en el legado real:

- **Quitá los comentarios ANTES de leer el mapa.** Es la trampa que más
  silenciosamente arruina el mapeo: el legado deja bloques, `reportType` y
  `jerar` comentados al lado de los activos. Un `grep` ingenuo cuenta
  `GRSCMIS` con 5 bloques cuando tiene 4, o le asigna a `R_APADRINA` la
  jerarquía `F,T,R` cuando la activa es `UNI_1`. Filtrá `/* */` y `//` primero.
- **El strand no siempre es `regularData`.** `report.ts` inicializa
  `reportType = ReportType.DEPRECATED`, así que una entrada que NO declara
  `reportType` — o que lo tiene **comentado**, como `PROYEC_COLREC` — va por
  `reportData` → `BloqueReporteService.deprecado()`. Mandarla por el strand
  equivocado devuelve el bloque vacío **sin error**.
- **`fec` y `fecha` no son intercambiables.** `BloqueReporteService` agrega
  `fec` solo; el bloque que pide `fecha` lo tiene que recibir aparte.
- **El `id` del mapa no siempre lleva guion bajo** (`RSRTOPV` usa `'01'` →
  `RSRTOPV01`) ni es correlativo (`PROYEC_COLREC` tiene `_01` y `_03`), y varios
  reportes repiten el mismo `cod_rep` cambiando solo un parámetro (`tip_cod2`,
  `mode`, `tram`).
- **La jerarquía no siempre es `UNI_1`, y los nombres engañan.** `OFI_3` **no**
  es la jerarquía de oficinas: según `mod-rep.service.ts`, `OFI_1` es
  `{code:2, max_lvl:5}` y `OFI_3` es `{code:4, max_lvl:1}` ("solo FC") → en el
  repo es `PARAMS_HIER_FC`, no `PARAMS_HIER_OFICINA`. Resolvé siempre el `jerar`
  contra ese switch antes de elegir la constante.
- **El host decide cómo se piden los bloques.** `cra-V10` es paginado:
  `regularPaginado()`, con `pagen` y el nodo completo. Sin eso el backend
  responde "Resultado vacio para: regularData".

Script de referencia para leer el mapa sin comentarios:

```python
import re
def limpiar(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)   # bloque
    return re.sub(r'(?m)//.*$', '', s)     # línea
```

### 2. Reutilizá la shared UI — no reinventes

Ningún componente nuevo debe pintar tabla, ventana ni filtro por su cuenta.

| Necesidad | Qué usar |
|---|---|
| Reporte de 1 bloque | `<app-reporte-simple [tabla]>` + `ReporteSimpleBase` |
| Reporte de N bloques apilados | `<app-reporte-simple [bloques]>` + `ReporteBloquesBase` |
| Reporte con pestañas | `<app-reporte-simple [pestanas]>` |
| Tabla de columnas dinámicas (del backend) | `<app-tabla-dinamica>` |
| Tabla con buscador y filtros por columna | `<app-data-table>` |
| Filtro desplegable | `<app-select-filtro>` |
| Gráfico | `<app-grafico-mixto>` / `<app-grafico-pie>` |
| Ventana, jerarquía, vacío, carga | `<app-window-panel>`, `<app-hier-selector>`, `<app-empty-state>`, `<app-list-skeleton>` |

`ReporteSimpleBase`/`ReporteBloquesBase` ya resuelven el estado, el manejo de
error y la recarga: como `consultar()` corre dentro de un `effect`, cualquier
signal de filtro que leas ahí se vuelve dependencia y un cambio de filtro
redispara la consulta sin código extra.

Antes de crear un catálogo de filtro, buscá si ya existe en
`models/filtros.model.ts` o en el `models/` de otro módulo — varios se comparten
entre reportes y no hay que duplicarlos.

### 3. No inventes datos

Si un cálculo del legado no se puede reproducir con confianza (metas, fórmulas
sin fuente, payloads que no podés ver), **no lo aproximes**: dejalo fuera y
declaralo explícitamente en el JSDoc del componente y en el entregable. Es un
sistema de banca; un número inventado es peor que un espacio en blanco.

### 4. Documentá el porqué, no el qué

Los comentarios se escriben en español, explicando la decisión no obvia y
citando el archivo legado que la respalda. No comentes lo que el código ya dice.

## Verificación obligatoria antes de entregar

```bash
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.spec.json
npx ng build --configuration production      # sin errores NI warnings
npx ng test --watch=false                    # sin regresiones
npx playwright test e2e/[nombre-modulo].spec.ts
```

Incluí un smoke e2e nuevo, con una fila por ruta, que verifique el título **y**
que `page.url()` contenga la ruta: sin esa segunda aserción un typo en el `path`
cae en el comodín del módulo, redirige al primer reporte y el test pasa igual.

## Entregable

1. El árbol de carpetas propuesto.
2. Tabla de mapeo `reporte → ruta → cod_rep → host → strand → bloques`.
3. El código.
4. Un `docs/10-migraciones/ejercicio-NN-resultado.md` con esa tabla, las
   decisiones no obvias, la shared UI reutilizada, lo que quedó pendiente y el
   resultado de la verificación.
5. Actualizar `docs/10-migraciones/estado-migracion.md`.

---

## Qué cambió y por qué (v1 → v2)

| Cambio | Motivo |
|---|---|
| Se listan las fuentes legadas concretas, con path | En la v1 decía "rutas legacy de referencia" y había que descubrir a mano dónde vivía cada `cod_rep` |
| Sección "verificá antes de escribir" con las 6 trampas | Cuatro aparecieron en el ejercicio 01 y dos más al auditar el lote pendiente; sin avisarlas se repiten |
| Tabla de shared UI por necesidad | La v1 nombraba `<app-kpi-tile>` y `<app-loading-overlay>` como ejemplos genéricos; ahora dice cuál usar para qué caso real |
| Regla "no inventes datos" | Salió del `Dashboard en Revisión`, donde había que decidir entre aproximar metas o declarar el pendiente |
| Bloque de verificación con comandos exactos | La v1 no pedía verificación; sin eso no hay forma de saber si la migración quedó sana |
| Se pide el smoke e2e con la aserción de `url()` | Sin ella, un `path` mal escrito pasa el test |
| El entregable incluye actualizar el estado | Para que el inventario no se desactualice después de cada ejercicio |
