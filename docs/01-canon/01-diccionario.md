# Diccionario del sistema

El vocabulario del MIS Host y del legado STG. Está acá porque la mitad de estos
términos **no se deducen del código**: son nombres del protocolo con el backend
o del negocio bancario, y quien llega nuevo los encuentra en un payload sin
ninguna pista de qué significan.

Cada entrada dice qué es y, cuando importa, **dónde vive en el código**.

---

## 1 · El protocolo con el backend

### Ant

El backend. Un conjunto de módulos, cada uno escuchando en su propio puerto y
con su propio secreto de cifrado. El frontend nunca le habla directo: siempre a
través de Winder.

Cada módulo se declara con una `IWinderConnectionConf` — `{ port, secret, appId }` —
en `core/winder/instances/`:

| Servicio | Puerto | `appId` | Qué sirve |
|---|---|---|---|
| `ModSysLoginService` | 6300 | `session` | Login, usuarios alternos |
| `ModSysAdminService` | 6301 | `admin` | Jerarquía organizativa, perfiles |
| `ModSeccionesService` | 5301 | `secciones` | Menú y secciones del sistema |
| `ModReportesService` | 5304 | `reporting` | **Los reportes**: los cuatro motores |
| `ModRep2Service` | 6304 | `rep2` | Reportes de la segunda generación |
| `ModDashboardService`, `ModIncentivosService`, `ModKaypachaService`, `ModPresupuestoService`, `ModFrameworkEsgService` | 6302 | `app` | Módulos de aplicación |

### Winder

El protocolo de transporte sobre HTTP. No es REST: **una sola ruta** recibe
todo, y lo que se pide viaja cifrado y en cabeceras.

- La configuración de conexión (`{ key, port, id, responseType }`) se cifra con
  AES y va como parámetro `w`.
- Lo que se pide de verdad —los *strands*— va como JSON en la cabecera HTTP
  **`Winder-Params`**.
- Rutas: `v1/g` (GET), `v1/p` (POST), `v1/pf` (POST con `FormData`).

Vive en `core/winder/winder/winder.service.ts`. Es un puerto fiel del legado.

### Strand

Literalmente "hebra". **Una petición dentro de la petición**: el nombre de la
acción a ejecutar en Ant, más su payload. Varios strands pueden viajar en una
sola llamada HTTP.

```ts
new Strand('regularData', 'result')     // actionRoute, nombre de la respuesta
  .pushToPayload('cod_rep', 'RS_DESEMB_02')
  .pushToPayload('tip_cod', 9);
```

- **`actionRoute`** — qué ejecutar. Es lo que este documento llama *motor*.
- **`name`** — bajo qué clave viene la respuesta en el `body`. Cambia según el
  motor: `result`, `resultado`, `base_hierarchy`, `level_hierarchy`.

### `IWinderResponse`

Lo que vuelve: `{ code, headers, body }`. El contenido útil está en `body`, bajo
la clave que pidió el strand.

---

## 2 · Los cuatro motores de reporte

El `actionRoute` del strand decide **la forma de la respuesta**. Es la
distinción más importante del sistema: dos reportes que se ven iguales en
pantalla pueden venir por motores distintos, y su mapeo no se parece en nada.

| Motor (`actionRoute`) | Respuesta bajo | Qué devuelve |
|---|---|---|
| `regularData` | `result` | **Motor mixto.** Un reporte con varios bloques: tablas, KPIs y gráficos juntos |
| `table.regular` | `resultado` | **Tabla dinámica.** Una sola tabla, con sus columnas descritas en el payload |
| `graphicData` | `result` | Solo bloques de gráfico |
| `reportData` | `result` | **Obsoleto.** Variante vieja del mixto. No usar en código nuevo |

> **El motor lo decide el host, no el mapa.** El mapa de reportes del legado no
> dice por cuál motor va cada `cod_rep`: eso está en el componente host que lo
> dibuja. Al migrar un reporte hay que mirar el host del legado, no solo el mapa.

Los cuatro están en `ModReportesService`; la fachada que los envuelve es
`BloqueReporteService`.

---

## 3 · Parámetros que viajan en el payload

Los nombres son del backend y **no son consistentes** — parte del trabajo de
migrar es descubrir cuál espera cada reporte.

| Parámetro | Qué es |
|---|---|
| `cod_rep` | **Código del reporte.** Identifica qué reporte pedir (`RS_DESEMB_02`, `CMG_CARTERA_01`). Es la clave de todo el sistema |
| `tip_cod` | **Tipo de código.** Qué clase de nodo de la jerarquía es el que se pide (financiera, zona, agencia…) |
| `cod_rel` | **Código de relación.** El nodo concreto (`FC`, `Z-NORTE`, `AG-TM`). Va siempre junto a `tip_cod`: los dos juntos identifican un nodo |
| `fec` / `fecha` | La fecha de corte. **Dos nombres para lo mismo**, según el reporte: unos piden `fec` (formato `YYYYMMDD`), otros `fecha` (`YYYY-MM-DD`), y algunos no reciben ninguna |
| `tipcod` / `codrel` | Los mismos `tip_cod`/`cod_rel` **sin guion bajo**. Los usan los reportes del motor `table.regular` |
| `pagen` | Número de página, en los reportes paginados |
| `tram` | Tramo de mora a consultar |
| `mode` | Variante del reporte (lo usa "Seguimiento de Portafolio", que se pide tres veces con `mode` distinto) |
| `resp` | Asesor responsable. `'TODO'` significa "todos" |
| `prod`, `met` | Producto y método, en los reportes de cartera |

