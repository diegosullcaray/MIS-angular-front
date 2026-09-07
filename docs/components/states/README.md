# Estados compartidos

El estado global del shell se concentra en `ShellStateService` y usa senales de solo lectura para los consumidores. La sesion y preferencias tienen sus propios limites en `core/`.

- Estado de shell: [system overview](../../architecture/system-overview.md).
- Preferencias y cierre de sesion: [session preferences](../../architecture/session-preferences.md).
- No duplicar estado de dominio en componentes compartidos.
