# 01 — Product Requirements Document (PRD)
> **Proyecto:** MIS - Management Information System  
> **Documentacion:** [Indice](../README.md) | [00 Vision](../01-canon/00-vision-producto.md) | [01 PRD](../01-canon/01-prd.md) | [02 UX/App Flow](../01-canon/02-ux-app-flow.md) | [03 TRD](../01-canon/03-trd.md) | [Backend Schema](../02-arquitectura/01-backend-schema.md) | [DB Schema](../02-arquitectura/02-database-schema.sql) | [Guia Sistemas Hijos](../02-arquitectura/03-guia-sistemas-hijos.md) | [Figma Guide](../02-arquitectura/04-design-system-figma-guide.md) | [Plan de implementacion (HU)](../03-plan-implementacion/README.md)
> **Tipo:** Panel Administrador Centralizador (Micro-Frontend Host + Remotes)  
> **Versión:** 1.2.0  
> **Fecha:** 2026-07-12  

---

## 1. Problema de Negocio

Actualmente, operamos con múltiples subsistemas de gestión empresarial que se encuentran desconectados entre sí, lo que obliga a los usuarios a acceder a diferentes plataformas para realizar sus tareas diarias. Esta fragmentación genera ineficiencias operativas, duplicidad de esfuerzos y dificultades en el seguimiento y control de las operaciones. Además, el desarrollo y despliegue de mejoras se ve obstaculizado por la naturaleza monolítica de los sistemas actuales, lo que limita nuestra agilidad para responder a las necesidades del negocio y mantenernos competitivos en el mercado.

- Fricción operativa: los usuarios deben cambiar de contexto entre aplicaciones.
- Duplicación de lógica de autenticación, navegación y estilos.
- Despliegues monolíticos que bloquean la entrega continua de mejoras en subsistemas específicos.

---

## 2. Objetivo y Valor de Negocio

> **"Desarrollar un panel administrador centralizador (tipo sistema NES) que unifique la gestión empresarial."**
>
> En una frase de producto (ver [`00-vision-producto.md`](./00-vision-producto.md)): el
> Host es un **router de sistemas** — no aloja lógica de negocio, decide y carga qué
> sistema ve cada usuario — con una capa de usabilidad inspirada en **macOS**.

| Pilar | Descripción |
|---|---|
| **Centralización** | Un único punto de entrada (`Host`) para todos los subsistemas de gestión. |
| **Escalabilidad** | Cada subsistema (`Remote`) se desarrolla, versiona y despliega de forma completamente independiente. |
| **Continuidad** | El portal central (`Host`) permanece activo aunque un subsistema esté en mantenimiento o falle. |
| **Transparencia** | Los subsistemas se embeben dentro del shell sin que el usuario perciba el cambio de contexto. |

### Valor Principal

El sistema **Host administra la estructura principal y seguridad**, mientras **embebe otros subsistemas (Remotes) de forma transparente**. Esto permite:

1. Escalar el desarrollo asignando equipos dedicados por subsistema.
2. Realizar despliegues independientes sin afectar el portal central.
3. Gestionar el estado compartido mínimo (usuario activo, remotes cargados) a través de un contrato de Signals bien definido.

---

## 3. Alcance del MVP

### ✅ Dentro del Alcance

- **Shell Host Angular**: estructura visual de 3 columnas (Col 1: tira de sistemas azul, Col 2: panel de rutas gris, contenido principal).
- **Carga dinámica de Remotes**: integración de al menos un subsistema embebido a través de Native Federation.
- **Estado compartido mínimo**: servicio Singleton con Signals de solo lectura para comunicar Host ↔ Remote.
- **Estados de UI**: loading skeletons (`@defer`), estado de error elegante cuando un Remote no está disponible.
- **Autenticación con MFA**: formulario de login con contraseña seguido de un paso de verificación de identidad OTP de 6 dígitos.
- **Gestión de Accesos (IAM)**: módulo administrativo para crear/editar/desactivar usuarios, definir roles y asignar permisos de acceso a subsistemas (Remotes) por rol.
- **Gestión de Sistemas**: módulo administrativo para registrar los sistemas embebibles (Remotes), definir su **estructura jerárquica** (`Sistema → Secciones → Subsecciones → Módulos`) y configurar los **permisos de cada rol a nivel de módulo**.
- **Diseño Segmentado (SelectButton)**: pantallas de edición y detalle subdivididas en paneles lógicos mediante el control segmentado de PrimeNG para evitar la saturación visual.

### ❌ Fuera del Alcance (MVP)