---

## 4 · La jerarquía organizativa

El árbol de la organización: Financiera → Macro → Zona → Agencia → … Casi todo
reporte se pide "para un nodo" de este árbol.

| Término | Qué es |
|---|---|
| **Jerarquía** | Un árbol concreto. Hay varios (`cod_jer` 2, 4, 9, 12, 13), cada uno con su propia forma: por unidad, por oficina, por macro-corredor |
| `cod_jer` | Qué árbol se está recorriendo |
| `lvl_jer` / `lvl_hier` | El nivel que se pide o en el que está un nodo (1 = raíz) |
| `maxLvl` | Hasta qué nivel baja esa jerarquía. Sale de la configuración, no del backend |
| `cod_rels` | Lista de `cod_rel` separada por comas: los padres cuyos hijos se piden |
| `des_rel` / `desc_rel` | La descripción legible del nodo ("ZONA NORTE") |
| `lbl_hier` | La etiqueta **del nivel**, no del nodo ("ZONA", "AGENCIA"). Es lo que rotula el combo |
| `base_hier` | Strand que devuelve la **raíz** que le corresponde a un usuario |
| `level_hier` | Strand que devuelve **un nivel** del árbol |

Quien lo dibuja es `HierSelectorComponent` (`shared/ui/hier-selector/`), y
`JerarquiaCacheService` evita volver a pedirlo en cada pantalla.

---

## 5 · Negocio

| Término | Qué es |
|---|---|
| **STG** | El sistema legado (`stg-app-mis-r22`). También llamado "el original" o "la fuente" |
| **MIS** | *Management Information System*. El producto: el portal de información gerencial |
| **Host** | Este proyecto. En singular, "host" también es el **componente que dibuja un reporte** (los `report-cra-v*` del legado) |
| **Fecha de corte** | El día al que corresponde la información. No es "hoy": la declara el backend en `profile.curr_fec`, y pedir un día que todavía no cerró devuelve vacío. Ver `shared/ui/hier-selector/fecha-corte.util.ts` |
| **Bloque** | Una pieza de un reporte: una tabla, un grupo de KPIs o un gráfico. Un reporte del motor mixto trae varios |
| **KPI** | Las tarjetas con un número grande arriba del reporte |
| **Tramo de mora** | El rango de días de atraso de un crédito. Son seis, ordenados, y se pintan con `PALETA_TRAMOS` |
| **Colocación** | Crédito otorgado. "Proyección de colocación" estima cuánto se va a colocar |
| **Desembolso** | La entrega efectiva del dinero del crédito |
| **Reprogramado** | Crédito cuyo cronograma se renegoció |
| **Cartera** | El conjunto de créditos vigentes de una unidad |
| **Asesor** | Quien atiende clientes y coloca créditos. La unidad más chica de la jerarquía |
| **Banca solidaria** | Producto de crédito grupal |
| **Kaypacha** | Módulo de ranking y reconocimiento de colaboradores |
| **Base negativa** | Base de riesgos: se consulta un cliente y devuelve su historial de venta/castigo. Pantalla "Consulta Base Negativa" del módulo Herramientas |

---

## 6 · Arquitectura del Host

| Término | Qué es | Dónde |
|---|---|---|
| **Módulo** | Una unidad funcional del sistema (reportes, incentivos, presupuesto…) | `pages/modules/<nombre>/` |
| **Ítem** | Una pantalla de reporte concreta | `<módulo>/items/` o `components/` |
| `constantes/` | Los `cod_rep`, etiquetas y configuraciones fijas. **No van en los servicios** | por módulo |
| `models/` | Tipos e interfaces del dominio del módulo | por módulo |
| `utils/` | Mapeo de payloads y cálculos puros | por módulo |
| `services/` | **Solo peticiones al backend.** Nada de constantes ni de mapeo | por módulo |
| **Fachada** | `BloqueReporteService`: envuelve los cuatro motores para que los ítems no toquen Winder | `modules/reportes/services/` |
| **Puerto / Adaptador** | El patrón de `core/preferencias/`: `dominio/` define el puerto, `infraestructura/` lo implementa, `aplicacion/` lo usa | `core/preferencias/` |
| **Token de diseño** | Las variables `--mis-*` de `theme/tokens.css`. Única fuente de color; las consumen Tailwind y el preset de PrimeNG | `theme/` |
| **Zoneless** | Angular sin `zone.js`: la detección de cambios la disparan las señales, no los parches del navegador | todo el proyecto |

---

## 7 · Cosas que confunden

Anotadas porque ya costaron tiempo:

- **`fec` y `fecha` no son intercambiables.** Cada reporte espera uno, con su
  formato. Mandar el que no es devuelve 500 o vacío.
- **`tip_cod` no es "tipo de reporte".** Es el tipo de **nodo de la jerarquía**.
- **`lbl_hier` rotula el nivel, no el nodo.** Es "ZONA", no "ZONA NORTE".
- **Un 500 de Ant puede significar "no hay filas".** No siempre es un fallo;
  ver `utils/error-bloque.util.ts`.
- **`reportData` está obsoleto** pero sigue vivo en reportes migrados del
  legado. No es un motor nuevo que alguien deba elegir.
- **"Host" es ambiguo**: el proyecto entero, o el componente que dibuja un
  reporte. Por contexto.
