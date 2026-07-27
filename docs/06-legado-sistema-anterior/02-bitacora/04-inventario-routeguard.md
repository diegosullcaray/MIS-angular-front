# Inventario de cobertura de `RouteGuard`

> Tarea 0.5 del [plan](../01-analisis/03-plan-refactorizacion.md#tarea-05--aplicar-routeguard-a-todas-las-rutas-de-negocio).
> **Estado: bloqueada a la espera de verificación con backend/negocio.**

---

## Situación

`RouteGuard` autoriza comparando la URL destino contra `NavigationService.routesArray`,
que se construye con los `act_sec` que envía el backend en el menú del usuario:

```typescript
// route-guard.guard.ts:24
let v = this.navService.routesArray.includes(state.url);
```

De las **21 rutas de negocio** bajo `/app`, solo **2** aplican el guard. En 4 está
explícitamente comentado. Las 15 restantes nunca lo tuvieron.

La protección efectiva hoy es el menú: si una sección no aparece, el usuario no llega
por navegación — **pero escribiendo la URL a mano sí entra**.

---

## Inventario

| # | Ruta | Guard actual | Módulo |
|---|---|---|---|
| 1 | `/app/desktop` | — | `DesktopComponent` (destino de redirección) |
| 2 | `/app/reportes` | — | `Rep01Module` |
| 3 | `/app/incentivos3` | — | `Incentivos3Module` |
| 4 | `/app/incentivos4` | — | `Incentivos4Module` |
| 5 | `/app/incentivos-a` | — | `IncentivosAModule` |
| 6 | `/app/corresponsales` | — (`AuthGuard` comentado) | `CorresponsalesModule` |
| 7 | `/app/presupuesto` | ✅ **`RouteGuard`** | `PresupuestoModule` |
| 8 | `/app/imparables` | — | `DummyComponent` |
| 9 | `/app/actividades` | ✅ **`RouteGuard`** | `ActividadesModule` |
| 10 | `/app/kaypacha` | ⚠️ comentado | `KaypachaModule` |
| 11 | `/app/administracion` | — | `AdministracionModule` |
| 12 | `/app/Kaypacha_` | ⚠️ comentado | `Kaypacha2Module` |
| 13 | `/app/Kaypacha__` | ⚠️ comentado | `Kaypacha3Module` |
| 14 | `/app/cons_base_negativa` | ⚠️ comentado | `BaseNegativaModule` |
| 15 | `/app/dashboards` | — | `ReportesEModule` |
| 16 | `/app/ranking-k` | — | `RankingKModule` |
| 17 | `/app/esg` | — | `FrameworkEsgModule` |
| 18 | `/app/analista` | — | `AnalistaModule` |
| 19 | `/app/sistematica` | — | `SistematicaModule` |
| 20 | `/app/prospecto` | — | `ProspectoCorModule` |
| 21 | `/app/reasignacion-cart-cap` | — | `ReasignacionCartCapModule` |

---

## Por qué esta tarea no se ejecuta sin verificación previa

Activar el guard es **una línea por ruta**, pero el riesgo no está en el código:

1. **`RouteGuard` compara la URL completa, no el prefijo.** En una ruta padre con hijos
   perezosos, `state.url` es la URL final (`/app/reportes/repositorio/asesor`), no
   `/app/reportes`. El guard solo autoriza si el backend envía **ese `act_sec` exacto**.
   Si el menú guarda rutas de sección pero el usuario navega a una subruta más profunda,
   el guard deniega y redirige a `homePage`.

2. **No hay forma de verificarlo desde el frontend.** Hace falta el `user_mr` real de
   varios perfiles de producción para saber qué `act_sec` llegan y con qué formato.

3. **El coste del error es asimétrico.** Activarlo de más deja a usuarios legítimos fuera
   de secciones de trabajo en una entidad financiera. Dejarlo como está mantiene el estado
   actual, que ya lleva tiempo en producción.

Que 4 rutas lo tengan **explícitamente comentado** sugiere además que en su momento se
intentó activarlas y se revirtió — probablemente por el problema del punto 1.

---

## Qué hace falta para desbloquear

- [ ] Volcado del `user_mr` de al menos 3 perfiles distintos (asesor, supervisor, administrador)
- [ ] Confirmar el formato de `act_sec`: ¿rutas de sección (`/app/reportes`) o rutas completas
      hasta la pantalla (`/app/reportes/repositorio/asesor`)?
- [ ] Averiguar por qué se comentó el guard en `kaypacha`, `Kaypacha_`, `Kaypacha__` y
      `cons_base_negativa`

Con esos datos, la decisión es directa:

- **Si `act_sec` contiene rutas completas** → activar `RouteGuard` en las 20 rutas de negocio
  (todas menos `desktop`).
- **Si `act_sec` contiene solo rutas de sección** → cambiar `RouteGuard` para comparar por
  prefijo (`routesArray.some(r => state.url.startsWith(r))`) antes de activarlo en más rutas.
  Es un cambio pequeño, pero altera la semántica de autorización y necesita su propio test.

---

## Alternativa recomendada a medio plazo

La Fase 5.2 del plan ([H-23](../01-analisis/02-analisis-refactorizacion.md#h-23)) elimina este problema de
raíz: si las rutas se **generan** desde el menú del backend en lugar de declararse
estáticamente, una ruta no autorizada simplemente no existe en el router y `RouteGuard`
deja de ser necesario. Esta tarea 0.5 es una mitigación provisional hasta llegar ahí.
