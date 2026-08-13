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
│   └── 05-arquitectura-frontend-actual.md     cómo está construido el código HOY: arranque,
│                                               login, guards, convención de módulo, cómo se
│                                               obtienen los datos (protocolo Winder/Ant)
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
| [`07-modulos/`](./07-modulos/) | Fuente del sistema legado STG (`analista`, `incentivos3`, `presupuesto`, `reportes`) — referencia de solo lectura para migrar cada módulo, no forma parte de la app actual |

Cada módulo migrado en `src/app/pages/modules/<modulo>/` puede tener además su propio
`README.md` con la funcionalidad específica de esa vista (ver
[`actividades/README.md`](../src/app/pages/modules/actividades/README.md) como ejemplo).
