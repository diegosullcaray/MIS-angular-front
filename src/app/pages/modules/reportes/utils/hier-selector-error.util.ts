import type { WritableSignal } from '@angular/core';
import type { ToastService } from '../../../../shared/services/toast.service';

/** Manejador del `(error)` de `app-hier-selector` — único caso en que ese componente nunca llega a emitir `nodoSeleccionado` (falla o viene vacía la jerarquía); sin esto, `cargando` se quedaba en `true` para siempre. */
export function crearManejadorErrorJerarquia(toast: ToastService, cargando: WritableSignal<boolean>): () => void {
  return () => {
    toast.error('No se pudo cargar la jerarquía', 'Inténtalo de nuevo en unos segundos.');
    cargando.set(false);
  };
}
