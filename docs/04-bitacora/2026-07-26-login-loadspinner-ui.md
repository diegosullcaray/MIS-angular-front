> **Documentacion:** [Indice](../README.md) | [PRD §9](../01-canon/01-prd.md#9-estado-de-implementación-revisado-2026-07-26) | [UX/App Flow](../01-canon/02-ux-app-flow.md)

# 2026-07-26 — Rediseño del login y pantalla de carga (`LoadSpinnerComponent`)

Sesión de UI sobre `LoginComponent` y el nuevo `LoadSpinnerComponent`. A diferencia de
las sesiones anteriores (reestructura de docs, HU-00/HU-01), esta fue iterativa —
varios ajustes chicos de diseño en la misma tarde — así que esta entrada resume el
estado final, no cada paso intermedio.

## Qué cambió en `LoginComponent`

- **Layout:** de tarjeta centrada de 2 columnas dentro de un `p-card` a un layout de
  página completa (`grid grid-cols-1 md:grid-cols-2`): columna izquierda con foto de
  oficina (`assets/images/fc/fondos/images.jpg`), columna derecha panel blanco con el
  formulario.
- **Marca:** logo `mis.png` + "Sistema de Información" (texto real, no imagen) fijos en
  la esquina superior izquierda del panel blanco; el encabezado del formulario quedó
  solo con "Inicio de sesión".
- **Versión:** se muestra debajo del botón "Acceder", tomada de `src/global.ts`
  (`export const version`) — no de una constante propia del componente.
- **Errores:** se eliminó el banner de error inline (`@if (errorMsg())`) — los errores
  de autenticación se comunican **únicamente** vía `ToastService`.
- **Bug corregido — botón "Acceder" se trababa tras un login fallido:** el mecanismo
  anterior marcaba los campos como inválidos vía `validate()` cuando el backend
  rechazaba las credenciales (`credencialesInvalidas` signal), pero la única forma de
  resetear ese signal era volviendo a enviar el formulario — y el botón de envío estaba
  deshabilitado por esa misma invalidez. Candado permanente tras el primer intento
  fallido. Se eliminó `credencialesInvalidas` y sus `validate()` por completo; ahora un
  login fallido solo dispara el toast y el formulario queda inmediatamente reintentable.
- **Validación diferida:** los validadores `required`/`email` se envuelven en
  `applyWhen(..., ({ stateOf }) => stateOf(campo).touched(), ...)`, y `onSubmit` usa
  `submit(this.loginForm, async () => {...})` — la función de Signal Forms que marca
  todos los campos como touched antes de correr la acción. Antes de este cambio, los
  campos se mostraban en rojo apenas cargaba la página (el binding automático de
  `[formField]` hacia `[invalid]` en PrimeNG lee la validez cruda, sin gatear por
  touched, y el compilador prohíbe sobreescribir `[invalid]` a mano en un elemento con
  `[formField]`).

## MFA deshabilitado en la UI (temporal)

Por pedido explícito ("por ahora no se usará"): tras un login válido, `onSubmit` llama
directamente a `AuthService.verificarOtp()` con el código demo de la Fake API
(`123456`, mismo valor que ya usa `fake-api.interceptor.ts`) en vez de mostrar el paso
de verificación OTP. Se removieron de `LoginComponent` todos los signals/métodos que
solo servían a esa UI (`otpDigitos`, `onOtpInput`, `onOtpBackspace`, `enfocarCelda`,
`otpExpirado`, `expiraEn`, `emailEnmascarado`, el timer, `volverALogin`) y el CSS de
`.otp-cell`.

**Lo que NO se tocó** (para que reactivar sea barato): `AuthService.verificarOtp()`,
`AuthService.cancelarMfa()`, el contrato `/api/v1/auth/verificar-otp` de la Fake API, y
la regla de negocio CA-07 del PRD (MFA obligatorio) — sigue documentada como requisito;
lo que cambió es solo qué muestra la UI hoy. Ver PRD §9 para el detalle.

## `LoadSpinnerComponent` (nuevo)

`auth/components/load-spinner/` — pantalla de transición entre el login y el
dashboard: mascota (`assets/images/fc/avatars/mis_wait.png`) + `p-progressSpinner` de
PrimeNG con el color del trazo sobreescrito a `var(--mis-secondary)`, sobre el mismo
fondo radial navy que el login. `onSubmit` fija `paso = 'cargando'` y espera 5 segundos
(`setTimeout` envuelto en Promise) antes de navegar a `/admin/dashboard`, para que
realmente se alcance a ver — antes pasaba casi instantáneo y no se notaba.

## Estado tras esta sesión

`LoginComponent` y `LoadSpinnerComponent` se consideran terminados para este MVP salvo
que se pida lo contrario. Ver PRD §9 para las filas actualizadas. Reactivar MFA en la UI
es la única deuda pendiente conocida de este flujo.
