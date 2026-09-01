# Documentación — MIS Host

Portal administrador de Financiera Confianza: Angular 22 zoneless, PrimeNG y
Tailwind v4.

## Por dónde empezar

| Si querés… | Leé |
|---|---|
| Entender qué es el producto | [`01-canon/00-vision-producto.md`](./01-canon/00-vision-producto.md) |
| Entender cómo está construido | [`02-arquitectura/01-como-funciona-el-sistema.md`](./02-arquitectura/01-como-funciona-el-sistema.md) |
| Agregar o tocar un módulo | [`02-arquitectura/02-anatomia-de-un-modulo.md`](./02-arquitectura/02-anatomia-de-un-modulo.md) |
| Crear la tabla de un reporte | [`02-arquitectura/03-tablas-de-reportes.md`](./02-arquitectura/03-tablas-de-reportes.md) |

## Índice

### 01 · Canon

| Documento | Contenido |
|---|---|
| [`00-vision-producto.md`](./01-canon/00-vision-producto.md) | Qué es el MIS Host y su identidad de interacción |

### 02 · Arquitectura

| Documento | Contenido |
|---|---|
| [`01-como-funciona-el-sistema.md`](./02-arquitectura/01-como-funciona-el-sistema.md) | Arranque, login y guards, estructura de carpetas, el protocolo Winder/Ant y sus cuatro motores de reporte |
| [`02-anatomia-de-un-modulo.md`](./02-arquitectura/02-anatomia-de-un-modulo.md) | `constantes/`, `models/`, `utils/`, `services/`, `items/`: qué va en cada carpeta y cómo se agrega un reporte |
| [`03-tablas-de-reportes.md`](./02-arquitectura/03-tablas-de-reportes.md) | De la respuesta del backend a la tabla en pantalla: los dos contratos, semáforos, columnas fijas, coloración condicional y KPIs |
| [`04-filtros-jerarquia-organizativa.md`](./02-arquitectura/04-filtros-jerarquia-organizativa.md) | `HierSelectorComponent`: cascada, fallback de fecha de corte y loader global |
| [`05-guia-estilos-kpis-reportes.md`](./02-arquitectura/05-guia-estilos-kpis-reportes.md) | Estándar visual de las tarjetas KPI |
| [`06-preferencias-y-cierre-de-sesion.md`](./02-arquitectura/06-preferencias-y-cierre-de-sesion.md) | Preferencias de interfaz (fondo, acento, menú, anuncios) y el borrado total al cerrar sesión |

### 03 · Seguridad

| Documento | Contenido |
|---|---|
| [`README.md`](./03-auditoria/README.md) | Estado del backlog de seguridad |
| [`02-hallazgos.md`](./03-auditoria/02-hallazgos.md) | Los hallazgos con su evidencia, impacto y corrección propuesta |
| [`03-plan-de-accion.md`](./03-auditoria/03-plan-de-accion.md) | Plan por fases con esfuerzo y criterios de aceptación |

### Material de referencia

| Carpeta | Qué es |
|---|---|
| [`07-modulos/`](./07-modulos/) | Código fuente del sistema legado STG, conservado como referencia al migrar cada módulo. **No es código de este proyecto**: no se ejecuta ni se importa |
| [`08-otros/`](./08-otros/) | Modelo de datos del legado e informe técnico de reingeniería |
| [`10-migraciones/`](./10-migraciones/) | Registro de lo migrado y la sintaxis del mapa de reportes del legado |

## Cómo se mantiene esta documentación

- **Un documento que ya no describe el código se borra**, no se deja "por si
  acaso". Un mapa desactualizado hace más daño que no tener mapa.
- Lo que cambia con cada commit —inventario de pantallas, número de tests,
  métricas— no va en un `.md`: se lee del código.
- Lo que sí va: el **porqué** de una decisión, los contratos con el backend que
  no se deducen del código, y las trampas que ya nos costaron un bug.