- Autenticación/SSO externa (MFA local en el MVP).
- Modo oscuro / temas personalizables.
- Auditoría y trazabilidad detallada de acciones por usuario (segunda fase).

---

## 4. Usuarios Objetivo

| Perfil | Descripción | Capacidades Clave |
|---|---|---|
| **Administrador del Sistema** | Perfil técnico-administrativo responsable de la configuración global de la plataforma MIS. | Crear / editar / desactivar **usuarios**, definir y asignar **roles**, habilitar o restringir el acceso a **subsistemas (Remotes)** por rol, y gestionar los **sistemas** registrados. |
| **Administrador General** | Perfil operativo con acceso completo a todos los módulos habilitados para su organización. | Accede al 100% del Host y todos los Remotes asignados a su rol. No puede modificar la configuración de usuarios ni permisos. |
| **Supervisor de Área** | Perfil operativo con acceso restringido a los subsistemas de su área funcional. | Accede únicamente a los Remotes que el Administrador del Sistema le haya asignado. |

### 4.1 Matriz de Permisos por Módulo

| Módulo / Acción | Administrador del Sistema | Administrador General | Supervisor de Área |
|---|:---:|:---:|:---:|
| Gestión de Usuarios | ✅ CRUD | ❌ | ❌ |
| Gestión de Roles | ✅ CRUD | ❌ | ❌ |
| Gestión de Sistemas (registro, estructura y permisos) | ✅ CRUD | ❌ | ❌ |
| Asignación de Acceso a Subsistemas | ✅ | ❌ | ❌ |
| Mi espacio (Dashboard del Host) | ✅ | ✅ | ✅ |
| Subsistemas / Remotes | ✅ Todos | ✅ Asignados | ✅ Asignados |

---

## 5. Reglas de Negocio Críticas

> Estas reglas son **no negociables** y deben implementarse en la primera versión.

| # | Regla |
|---|---|
| RN-01 | El **Host es el responsable absoluto** de la navegación global y el marco visual. Ningún Remote puede alterar el header, sidebar o la URL base. |
| RN-02 | Los subsistemas embebidos deben funcionar de manera **aislada**: no tienen dependencias rígidas con el Host. |
| RN-03 | La comunicación Host ↔ Remote se realiza **únicamente** a través de un estado global ligero (Signals de solo lectura). |
| RN-04 | **Se prohíbe el uso de `iframes`** para embeber subsistemas. Solo se permite `loadRemoteModule` de Native Federation. |
| RN-05 | La carga de un Remote **no debe recargar el navegador** ni generar conflictos de rendimiento en la interfaz. |
| RN-06 | Si un Remote está caído o inaccesible, el sistema debe mostrar un **estado de error elegante** sin interrumpir el funcionamiento del Host. |
| RN-07 | Los formularios de edición de accesos se presentan divididos por pestañas con `SelectButton` para facilitar la usabilidad en pantallas pequeñas. |

---

## 6. Criterios de Aceptación

| ID | Criterio | Prioridad |
|---|---|---|
| CA-01 | El sistema administrador **carga dinámicamente al menos un subsistema embebido** sin recargar el navegador. | 🔴 Crítico |
| CA-02 | La carga del Remote **no utiliza iframes**. | 🔴 Crítico |
| CA-03 | No se generan conflictos de rendimiento al navegar entre vistas propias del Host y vistas de un Remote. | 🔴 Crítico |
| CA-04 | Cuando un Remote no está disponible, se renderiza un componente de error contextual sin romper la shell. | 🟠 Alto |
| CA-05 | Mientras el Remote carga, se muestra un skeleton de carga coherente con el diseño del sistema. | 🟠 Alto |
| CA-06 | El módulo de Gestión de Usuarios y Roles utiliza Angular Signal Forms para la reactividad en formularios. | 🟠 Alto |
| CA-07 | Se implementa la verificación de identidad MFA tras el inicio de sesión. | 🟠 Alto |

---

## 7. Métricas de Éxito

| Métrica | Meta |
|---|---|
| Tiempo de carga inicial del Host (LCP) | < 2.5 s |
| Tiempo de hidratación de un Remote | < 1.5 s |
| Disponibilidad del Host independiente de un Remote caído | 100% |
| Cobertura de criterios de aceptación en primera entrega | ≥ 80% |

---

## 8. Dependencias y Restricciones

