import { signal } from '@angular/core';
import { crearManejadorErrorJerarquia } from './hier-selector-error.util';
import type { ToastService } from '../../../../shared/services/toast.service';

describe('crearManejadorErrorJerarquia', () => {
  it('informa el error y termina la carga para no bloquear el reporte', () => {
    const cargando = signal(true);
    const error = vi.fn();
    const toast = { error } as unknown as ToastService;

    crearManejadorErrorJerarquia(toast, cargando)();

    expect(error).toHaveBeenCalledWith(
      'No se pudo cargar la jerarquía',
      'Inténtalo de nuevo en unos segundos.',
    );
    expect(cargando()).toBe(false);
  });
});
