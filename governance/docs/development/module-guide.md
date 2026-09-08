# Guía de módulos

Cada módulo de negocio separa responsabilidades:

```text
pages/modules/<modulo>/
  <modulo>.routes.ts    rutas lazy
  constantes/           códigos del backend y configuración   → *.constantes.ts
  models/               DTO del backend y modelo de vista     → *.model.ts
  utils/                mapeos y cálculos puros               → *.util.ts
  services/             fachada de datos con señales          → *.service.ts
  ui/                   piezas presentacionales del módulo
  components/           pantallas (contenedores)
```

Los sufijos son verificados por `validar-gobernanza.mjs`. Detalle y excepciones en [convenciones de nombres](./naming-conventions.md).

**Excepción de `reportes`**: ese módulo compone subdominios, así que usa `components/` para agrupar y **`items/` para las pantallas hoja**. También mantiene `reportes/ui/reporte-simple/`, bases reutilizables dentro del dominio de reportes que no suben a `shared/ui/` porque conocen jerarquía y contratos.

## Responsabilidad por capa

- **`constantes/`** — `cod_rep` reales del backend, tamaños de página. Nunca URLs absolutas ni credenciales.
- **`models/`** — DTO con los nombres del backend, separado del modelo que consume la vista.
- **`utils/`** — funciones puras, sin `inject()` ni HTTP. Cada archivo con su `.spec.ts`.
- **`services/`** — señales privadas expuestas como `asReadonly()`, y el borde de transporte contra un `Mod*Service`.
- **`ui/`** — reciben por `input()`, emiten por `output()`, no conocen `cod_rep`.
- **`components/`** — inyectan el servicio y conectan señales a la plantilla.

## Aislamiento

`core` no importa de `pages`; `shared` no importa de `pages/modules`; un módulo no importa las tripas de otro. Lo compartido sube a `shared/` o `core/`. Las tres son reglas de nivel error en el auditor.

## Crear un módulo

```bash
node governance/scripts/crear-modulo.mjs mi-modulo --title "Mi Módulo" --cod-rep RS_MI_MOD_01 --registrar-ruta
```

Genera la estructura con los sufijos canónicos, un servicio contra Winder/Ant, los cuatro estados con los componentes de `shared/ui` y specs que cubren datos, vacío, error y payload malformado.

Los segmentos bajo `/app` deben coincidir con el `act_sec` del menú: no se eligen libremente.

## Agregar un reporte

Documentar el contrato, registrar `cod_rep`, definir modelos y mapeos, implementar el servicio, crear la pantalla y agregar pruebas unitarias y E2E. La secuencia detallada está en [report creation guide](./report-creation-guide.md) y la guía operativa en [`skills/mis-reportes-bloques`](../../skills/mis-reportes-bloques/SKILL.md).
