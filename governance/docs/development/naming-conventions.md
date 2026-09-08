# Convenciones de nombres

Verificadas contra el código, no propuestas. Un import a ciegas tiene que acertar.

## Sufijos por carpeta

| Carpeta | Sufijo | Adopción real |
|---|---|---|
| `constantes/` | `.constantes.ts` | 20 / 20 |
| `models/` | `.model.ts` (singular) | 95 / 98 |
| `utils/` | `.util.ts` | 21 / 21 |
| `services/` | `.service.ts` | convención de Angular |
| componentes | `.component.{ts,html,css,spec.ts}` | convención de Angular |
| rutas | `.routes.ts` | 100% |

No son `.constants.ts`, `.models.ts` ni `.mappers.ts`. Lo verifica `validar-gobernanza.mjs --regla=nombres-canonicos`.

Excepciones toleradas: `index.ts` de barril y sufijos descriptivos ya establecidos como `.columnas.ts` en `models/` de reportes.

## Estructura de un módulo

```text
pages/modules/<modulo>/
  <modulo>.routes.ts
  constantes/  models/  utils/  services/  ui/  components/
```

En el módulo `reportes` las pantallas hoja van en `items/` en lugar de `components/`, porque `components/` ya se usa para agrupar subdominios.

## Identificadores

- **Símbolos TypeScript en inglés o español**, siguiendo el archivo vecino. No mezclar dentro de un mismo archivo.
- **Términos del contrato del backend se conservan tal cual**: `cod_rep`, `tip_cod`, `cod_rel`, `fec`, `fecha`, `pagen`. No se traducen ni se abrevian, y crear un sinónimo exige registrar la equivalencia en el [glosario](../data/glossary.md).
- **Constantes de reporte**: `COD_<DOMINIO>` con el valor real del backend (`export const COD_BASE_NEGATIVA = 'RS_BASE_NEG_01'`).
- **DTO vs modelo de vista**: el DTO usa los nombres del backend; el modelo de vista usa lenguaje de dominio. La separación es lo que evita que un renombre en Ant llegue hasta las plantillas.

## Rutas

Los segmentos bajo `/app` **no son libres**: deben coincidir carácter por carácter con el `act_sec` que devuelve el menú (`list_sec`), heredado del sistema legado STG. Por eso existen `Kaypacha__`, `incentivos3` y `cons_base_negativa`.

Son nombres de compatibilidad, no un estilo a imitar en APIs nuevas.

Restricciones vigentes:

- `analista/categorizacion` debe declararse **antes** que `analista`.
- `dashboard` (Home) y `dashboards` (Power BI) son dominios distintos.

## Tokens de diseño

`--mis-<área>-<variante>` en `src/app/theme/tokens.css`: `--mis-text-primary`, `--mis-surface`, `--mis-border-control`, `--mis-radius-lg`. Se consumen como `text-[var(--mis-*)]` o con `style`; no existen clases utilitarias semánticas.

## Pruebas

`<archivo>.spec.ts` junto al archivo probado. Los specs **no importan de `'vitest'`**: el proyecto usa globales.
