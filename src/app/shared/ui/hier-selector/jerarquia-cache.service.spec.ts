import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { JerarquiaCacheService } from './jerarquia-cache.service';
import type { HierarquiaNodo } from './jerarquia.model';

describe('JerarquiaCacheService', () => {
  const nodos: HierarquiaNodo[] = [{ tip_cod: 1, cod_rel: '001' }];

  it('identidad y fecha forman parte de la clave de nivel', () => {
    const cache = TestBed.inject(JerarquiaCacheService);
    expect(cache.claveNivel(9, 1, 1, ['001'], '20260917', 'uno')).not.toBe(cache.claveNivel(9, 1, 1, ['001'], '20260917', 'dos'));
    expect(cache.claveNivel(9, 1, 1, ['001'], '20260917', 'uno')).not.toBe(cache.claveNivel(9, 1, 1, ['001'], '20260918', 'uno'));
  });

  it('comparte respuestas completadas y cancela al último consumidor pendiente', () => {
    const cache = TestBed.inject(JerarquiaCacheService);
    const pedir = vi.fn(() => of(nodos));
    cache.obtener('completado', pedir).subscribe();
    cache.obtener('completado', pedir).subscribe();
    expect(pedir).toHaveBeenCalledOnce();
    const pendiente = new Subject<HierarquiaNodo[]>();
    const consulta = cache.obtener('pendiente', () => pendiente).subscribe();
    expect(pendiente.observed).toBe(true);
    consulta.unsubscribe();
    expect(pendiente.observed).toBe(false);
  });

  it('una respuesta anterior a limpiar no vuelve a persistir datos de otra sesión', () => {
    const cache = TestBed.inject(JerarquiaCacheService);
    const pendiente = new Subject<HierarquiaNodo[]>();
    cache.obtener('antigua', () => pendiente).subscribe();
    cache.limpiar();
    pendiente.next(nodos);
    expect(sessionStorage.getItem('mis.jerarquia.antigua')).toBeNull();
    expect(cache.tamano).toBe(0);
  });
});
