# ADR-0005: El cambio de perfil requiere confirmación en diálogo

- Estado: Vigente
- Fecha: 2026-09-21
- Responsables: Frontend MIS Host

## Contexto

El header ofrecía los perfiles alternos como acciones inmediatas dentro del menú de identidad. Ese patrón no coincidía con `stg-app-mis-r22`, donde el cambio se realiza en un diálogo (`Escoge Usuario`), se selecciona una fila y se confirma. Un cambio accidental además invalida jerarquía, reportes y permisos visibles.

## Decisión

El menú del header expone una única acción **Cambiar perfil**. La acción abre un diálogo modal que lista los perfiles autorizados con nombre y cargo. La cuenta seleccionada se mantiene en estado temporal y solo se entrega a `AuthService` cuando el usuario confirma. Si la sesión está en un alterno, la identidad original aparece en la misma lista para volver a ella.

Cancelar, Escape y clic fuera cierran el diálogo sin cambiar identidad. La selección no se persiste en preferencias ni en almacenamiento.

## Consecuencias

- Se evita el cambio accidental y se conserva la paridad de interacción con el legacy.
- El estado de selección pertenece al header y la mutación de identidad continúa centralizada en `AuthService`.
- El diálogo necesita pruebas de apertura, selección, confirmación, error y retorno a la identidad original.
- Cualquier cambio futuro del contrato de alternos debe mantener nombre, cargo y correo como datos de presentación, sin registrar datos sensibles en evidencia.

## Evidencia

- Implementación: `src/app/pages/full-pages/layout/components/header/header.component.{ts,html}`.
- Pruebas: `src/app/pages/full-pages/layout/components/header/header.component.spec.ts`.
- Flujo legacy: `src/app/system/admin/components/alt-user-dialog/` en `stg-app-mis-r22`.
- Contrato de sesión: `src/app/pages/full-pages/auth/model/auth-session.model.ts`.
