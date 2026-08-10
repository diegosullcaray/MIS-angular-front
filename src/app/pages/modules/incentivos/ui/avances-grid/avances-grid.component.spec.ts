import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvancesGridComponent } from './avances-grid.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemAvance } from '../../models';

function item(overrides: Partial<ItemAvance> = {}): ItemAvance {
  return { id: 'car', des: 'Cartera', icono: 'pi pi-briefcase', val: 0.5, per: 50, sit: 1, show: true, enab: true, ...overrides };
}

describe('AvancesGridComponent', () => {
  let incentivosFalso: { avances: ReturnType<typeof signal<ItemAvance[]>>; cargando: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    incentivosFalso = { avances: signal<ItemAvance[]>([item()]), cargando: signal(false) };
    TestBed.configureTestingModule({
      imports: [AvancesGridComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(AvancesGridComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('colorAvance() distingue meta cumplida / en camino / atrasado', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorAvance'](item({ val: 1 }))).toBe('#3fe91e');
    expect(fixture.componentInstance['colorAvance'](item({ val: 0.7 }))).toBe('#efb45f');
    expect(fixture.componentInstance['colorAvance'](item({ val: 0.3 }))).toBe('#E3005B');
  });

  it('onClic() con item.enab=true emite abrirDetalle con el codVar mapeado', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ id: 'efec2' }));

    expect(emitido).toHaveBeenCalledWith({ item: item({ id: 'efec2' }), codVar: 5 });
  });

  it('onClic() con item.enab=false no emite nada', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ enab: false }));

    expect(emitido).not.toHaveBeenCalled();
  });
});
