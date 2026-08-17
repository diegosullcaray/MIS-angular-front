# Auditoría de Arquitectura — MIS Host

Revisión completa del código, la configuración de build, el modelo de seguridad y el
rendimiento del portal MIS Host (Financiera Confianza), realizada el **14 de agosto de 2026**
sobre la rama `main` (commit `04aa220`, 161 commits de historia).

## Documentos

| Documento | Contenido |
|---|---|
| [`01-mapa-del-sistema.md`](./01-mapa-del-sistema.md) | Cómo está construido el sistema hoy: arranque, capas, flujo de autenticación, protocolo Winder/Ant, inventario de módulos y métricas del código |
| [`02-hallazgos.md`](./02-hallazgos.md) | Los 21 hallazgos ordenados por severidad, cada uno con evidencia verificada, impacto y corrección propuesta |
| [`03-plan-de-accion.md`](./03-plan-de-accion.md) | Plan por fases con esfuerzo estimado y criterios de aceptación |

## Estado del sistema en una frase

La aplicación está **bien construida a nivel de código** —Angular 22 zoneless, señales,
carga diferida por módulo, 1013 pruebas unitarias, comentarios que explican el *porqué*— pero
tiene **fallas graves en la capa de configuración y en el modelo de seguridad** que la hacen
insegura para operar en producción tal como está.

## Métricas verificadas

| Métrica | Valor |
|---|---|
| Archivos TypeScript | 482 (35 583 líneas) |
| Componentes | 107 |
| Plantillas HTML | 106 |
| Pruebas unitarias | 1013 en 171 archivos — **22 fallando** |
| Pruebas E2E (Playwright) | 14 especificaciones |
| Bundle inicial | 595,73 kB sin comprimir / 110,22 kB transferidos |
| Fragmentos diferidos | 114 |
| Presupuesto de bundle | **Excedido en 95,73 kB** (límite 500 kB) |
| Componentes con OnPush | **0 de 107** |
| Configuración de ESLint | **No existe** |
| Pipeline de CI/CD | **No existe** |

## Resumen de hallazgos

| Severidad | Cantidad | Los más importantes |
|---|---|---|
| **Crítico** | 4 | Suplantación de identidad en producción; secretos AES en el bundle; cifrado con IV fijo; autorización solo en el cliente |
| **Alto** | 6 | Sin `strict` en TypeScript; sin ESLint; sin CI; 22 pruebas rojas que no bloquean nada; sin CSP; OAuth con flujo implícito |
| **Medio** | 8 | Singleton con estado mutable en `WinderService`; sin OnPush; overlay de carga global; menú que no reintenta; entornos divergentes |
| **Bajo** | 3 | Código legado dentro del repo; README genérico; sin monitorización |

## Estado de la corrección

**Fase 0 aplicada el 15/08/2026.** Los hallazgos **C-1** y **M-6** están corregidos y
verificados; el resto sigue abierto. Ver [`03-plan-de-accion.md`](./03-plan-de-accion.md).

Lo que se hizo: se creó el contrato `Environment` que tipa ambos archivos de entorno, se
activó `fileReplacements` en `angular.json`, se sustituyó el guardián
`!environment.production` por `isDevMode()` —una condición de compilación en lugar de un
dato— y se añadió `npm run verify:bundle`, que falla el build si vuelve a filtrarse
configuración de desarrollo.

La capacidad de probar con distintos usuarios en desarrollo **se mantiene**, y ahora se cambia
de perfil desde `localStorage` sin editar archivos. Ver
[C-1](./02-hallazgos.md#c-1--suplantación-de-identidad-en-el-build-de-producción).
