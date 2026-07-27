# Resolución de selectores duplicados

> Tarea 1.2 del [plan](../01-analisis/03-plan-refactorizacion.md#tarea-12--resolver-los-14-selectores-duplicados).
> Cierra [H-12](../01-analisis/02-analisis-refactorizacion.md#h-12). **Bloqueante estricto de la Fase 2.**
>
> Inventario completo y actualizado en [`selectores.txt`](../03-referencia/selectores.txt).

---

## Convención adoptada

`app-<dominio>-<pantalla>`, donde `<dominio>` es el directorio bajo `modules/` y `<pantalla>`
el propósito del componente. Los diálogos añaden el sufijo `-dialog`.

En `reportes/legacy` y `reportes/repositorio`, el dominio es el subdirectorio del reporte
(`rda`, `rma`, `agro-mix`, `mon-salidas`…), no `reportes`, que no distingue nada.

---

## Hallazgo que redujo el riesgo

Antes de renombrar se buscó cada selector como etiqueta en todo `src`:

```bash
grep -rEn "</?app-(buscador-kaypacha|...|usuarios-reportes-e)\b" src
```

**Cero resultados.** Los 30 componentes se instancian por ruta o por `MatDialog.open()`,
nunca como etiqueta en una plantilla. El renombrado se reduce por tanto a la línea del
decorador `@Component`, sin ningún consumidor que actualizar.

También se comprobó que ninguno de los 30 nombres nuevos colisionaba con los 310 selectores
ya existentes.

---

## Renombrados aplicados

14 selectores duplicados repartidos en 30 archivos.

| Selector duplicado | Archivo | Selector nuevo |
|---|---|---|
| `app-buscador-kaypacha` | `basenegativa/buscador/` | `app-basenegativa-buscador` |
| | `kaypacha/buscador/` | `app-kaypacha-buscador` |
| | `Kaypacha2/buscador/` | `app-kaypacha2-buscador` |
| | `Kaypacha3/buscador/` | `app-kaypacha3-buscador` |
| `app-calculadora-dialog-incentivos2` | `incentivos2/calculadora/` | `app-incentivos2-calculadora-dialog` |
| | `incentivos-a/calculadora/` | `app-incentivos-a-calculadora-dialog` |
| `app-cra-aut-tasa` | `legacy/comercial/rda/…` | `app-rda-cra-aut-tasa` |
| | `legacy/comercial/rma/…` | `app-rma-cra-aut-tasa` |
| `app-detalle2-incentivos4` | `incentivos4/detalle2/detalle2` | `app-incentivos4-detalle2` |
| | `incentivos4/detalle2/detalle2-dialog` | `app-incentivos4-detalle2-dialog` |
| `app-detalle-dialog` | `repositorio/agro-mix/detalle/` | `app-agro-mix-detalle-dialog` |
| | `repositorio/agro-mix-d/detalle/` | `app-agro-mix-d-detalle-dialog` |
| `app-detallek` | `ranking-k/detallek/` | `app-ranking-k-detallek` |
| | `reasignacion-cart-cap/detalle/` | `app-reasignacion-cart-cap-detalle` |
| `app-mapa-simple` | `repositorio/agro-mix/` | `app-agro-mix-mapa-simple` |
| | `repositorio/agro-mix-d/` | `app-agro-mix-d-mapa-simple` |
| `app-principal-incentivos2` | `incentivos2/principal/` | `app-incentivos2-principal` |
| | `incentivos3/principal/` ⚠️ | `app-incentivos3-principal` |
| `app-principal-reportes-k` | `ranking-k/principal/` | `app-ranking-k-principal` |
| | `reasignacion-cart-cap/principal/` | `app-reasignacion-cart-cap-principal` |
| `app-rep2-principal-mon-salidas` | `repositorio/mon-ran-camp/principal/` | `app-mon-ran-camp-principal` |
| | `repositorio/mon-salidas/principal/` | `app-mon-salidas-principal` |
| `app-transaccion` | `actividades/transaccion/` | `app-actividades-transaccion` |
| | `corresponsales/transaccion/` | `app-corresponsales-transaccion` |
| `app-transaccion-popup` | `actividades/…/transaccion-popup/` | `app-actividades-transaccion-popup` |
| | `corresponsales/…/transaccion-popup/` | `app-corresponsales-transaccion-popup` |
| `app-usuarios-framework-esg` | `framework-esg/usuarios/usuarios` | `app-framework-esg-usuarios` |
| | `framework-esg/usuarios/usuarios-dialog` | `app-framework-esg-usuarios-dialog` |
| `app-usuarios-reportes-e` | `reportes-e/usuarios/usuarios` | `app-reportes-e-usuarios` |
| | `reportes-e/usuarios/usuarios-dialog` | `app-reportes-e-usuarios-dialog` |

⚠️ `app-principal-incentivos2` declarado **dentro de `incentivos3`** es la huella del fork sin
renombrar que describe [H-08](../01-analisis/02-analisis-refactorizacion.md#h-08).

---

## Cómo se impide que vuelva a ocurrir

El Paso 6 del plan proponía la regla `@angular-eslint/component-selector`. **Esa regla no
detecta duplicados**: valida el prefijo y el estilo de cada selector por separado, y ninguna
regla de ESLint cruza información entre archivos — que es justo lo que un duplicado exige.
(La regla ya estaba activa en `.eslintrc.json` y, aun así, los 14 duplicados existían.)

La comprobación real es [`scripts/check-selectores.js`](../scripts/check-selectores.js):

```bash
npm run check:selectores
# check:selectores — 310 selectores, ninguno duplicado.
```

Devuelve código 1 y lista los archivos implicados si aparece cualquier duplicado. **Debe
ejecutarse en CI.**

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run check:selectores` | 310 selectores, 0 duplicados |
| `grep -rho "selector: *['\"][^'\"]*['\"]" src --include=*.ts \| sort \| uniq -d` | sin salida |
| `npm run build` | exit 0 — bundle inicial 2.73 MB / 573.41 kB, **idéntico** a antes |
| `npm test` | 13 verdes / 25 rojos — **idéntico** a antes (rojos preexistentes, Tarea 1.3) |
| `npm run lint:nuevos` | exit 0 |

---

## Desviación respecto al plan

El plan pedía un commit por dominio con `npm run build` y prueba manual entre cada uno
(14 ciclos). Se hizo **un solo ciclo de verificación** al final porque el cambio es
idéntico y del mismo tipo en los 30 archivos — una cadena literal en el decorador, sin
consumidores — y el bundle resultante es byte a byte equivalente en tamaño. Encadenar
14 builds completos no habría aportado información nueva.

La prueba manual por pantalla sigue siendo recomendable antes de fusionar, pero el riesgo
real es muy bajo: si un selector se hubiera roto, el compilador de plantillas de Angular lo
habría detectado en el build.