- **Angular 21/22** como framework base (última versión estable disponible).
- **`@angular-architects/native-federation`** como mecanismo de federación (sin Webpack).
- Modo **Zoneless** obligatorio (`provideZonelessChangeDetection`).
- **Spring Boot 3 + PostgreSQL 16** para el backend del Host (ver [Backend Schema](../02-arquitectura/01-backend-schema.md)); cada Remote lleva su backend propio (ver [Guía Sistemas Hijos](../02-arquitectura/03-guia-sistemas-hijos.md)).
- Cada subsistema se desplegará en su propia **imagen Docker** en un registry privado.
- Orquestación de contenedores vía **Dokploy** o **Coolify**.

---

## 9. Estado de Implementación (revisado 2026-07-26)

> ⚠️ **Esta sección se corrigió el 2026-07-26** tras una auditoría de código que encontró
> discrepancias entre lo que este documento marcaba como `✅` y lo que había realmente en
> `src/app`. El detalle evidencia-por-evidencia vive en
> [`00-estado-real.md`](../03-plan-implementacion/00-estado-real.md); esta tabla es el
> resumen. **HU-00, HU-01 y HU-02 ya se ejecutaron ese mismo día** — ver
> [`04-bitacora/2026-07-26-hu00-hu01-ejecucion.md`](../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md).

| Alcance del MVP | Estado | Notas |
|---|:---:|---|
| Shell Host de 3 columnas (sidebar navy + panel + contenido) | ✅ | `pages/full-pages/layout/` — breadcrumb PrimeNG en el header |
| Diseño del login (branding + layout 2 columnas) | ✅ | `LoginComponent` rediseñado: columna con foto de oficina + logo `mis.png`/"Sistema de Información" en esquina superior izquierda del panel blanco; errores solo por `toast` (sin banner inline); versión (`src/global.ts`) debajo del botón "Acceder" |
| Pantalla de carga tras login (`LoadSpinnerComponent`) | ✅ | `auth/components/load-spinner/` — mascota + `p-progressSpinner` con colores del tema; visible mínimo 5s antes de navegar a `/admin/dashboard` |
| Autenticación con MFA (login + OTP 6 dígitos) | 🟡 UI deshabilitada temporalmente | `LoginComponent` completa el desafío OTP internamente con el código demo de la Fake API (`123456`) sin mostrar el paso de verificación — decisión de producto "por ahora no se usará". `AuthService.verificarOtp()`, el guard de roles y el contrato del backend (CA-07) no se tocaron; reactivar la UI es cuestión de volver a mostrarla en `LoginComponent` |
| Gestión de Usuarios | ✅ | `pages/modules/admin/usuarios/` (submódulo independiente desde 2026-07-26, antes parte de `accesos/`) enrutado en `/admin/usuarios/...` con `roleGuard('admin-sistema')`, `UsuariosService` propio |
| Gestión de Roles | ✅ | `pages/modules/admin/roles/` (submódulo independiente desde 2026-07-26, antes parte de `accesos/`) enrutado en `/admin/roles/...` con `roleGuard('admin-sistema')`, `RolesService` propio |
| Gestión de Sistemas (registro, estructura, permisos) | ✅ | `pages/modules/admin/sistemas/` (submódulo independiente desde 2026-07-26) enrutado en `/admin/sistemas/...` con `roleGuard('admin-sistema')`, `SistemasService` propio |
| Carga dinámica de Remotes + estados loading/error | ✅ | `RemoteWrapperComponent` en `/admin/:remoteName/**`, prefijo alineado con esta doc (HU-02) |
| Diseño segmentado (SelectButton) y vistas en cards | ✅ | Verificado en los componentes de `admin/` |
| Ayuda (FAQ, guías de uso, contacto a soporte) | ✅ (fuera del alcance original del MVP) | `pages/modules/help/` — `/admin/help/{faq,guias,contacto}`, sin `roleGuard` (disponible a todo usuario autenticado); enlace "Ayuda" en el sidebar |
| Red de pruebas | 🟡 Inicial | 24 tests / 5 specs sobre estado, guards, `RemoteWrapperComponent` y `AuthService` (HU-01); falta cobertura del resto de componentes |
| Backend real (Spring Boot) + BD PostgreSQL | 📄 Especificado | Docs de arquitectura listos para construir; hoy la Fake API sirve el contrato 1:1 — ver HU-04/HU-05 |
| Dockerización y CI/CD | ⏳ Pendiente | Ver HU-03 |

> Fuera de alcance (confirmado): módulo de Catálogos (retirado del producto), SSO externo, modo oscuro.
>
> El backlog de trabajo pendiente (incluida la estabilización de lo ya construido) vive
> en [`03-plan-implementacion/`](../03-plan-implementacion/README.md), organizado como
> Historias de Usuario (HU), no como fases.
