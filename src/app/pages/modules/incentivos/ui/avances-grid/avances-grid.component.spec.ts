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

  // Los cortes son los de `pieStyle()` del legado (>=1 / >=0.65 / el resto),
  // pero el color sale de los tokens semánticos y no de los hex fijos del
  // legado (`#3fe91e`/`#efb45f`/`#E3005B`): esos no se adaptan al tema oscuro.
  it('colorAvance() distingue meta cumplida / en camino / atrasado', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorAvance'](item({ val: 1 }))).toBe('var(--mis-success)');
    expect(fixture.componentInstance['colorAvance'](item({ val: 1.2 }))).toBe('var(--mis-success)');
    expect(fixture.componentInstance['colorAvance'](item({ val: 0.7 }))).toBe('var(--mis-warning)');
    expect(fixture.componentInstance['colorAvance'](item({ val: 0.3 }))).toBe('var(--mis-danger)');
  });

  it('porcentajeAnillo() usa `per` y lo topa en 100 cuando el avance supera la meta', () => {
    const fixture = crear();
    expect(fixture.componentInstance['porcentajeAnillo'](item({ per: 45 }))).toBe(45);
    expect(fixture.componentInstance['porcentajeAnillo'](item({ per: 112 }))).toBe(100);
    expect(fixture.componentInstance['porcentajeAnillo'](item({ per: -5 }))).toBe(0);
  });

  it('onClic() con item.enab=true emite abrirDetalle con el codVar mapeado', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ id: 'efec2' }));

    expect(emitido).toHaveBeenCalledWith({ item: item({ id: 'efec2' }), codVar: 5 });
  });

  it('onClic() sobre Cartera pide el detalle con cod_var 91, no con el 1 de la tabla', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ id: 'car' }));

    expect(emitido).toHaveBeenCalledWith({ item: item({ id: 'car' }), codVar: 91 });
  });

  it('onClic() con item.enab=false no emite nada', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ enab: false }));

    expect(emitido).not.toHaveBeenCalled();
  });
});
