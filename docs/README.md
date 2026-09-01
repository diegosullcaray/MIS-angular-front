# Documentación — MIS Host

Portal administrador (MIS Host) de Financiera Confianza: Angular 22 Zoneless + PrimeNG +
Tailwind v4. Ver [`01-canon/00-vision-producto.md`](./01-canon/00-vision-producto.md) para
la visión de producto antes de leer cualquier otro documento.

## Estructura

```
docs/
├── README.md                              este índice
├── 01-canon/
│   └── 00-vision-producto.md                 qué es el producto y su identidad de interacción
├── 02-arquitectura/
│   ├── 05-arquitectura-frontend-actual.md     cómo está construido el código HOY: arranque,
│   │                                           login, guards, convención de módulo, cómo se
│   │                                           obtienen los datos (protocolo Winder/Ant)
│   ├── 06-filtros-jerarquia-organizativa.md   selector de jerarquía en cascada, fallback de fecha,
│   │                                           persistencia visual [class.hidden] y loader global
│   ├── 07-guia-estilos-kpis-reportes.md       estándar visual de Tarjetas KPI: Dark Mode, Knob,
│   │                                           flechas verde/roja, deltas y responsive design
│   └── 08-preferencias-y-cierre-de-sesion.md  preferencias de interfaz (fondo, acento, tema,
│                                               estructura del menú, anuncios) y el borrado total
│                                               del navegador al cerrar sesión
├── 03-auditoria/                            auditoría de arquitectura, seguridad y rendimiento
│   ├── 01-mapa-del-sistema.md                 capas, flujo de auth, protocolo Winder, métricas
│   ├── 02-hallazgos.md                        21 hallazgos por severidad, con evidencia
│   └── 03-plan-de-accion.md                   plan por fases con esfuerzo y criterios
└── 07-modulos/                              código fuente del sistema legado STG por módulo
    ├── analista/                               (`stg-app-mis-r22`), conservado como referencia
    ├── incentivos3/                            al migrar cada módulo al Host — no es código
    ├── presupuesto/                            del proyecto actual, no se ejecuta ni se importa
    └── reportes/
```

## Índice

| Documento | Contenido |
|---|---|
| [`01-canon/00-vision-producto.md`](./01-canon/00-vision-producto.md) | **Empezar aquí.** Qué es el MIS Host y su identidad de interacción (macOS-like) |
| [`02-arquitectura/05-arquitectura-frontend-actual.md`](./02-arquitectura/05-arquitectura-frontend-actual.md) | Arquitectura real del código: punto de entrada, login → guards → shell, estructura de carpetas, convención de un módulo de negocio, protocolo Winder/Ant para obtener datos |
| [`02-arquitectura/06-filtros-jerarquia-organizativa.md`](./02-arquitectura/06-filtros-jerarquia-organizativa.md) | Componente `HierSelectorComponent`: flujo reactivo en cascada, auto-selección de Nivel 1, fallback de fecha de corte, persistencia con `[class.hidden]`, botón Limpiar e integración con `LoadingService` |
| [`02-arquitectura/07-guia-estilos-kpis-reportes.md`](./02-arquitectura/07-guia-estilos-kpis-reportes.md) | **Estándar de Tarjetas KPI / Métricas:** tokens Dark Mode, Knobs circulares, chips de tendencia con flechas verde/roja, deltas en pbs y responsive design |
| [`02-arquitectura/08-preferencias-y-cierre-de-sesion.md`](./02-arquitectura/08-preferencias-y-cierre-de-sesion.md) | **Preferencias de interfaz:** capas del módulo (dominio/aplicación/infraestructura), qué se guarda en `localStorage`, cómo se aplican fondo y acento por variables CSS, los cuatro modos de menú al estilo PrimeNG, la regla anti-spam de los anuncios y el borrado total al cerrar sesión |
| [`03-auditoria/`](./03-auditoria/README.md) | **Auditoría del 14/08/2026.** Estado real del sistema: mapa de capas, 21 hallazgos de seguridad, robustez y rendimiento con evidencia verificada, y plan de acción por fases. Empezar por su `README.md` |
| [`07-modulos/`](./07-modulos/) | Fuente del sistema legado STG (`analista`, `incentivos3`, `presupuesto`, `reportes`) — referencia de solo lectura para migrar cada módulo, no forma parte de la app actual |

Cada módulo migrado en `src/app/pages/modules/<modulo>/` puede tener además su propio
`README.md` con la funcionalidad específica de esa vista (ver
[`actividades/README.md`](../src/app/pages/modules/actividades/README.md) como ejemplo).
