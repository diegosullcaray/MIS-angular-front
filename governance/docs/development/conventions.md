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
- Conservar la estrategia predeterminada de Angular 22 (OnPush), sin declaración redundante. Zoneless y estrategia del componente son conceptos distintos; ver [ADR-0001](../architecture/adr/ADR-0001-zoneless-sin-onpush.md).
- Servicios: señales privadas y lectura pública con `asReadonly()`. No confundir `readonly` de una propiedad con una señal no modificable.
- Para estado de pantalla, proporcionar en componente/ruta o limpiar al salir. `root` requiere un motivo (infraestructura o selección compartida entre rutas) e invalidación por identidad/permisos/corte.
- Cancelar la consulta anterior al cambiar filtros y al destruir el consumidor. `takeUntilDestroyed` no evita por sí solo respuestas fuera de orden.

### Datos

- El transporte es Winder/Ant a través de los `Mod*Service` de `core/winder/instances/`. **No hay API REST**: ver [transporte Winder](../data/contracts/winder-transport.md).
- El error nunca se convierte en tabla vacía. `catchError(() => of([]))` está prohibido en servicios de pantalla.
- El caché debe incluir identidad, jerarquía y fecha de corte cuando esos datos cambien el resultado.
- No guardar secretos, tokens ni datos reales en código ni en fixtures.
- Backend, OAuth y Winder congelados: preservar strands, códigos, parámetros, fechas y excepciones de vacío. Las propuestas de backend no autorizan cambios de contrato.
- Payload inválido no es vacío salvo excepción documentada y caracterizada. Conversión numérica explícita; comprobar importes exactos, no solo que sean positivos.
- Metadatos de fila/columna en el adaptador del reporte; las tablas compartidas no conocen nombres del negocio.

### Estilos

- Color por token `--mis-*`, con `text-[var(--mis-*)]` o `style`. No existen clases utilitarias semánticas; un hex fijo no acompaña al tema oscuro.
- Los cuatro estados con los componentes de `shared/ui`: el error se evalúa **antes** que el vacío.
- `ReporteSimpleBase` conserva error y cancela; enlazar `[error]` en `app-reporte-simple`. Las tablas compartidas resuelven carga/vacío, no errores de consulta. Un toast no sustituye el estado persistente.
- Lucide para UI nueva del Host; conservar PrimeIcons donde PrimeNG/legacy ya lo requiere. No reescribir iconos sin beneficio funcional.
- Mantener comentarios que expliquen restricciones/contratos, no narraciones que repitan métodos. Formatear archivos tocados con Prettier (`printWidth: 100`).

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

## Fuente y mantenimiento

Una regla tiene una ubicación canónica. Skills y roles enlazan la referencia y
añaden solo pasos propios. Cifras actuales en inventarios generados, no en guías.
El código describe lo implementado, pero un defecto no reemplaza un contrato o ADR:
registrar y evaluar discrepancias. Etiquetar propuesta/pendiente/histórico desde el encabezado.
