# Plan de remediación

**Estado: roadmap, no autorización ni evidencia de implementación.**
**Restricción vigente: backend, OAuth y Winder congelados durante la consolidación frontend.**

## Acciones frontend permitidas

- Cancelar consultas e invalidar cachés/selecciones al cambiar de identidad o cerrar sesión.
- Evitar nuevas credenciales, datos sensibles e identidades reales en código y fixtures.
- Mantener errores persistentes y no representar controles de menú como autorización.
- Verificar el bundle y registrar evidencia en [evidence](../evidence/README.md).

## Futuro condicionado a cambios de backend

1. Validar autorización server-side por operación.
2. Rotar/retirar secretos del bundle con el responsable de la integración.
3. Sustituir criptografía legacy por transporte seguro y autenticado.
4. Evaluar CSP y evolución de OAuth a Authorization Code Flow con PKCE.
5. Repetir pentest sobre la integración real.

Antes de ejecutar una fase futura hacen falta responsable, fecha, prueba de
aceptación, compatibilidad aprobada y rollback. No están asignados: es un pendiente,
no un proceso operativo. Ninguna tarea de UI autoriza estas mutaciones.
