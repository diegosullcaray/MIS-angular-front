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

**Los 24 reportes hoja que `sintaxis.json` detalla están migrados.** Quedan dos
nodos que el JSON no expande y por lo tanto no se pueden planificar.

| | Cantidad |
|---|---|
| Reportes del JSON migrados | 24 / 24 |
| Módulos | 11 |
| Rutas registradas en Actividad Diaria | 76 |
| Nodos bloqueados (sin detallar en el JSON) | 2 |

## 1. Módulos migrados

| Módulo | Rutas | Ejercicio |
|---|---|---|
| `Captaciones` | 14 | previo |
| `Cartera` | 19 | previo |
| `Clientes` | 6 | previo |
| `Portafolio Reasignado` | 3 | previo |
| `Cartera en Mora` | 17 | 01 |
| `Seguros` | 4 | 02 |
| `Campañas` | 3 | 02 |
| `Comercial Ejecutivo` | 4 | 02 |
| `Proyecciones` | 2 | 02 |
| `Reportes PDM` | 2 | 02 |
| `Movilidad` | 2 | 02 |

Los nodos que el JSON deja con `elementos: null` pero que sí están cubiertos:

| Nodo del JSON | Dónde quedó |
|---|---|
| `N_CAPTA` → CMG Clientes Pasivos | `Captaciones` (`cmg-cli-pas`, `-stock`, `-detalle`) |
| `N_CAPTA` → Captación Operacional / Comercial | `Captaciones` (`capta-caract-canal-*`) |
| `N_CAPTA` → Seguimiento Banca Preferente | `Captaciones` (`cap-segui-bp`, `gest-red-ag`) |
| `N_CLI`, `N_CART`, `N_HERED`, `N_CART_MOR` | módulos propios, ver tabla de arriba |

## 2. Bloqueado — falta información

| Nodo | Id | Problema |
|---|---|---|
| Aplicativo Móvil | `N_APPMOVIL` | El JSON lo declara sin `elementos`: no se sabe qué reportes cuelgan |
| Tablero Digital | `N_TABDIGITAL` | Ídem |

Para desbloquearlos hace falta que `sintaxis.json` los expanda con sus rutas.

## 3. Pendientes conocidos dentro de lo migrado

Cosas que se dejaron fuera a propósito, por no poder reproducirlas con
confianza. Todas están anotadas también en el JSDoc del componente.

| Dónde | Qué falta | Por qué |
|---|---|---|
| `Cartera en Mora` → Dashboard en Revisión | Cabecera "Avance Comercial" (4 KPI con meta) y 2 mapas de calor | Salen de `RS_GEST_COM_*`/`GRAF_GEST_COM_*` con un cálculo de metas repartido en 1.482 líneas; sin confirmar de dónde sale cada meta, inventar números en un tablero de banca es peor que no mostrarlos |
| `Seguros` → Evolutivo Pasivos | Verificar el parseo de `series`/`categories` | El legado las resuelve con `eval()`. Acá se hace `JSON.parse` dentro de `try/catch`: si el backend emite literales JS en vez de JSON, el gráfico queda vacío en lugar de mostrar datos equivocados. Hace falta un payload real para cerrarlo |
| `Seguros` → Seguros Optativos | Selector de periodo (`RS_FECH`) | El legado llena el selector con `meta1[0].json_result`; falta ver un payload real para saber su forma. Con la fecha de corte del usuario el reporte ya funciona |
| `Seguros` → Seguros Pasivos | Tabla "Protección 360" | El template del legado la declara (`dataSource5`) pero ningún `subscribe` la llena: tampoco muestra nada en el legado |

## 4. Trampas del legado encontradas

Las que ya están incorporadas al prompt (`promt-01.md`), por si hace falta el
detalle:

1. **Comentarios en el mapa.** El legado deja bloques, `reportType` y `jerar`
   comentados junto a los activos. Sin filtrarlos: `GRSCMIS` parece tener 5
   bloques y tiene 4; `R_APADRINA` parece usar `F,T,R` y usa `UNI_1`;
   `PROYEC_DIACOLREC` parece tener `_03`; `RMENTORIN` parece tener `_02`.
2. **El strand lo decide el HOST, no el mapa.** Los hosts `cra-v4`, `-v7` y
   `-v11` llaman `cs.getRegularData()` directamente e ignoran el `reportType`;
   solo los que usan `getMixData()` lo respetan. Además esos tres no agregan
   `fec` a los params. Confundirlo devuelve HTTP 500 — ver
   `docs/09-incidencias/incidencias-mora-estado.md`.
3. **`fec` vs `fecha`.** No son intercambiables y cada bloque declara el suyo.
   Además los reportes de `repositorio` usan `fec` pero **con guiones**
   (`fecha()`), no el compacto del motor mixto.
4. **Ids no correlativos ni con guion bajo.** `RSRTOPV` usa `'01'`;
   `PROYEC_COLREC` y `GRSCMIS` saltan números.
5. **Hay jerarquías sin nombre simbólico.** "Evolutivo Pasivos" pide la suya
   con `iniHierarchy(14, 4)`, que no es ningún `UNI_*`/`OFI_*` de
   `getHierarchyConfig()`. Mirá siempre el `iniHierarchy(...)` del componente de
   repositorio en vez de asumir `UNI_1`.
6. **`OFI_3` no es la jerarquía de oficinas.** `OFI_1` es `{code:2,max_lvl:5}`
   (→ `PARAMS_HIER_OFICINA`) y `OFI_3` es `{code:4,max_lvl:1}`
   (→ `PARAMS_HIER_FC`).
7. **El host decide cómo se piden los bloques.** `cra-V10` es paginado:
   `regularPaginado()`, con `pagen` y el nodo completo.
