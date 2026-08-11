import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SuperPlusGridComponent } from './super-plus-grid.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemSuperPlus } from '../../models';

function item(overrides: Partial<ItemSuperPlus> = {}): ItemSuperPlus {
  return {
    id: 'prod',
    des: 'Productividad',
    icono: 'pi pi-star',
    val: 10,
    show: true,
    enab: true,
    estado: 1,
    parametros: { comp: 1, req: 'getProd', card: true, typ: 'sp' },
    ...overrides,
  };
}

describe('SuperPlusGridComponent', () => {
  let incentivosFalso: { superPlus: ReturnType<typeof signal<ItemSuperPlus[]>>; cargando: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    incentivosFalso = { superPlus: signal<ItemSuperPlus[]>([item()]), cargando: signal(false) };
    TestBed.configureTestingModule({
      imports: [SuperPlusGridComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(SuperPlusGridComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('claseCaja() usa el token neutro del sistema cuando estado=0', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCaja'](item({ estado: 0 }))).toContain('--mis-text-tertiary');
  });

  it('claseCaja() usa el token secundario para val>=0 y el de peligro para val<0 cuando estado=1', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCaja'](item({ val: 5 }))).toContain('--mis-secondary');
    expect(fixture.componentInstance['claseCaja'](item({ val: -5 }))).toContain('--mis-danger');
  });

  it('onClic() emite abrirDetalle con el codVar mapeado, solo si item.enab es true', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClic'](item({ enab: false }));
    expect(emitido).not.toHaveBeenCalled();

    fixture.componentInstance['onClic'](item({ id: 'tas', enab: true }));
    expect(emitido).toHaveBeenCalledWith({ item: item({ id: 'tas', enab: true }), codVar: 6 });
  });
});
