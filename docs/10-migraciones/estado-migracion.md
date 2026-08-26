# Estado de la migración — Actividad Diaria

Auditoría de `sintaxis.json` contra las rutas realmente registradas en la app.
No es una lista a mano: sale de comparar cada `ruta` del JSON con los `path` de
todos los `*.routes.ts` bajo `pages/modules/reportes/`.

> Cómo se regenera esta tabla — desde la raíz del repo:
>
> ```bash
> python3 - <<'PY'
> import json, re, glob
> data = json.load(open('docs/10-migraciones/sintaxis.json'))
> rutas = set()
> for f in glob.glob('src/app/pages/modules/reportes/**/*.routes.ts', recursive=True):
>     rutas |= set(re.findall(r"path:\s*'([^']*)'", open(f).read()))
> def walk(n, padre):
>     for el in n.get('elementos', []):
>         if el.get('tipo') == 'reporte':
>             corta = el['ruta'].replace('/app/reportes/', '')
>             print(('OK  ' if corta in rutas else 'FALTA'), f"[{padre}]", el['nombre'], '->', corta)
>         walk(el, el['nombre'])
> walk(data['nodoPrincipal'], 'Actividad Diaria')
> PY
> ```

## Resumen

| | Nodos | Reportes |
|---|---|---|
| Migrado | 5 | 59 rutas registradas |
| Pendiente (según `sintaxis.json`) | 6 + 2 sueltos | 17 |

De los 24 reportes hoja que el JSON detalla, **7 ya están migrados** (todos los
de Captaciones) y **17 están pendientes**.

---

## 1. Migrado

Cinco módulos bajo `actividad-diaria/components/`, 59 rutas.

| Módulo | Rutas | Notas |
|---|---|---|
| `Captaciones` | 14 | Cubre los 7 reportes que el JSON detalla + los 3 sub-nodos que el JSON deja sin expandir (CMG Clientes Pasivos, Captación Operacional/Comercial, Seguimiento Banca Preferente) |
| `Cartera` | 19 | Incluye la familia PDM (`act-pdm`, `mora-pdm`, `res-inc_pdm`, `det-ince-pdm`) |
| `Cartera en Mora` | 17 | Migrado en el ejercicio 01 — ver `ejercicio-01-resultado.md` |
| `Clientes` | 6 | |
| `Portafolio Reasignado` | 3 | |

### Cobertura de los nodos que el JSON no expande

El JSON deja varios nodos con `elementos: null`. Contra el repo, su estado es:

| Nodo del JSON | Estado |
|---|---|
| `N_CAPTA` → CMG Clientes Pasivos | migrado (`cmg-cli-pas`, `-stock`, `-detalle`) |
| `N_CAPTA` → Captación Operacional | migrado (`capta-caract-canal-operacional`) |
| `N_CAPTA` → Captación Comercial | migrado (`capta-caract-canal-comercial`) |
| `N_CAPTA` → Seguimiento Banca Preferente | migrado (`cap-segui-bp`, `gest-red-ag`) |
| `N_CLI` Clientes | migrado (6 rutas) |
| `N_CART` Cartera | migrado (19 rutas) |
| `N_HERED` Portafolio Reasignado | migrado (3 rutas) |
| `N_CART_MOR` Cartera en Mora | migrado (17 rutas) |
| `N_APPMOVIL` Aplicativo Móvil | **sin detallar y sin migrar** — el JSON no lista sus reportes |
| `N_TABDIGITAL` Tablero Digital | **sin detallar y sin migrar** — ídem |

> Para poder planificar esos dos nodos hace falta que el JSON los expanda; hoy
> no hay forma de saber qué reportes cuelgan de ellos.

---

## 2. Pendiente — 17 reportes

Cada fila trae ya resuelto el `cod_rep`, la jerarquía, el host, el strand y los
bloques, leídos de `cra-map.ts` / `com-map.module.ts` y
`rda-administracion-routing.module.ts`. Es el insumo directo del próximo
ejercicio.

> **Los ids son solo los ACTIVOS.** Varias entradas del legado tienen bloques
> comentados (`GRSCMIS` no tiene `_03`; `PROYEC_DIACOLREC` no tiene `_03`;
> `RMENTORIN` no tiene `_02`). Un `grep` ingenuo los cuenta igual: hay que quitar
> los comentarios antes de leer el mapa.

### N_SEG · Seguros → módulo nuevo `Seguros`

| Reporte | Ruta | `cod_rep` | Jerarquía | Host | Strand | Bloques activos |
|---|---|---|---|---|---|---|
| Reporte Seguros | `leg/com/rda/adm/cam-seguros` | `GRSCMIS` | `UNI_1` | `cra-v1p6` | `regularData` | `_01`, `_02`, `_04`, `_05` |
| Seguros Pasivos | `repositorio/actividad-diaria/seguros-pasivos/seguros-pasivos` | repositorio | — | propio | — | `repositorio/seguros-pasivos` |
| Evolutivo Pasivos | `repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico` | repositorio | — | propio | — | `repositorio/seguro-pasivos-graf` |
| Reporte Seguros Optativos | `repositorio/actividad-diaria/seguro/seguro-com` | repositorio | — | propio | — | `repositorio/seguro-com` |

### N_CAMP · Campañas → módulo nuevo `Campañas`

