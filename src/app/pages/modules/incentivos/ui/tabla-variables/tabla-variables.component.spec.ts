import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TablaVariablesComponent } from './tabla-variables.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { FilaTablaVariable } from '../../models';

describe('TablaVariablesComponent', () => {
  let incentivosFalso: { tablaVariables: ReturnType<typeof signal<FilaTablaVariable[]>>; tablaEfectividad: ReturnType<typeof signal<unknown[]>> };

  beforeEach(() => {
    incentivosFalso = { tablaVariables: signal<FilaTablaVariable[]>([]), tablaEfectividad: signal([]) };
    TestBed.configureTestingModule({
      imports: [TablaVariablesComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(TablaVariablesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('iconoVariable() mapea cod_var 1..6 a car/cli/sc1/efec1/efec2/efec3', () => {
    const fixture = crear();
    expect(fixture.componentInstance['iconoVariable'](1)).toBe('pi pi-briefcase'); // car
    expect(fixture.componentInstance['iconoVariable'](4)).toBe('pi pi-gauge'); // efec1
  });

  it('iconoVariable() de un cod_var fuera de rango devuelve un ícono genérico', () => {
    const fixture = crear();
    expect(fixture.componentInstance['iconoVariable'](99)).toBe('pi pi-circle');
  });

  it('claseMeta() resalta en verde cuando avan_fix>=1 y en rojo en cualquier otro caso', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseMeta']({ cod_var: 1, avan_fix: 1 })).toContain('success');
    expect(fixture.componentInstance['claseMeta']({ cod_var: 1, avan_fix: 0.5 })).toContain('danger');
    expect(fixture.componentInstance['claseMeta']({ cod_var: 1 })).toContain('danger');
  });
});
