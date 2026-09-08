---
name: mis-module-architecture
description: Estructura canónica de los módulos de negocio de MIS Host y sus reglas de aislamiento. Usar al crear un módulo, agregar una pantalla o ubicar un archivo, para respetar los sufijos canónicos (constantes/models/utils), la separación de capas y el enrutamiento lazy.
---

# Arquitectura de módulos — MIS Host

Cada módulo de `src/app/pages/modules/` encapsula un dominio de negocio con una división estricta de responsabilidades. Hoy son 12 módulos enlazados desde `app.routes.ts`, con **cero acoplamiento entre ellos**: esa es la invariante que esta guía protege.

---

## 1. Estructura

```text
src/app/pages/modules/<modulo>/
  <modulo>.routes.ts                   rutas lazy del módulo
  constantes/<modulo>.constantes.ts    cod_rep y configuración de backend
  models/<modulo>.model.ts             DTO del backend + modelo de vista
  utils/<modulo>.util.ts               mapeos y cálculos puros
  utils/<modulo>.util.spec.ts
  services/<modulo>.service.ts         fachada de datos con señales
  services/<modulo>.service.spec.ts
  ui/<pieza>/<pieza>.component.{ts,html}         presentacional
  components/<pantalla>/<pantalla>.component.{ts,html,spec.ts}   contenedor
```

### Los sufijos son verificados

| Carpeta | Sufijo | Frecuencia real en el repo |
|---|---|---|
| `constantes/` | `.constantes.ts` | 20 de 20 |
| `models/` | `.model.ts` (singular) | 95 de 98 |
| `utils/` | `.util.ts` | 21 de 21 |

No son `.constants.ts`, `.models.ts` ni `.mappers.ts`. El auditor lo marca (`--regla=nombres-canonicos`), y el motivo práctico es que un import a ciegas acierte.

### Excepción: el módulo `reportes`

`reportes` compone subdominios (Actividad Diaria, Actividad Mensual, Avance Comercial, Desarrollo Sostenible, Analista) y anida su propia estructura. Ahí las **pantallas hoja viven en `items/`**, no en `components/`:

```text
reportes/components/<subdominio>/components/<agrupacion>/
  constantes/  models/  services/
  items/<reporte>/<reporte>.component.{ts,html,spec.ts}
```

También tiene `reportes/ui/reporte-simple/`: bases reutilizables **dentro** del dominio de reportes, que no suben a `shared/ui/` porque conocen jerarquía y contratos de reporte.

---

## 2. Responsabilidad por capa

1. **`constantes/`** — códigos de reporte del backend (`export const COD_BASE_NEGATIVA = 'RS_BASE_NEG_01'`), tamaños de página, configuración. El código debe ser el real de backend, no uno inventado. Nunca URLs absolutas ni credenciales.

2. **`models/`** — dos contratos separados: el DTO tal como llega (nombres del backend, sin traducir) y el modelo que consume la vista. Esa separación es la que evita que renombrar una columna en Ant obligue a tocar plantillas.

3. **`utils/`** — funciones 100% puras: sin HttpClient, sin `inject()`, sin señales. Mapeo, formato de moneda, totales, agrupación, parseo de fechas. Es la capa donde un error cambia una cifra financiera sin romper nada visible, así que **cada archivo lleva su `.spec.ts`**.

4. **`services/`** — fachada reactiva con `providedIn: 'root'`, señales privadas expuestas como `asReadonly()`, y el borde de transporte. Habla con un `Mod*Service` de `core/winder/instances/`.

5. **`ui/`** — presentacionales. Reciben por `input()`, emiten por `output()`, no inyectan servicios de backend ni conocen `cod_rep`.

6. **`components/`** (o `items/` en reportes) — contenedores: inyectan el servicio, orquestan filtros y jerarquía, y conectan señales a la plantilla.

---

## 3. Reglas de aislamiento

Tres invariantes que el auditor trata como **error**, no como sugerencia:

| Regla | Qué prohíbe |
|---|---|
| `core-aislado` | `src/app/core/` no importa de `src/app/pages/` |
| `shared-aislado` | `src/app/shared/` no importa de `src/app/pages/modules/` |
| `modulos-desacoplados` | un módulo no importa las tripas de otro |

Lo que dos módulos necesiten compartir sube a `shared/` (si es UI o utilidad genérica) o a `core/` (si es transporte, sesión o un envoltorio del navegador). Nunca se importa de vecino a vecino.

Las **preferencias de interfaz** son la excepción que confirma la regla: no las comparten dos módulos, las manda el shell. Por eso viven en `pages/full-pages/layout/`, no en `core/`.

> Hay violaciones heredadas registradas en `governance/gobernanza.linea-base.json` (interceptores de `core` que importan servicios de `pages`, y el caché de jerarquía de `shared` que importa un modelo de `reportes`). Están congeladas para no bloquear el pipeline, pero **no son precedente**: el criterio es cero hallazgos nuevos.

También:

- **Enrutamiento lazy siempre**: `loadComponent` o `loadChildren`. Una ruta con `component:` arrastra la pantalla al bundle inicial, que ya tiene presupuesto de 1.5 MB de aviso y 2 MB de error.
- **`environment` se lee desde `core/`**: cada lectura directa fuera de ahí es un punto más que tocar el día que la configuración salga del bundle.

---

## 4. Crear un módulo

```bash
node governance/scripts/crear-modulo.mjs mi-modulo --title "Mi Módulo" --cod-rep RS_MI_MOD_01 --registrar-ruta
```

Genera la estructura completa con sufijos canónicos, servicio contra Winder/Ant, los cuatro estados usando los componentes de `shared/ui`, y specs que ya cubren datos, vacío, error y payload malformado. Con `--transporte=http` genera la variante contra API Host, solo si el dato no pasa por Winder.

Después:

1. Ajustar el DTO a las columnas reales del strand.
2. Confirmar el `cod_rep` con backend.
3. `npm run test:runner unit src/app/pages/modules/mi-modulo`
4. `npm run verify`
5. `npm run inventario` si cambiaron rutas.

Sin `--registrar-ruta`, enlazar a mano en `src/app/app.routes.ts`. **Los segmentos bajo `/app` no son libres**: deben coincidir carácter por carácter con el `act_sec` que devuelve el menú (por eso existen rutas como `Kaypacha__`, `incentivos3` y `cons_base_negativa`, que son compatibilidad con el sistema legado, no nombres a imitar).

---

## 5. Dónde va cada cosa

| Si es… | Va en |
|---|---|
| un cálculo puro que solo usa este módulo | `<modulo>/utils/` |
| un cálculo puro que usan varios módulos | `src/app/shared/utils/` |
| un componente visual sin dominio | `src/app/shared/ui/` |
| un componente que conoce `cod_rep` o jerarquía | `pages/modules/reportes/ui/` |
| transporte, sesión, guards, envoltorios del navegador | `src/app/core/` |
| preferencias de interfaz, anuncios, navegación del shell | `src/app/pages/full-pages/layout/` |
| aritmética de color y tokens | `src/app/theme/` |
| un token de color o de forma | `src/app/theme/tokens.css` |

Verificación: `node governance/scripts/validar-gobernanza.mjs --regla=core-aislado,shared-aislado,modulos-desacoplados,nombres-canonicos,rutas-lazy`
