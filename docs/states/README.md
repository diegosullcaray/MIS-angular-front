# Estados globales

El estado global documentado se mantiene en `ShellStateService`, preferencias y sesion. Este indice conserva la ruta solicitada para separar gobierno de estado de la implementacion visual.

Ver [estados compartidos de componentes](../components/states/README.md), [accessibility and UI states](../components/accessibility.md) y [system overview](../architecture/system-overview.md).

Los componentes compartidos reciben estado ya resuelto. La carga, vacio, error y permisos se deciden en el modulo dueño del dato.

Ver el detalle en [state model](./state-model.md).
