# Convenciones de desarrollo

## Antes de editar

1. Ubicar ruta, componente, servicio y modelo dueño.
2. Confirmar el contrato del backend, el nodo de jerarquía y la fecha de corte.
3. Buscar una prueba vecina y una pantalla con el mismo patrón. **Copiar el patrón existente antes que inventar uno nuevo.**

## Durante el cambio

### Arquitectura

- Mantener `core` libre de dependencias de pantallas.
- Mantener `shared/ui` libre de dependencias de dominios.
- Un módulo no importa las tripas de otro: lo compartido sube a `shared/` o `core/`.
- Separar constantes de backend, modelos, mapeos puros y transporte.
- Rutas siempre lazy (`loadComponent` / `loadChildren`).
- Leer `environment` desde `core/`.

### Angular

- Estado en señales: `signal`, `computed`, `linkedSignal`, `effect` solo para sincronizar con el exterior.
- `input()` / `output()` / `viewChild()`, nunca los decoradores.
- Inyección con `inject()`.
- Control de flujo con `@if` / `@for` / `@switch`; `@for` siempre con `track` de identidad estable.
- `standalone: true` explícito, siguiendo la convención local.
- **Sin `ChangeDetectionStrategy.OnPush`**: el proyecto es zoneless y ninguno de sus 236 componentes lo declara. Sin `zone.js` no hay barrido global que `OnPush` pueda acotar, así que agregarlo no cambia el comportamiento e introduce inconsistencia. Ver [`skills/angular-mis-zoneless`](../../skills/angular-mis-zoneless/SKILL.md).

### Datos

- El transporte es Winder/Ant a través de los `Mod*Service` de `core/winder/instances/`. **No hay API REST**: ver [transporte Winder](../data/contracts/winder-transport.md).
- El error nunca se convierte en tabla vacía. `catchError(() => of([]))` está prohibido en servicios de pantalla.
- El caché debe incluir identidad, jerarquía y fecha de corte cuando esos datos cambien el resultado.
- No guardar secretos, tokens ni datos reales en código ni en fixtures.

### Estilos

- Color por token `--mis-*`, con `text-[var(--mis-*)]` o `style`. No existen clases utilitarias semánticas; un hex fijo no acompaña al tema oscuro.
- Los cuatro estados con los componentes de `shared/ui`: el error se evalúa **antes** que el vacío.

## Antes de cerrar

```bash
npm run verify                                      # gobernanza, docs, tokens, inventarios
node governance/scripts/ejecutar-pruebas.mjs unit <ruta tocada>
```

- Ejecutar E2E si cambió ruta, shell, permisos, flujo de datos o layout.
- `npm run inventario` si cambiaron rutas o cantidad de pruebas.
- Actualizar el contrato y la documentación en el mismo cambio.
- Revisar estados vacío, error, reintento, responsive y accesibilidad.

Detalle de compuertas y reglas: [quality gates](./quality-gates.md).