| Reporte | Ruta | `cod_rep` | Jerarquía | Host | Strand | Bloques activos | Params |
|---|---|---|---|---|---|---|---|
| Apadrinamiento | `leg/com/rda/adm/cam-apa` | `R_APADRINA` | `UNI_1` | `cra-v1p1` | `regularData` | `_01` | `fecha` |
| Agendamiento | `repositorio/actividad-diaria/campanias/agendamiento` | repositorio | — | propio | — | `repositorio/agenda-comercial` | — |
| Reporte Mentoring | `leg/com/rda/adm/RMentoring` | `RMENTORIN` | `UNI_1` | `cra-v1p7` | `regularData` | `_01` | `fec` |

### N_REP_EJ · Comercial Ejecutivo → módulo nuevo `Comercial Ejecutivo`

Los cuatro son `cra-v1p1` + bloque único + `UNI_1` + `regularData` y sin params
propios: encajan tal cual en `ReporteSimpleBase`. Es el lote más barato.

| Reporte | Ruta | `cod_rep` | Bloques |
|---|---|---|---|
| Desembolsos | `leg/com/rda/adm/desem-reacfae` | `DESEMBOLSOS_01` | `_01` |
| Clientes | `leg/com/rda/adm/cli` | `Clientes_01` | `_01` |
| Agro | `leg/com/rda/adm/agro` | `AGRO_01` | `_01` |
| PDM | `leg/com/rda/adm/pdm` | `PDM_01` | `_01` |

### N_PROYECCION · Proyecciones → módulo nuevo `Proyecciones`

| Reporte | Ruta | `cod_rep` | Mapa | Host | Strand | Bloques activos | Params |
|---|---|---|---|---|---|---|---|
| Proyección colocación | `leg/com/rda/adm/proy_M1` | `PROYEC_COLREC` | **`com-map`** | `cra-v11` | **`reportData`** | `_01`, `_03` | `fec` |
| Proyección diaria colocación | `leg/com/rda/adm/proy_M2` | `PROYEC_DIACOLREC` | `cra-map` | `cra-v1p1` | `regularData` | `_01`, `_02` | — |

> `PROYEC_COLREC` tiene su `reportType` **comentado**, así que cae en el
> `DEPRECATED` por defecto → `deprecado()`, no `regular()`. Además sus ids no son
> correlativos (`_01` y `_03`), el mismo patrón de `RS_AGE_COM_CR` en Portafolio
> Reasignado.

### N_REP_PDM · Reportes PDM → módulo nuevo `Reportes PDM`

| Reporte | Ruta | `cod_rep` | Jerarquía | Host | Strand | Bloques | Params |
|---|---|---|---|---|---|---|---|
| Seguimiento PDM | `leg/com/rda/adm/seg_pdm` | `SEG_PDM_01` | `UNI_1` | `cra-v1p1` | `regularData` | `_01` | `fec` |
| Gestión de Banca Solidaria | `repositorio/actividad-diaria/cartera/banca-solidaria` | repositorio | — | propio | — | `repositorio/banca-solidaria` | — |

### Reportes sueltos del nodo raíz

| Reporte | Ruta | `cod_rep` | Jerarquía | Host | Strand | Bloques | Params |
|---|---|---|---|---|---|---|---|
| Resumen Movilidad Comercial | `leg/com/rda/adm/res-mov` | `RESNMOV_01` | `UNI_1` | `cra-V10` (paginado) | `regularData` | `_01` | — |
| Resumen Movilidad Recuperaciones | `leg/com/rda/adm/res-mov-rec` | `RESNMOVR_01` | **`OFI_3`** | `cra-v6` | `regularData` | `_01` | `fec` |

> Dos avisos. `res-mov` es del host paginado → `regularPaginado()`, que necesita
> `pagen` y el nodo completo. Y `res-mov-rec` usa `OFI_3`, que **no** es
> `PARAMS_HIER_OFICINA`: según `mod-rep.service.ts`, `OFI_1` es
> `{code:2, max_lvl:5}` y `OFI_3` es `{code:4, max_lvl:1}` ("solo FC") — la
> constante correcta del repo es **`PARAMS_HIER_FC`**.

---

## 3. Orden sugerido

1. **Comercial Ejecutivo** (4) — todos `cra-v1p1`/bloque único/`UNI_1`. Sale casi
   entero con `ReporteSimpleBase`; sirve para validar el flujo de punta a punta.
2. **Reportes PDM** (2) y **sueltos** (2) — poco volumen, pero introducen dos
   casos nuevos (`OFI_3` y paginado) que conviene resolver temprano.
3. **Proyecciones** (2) y **Campañas** (3) — aparece `com-map`, ids no
   correlativos y la jerarquía `F,T,R`.
4. **Seguros** (4) — tres de los cuatro son componentes de `repositorio` con
   lógica propia; es el más caro y el que menos se apoya en `reporte-simple`.

## 4. Lo que falta para poder cerrar el plan

- `N_APPMOVIL` (Aplicativo Móvil) y `N_TABDIGITAL` (Tablero Digital) están en el
  JSON como nodos sin `elementos`. Hasta que se listen sus reportes no se pueden
  estimar ni migrar.
- Los cuatro reportes de `repositorio` pendientes (Seguros Pasivos, Evolutivo
  Pasivos, Seguros Optativos, Agendamiento, Banca Solidaria) tienen carpeta en
  `docs/07-modulos/reportes/repositorio/`, pero cada uno trae su propio
  componente y strands: hay que leerlos uno por uno, como pasó con `mon-imr`.
