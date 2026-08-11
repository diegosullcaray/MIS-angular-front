import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TablaVariablesComponent } from './tabla-variables.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ICONOS_INCENTIVOS } from '../../utils/incentivos-config.util';
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
    expect(fixture.componentInstance['iconoVariable'](1)).toBe(ICONOS_INCENTIVOS['car']);
    expect(fixture.componentInstance['iconoVariable'](4)).toBe(ICONOS_INCENTIVOS['efec1']);
  });

  it('iconoVariable() de un cod_var fuera de rango devuelve un ícono genérico', () => {
    const fixture = crear();
    expect(fixture.componentInstance['iconoVariable'](99)).toBe('pi pi-circle');
  });

  it('claseCelda(fila, "met") resalta con el token de éxito cuando avan_fix>=1 y el de peligro en cualquier otro caso', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1, avan_fix: 1 }, 'met')).toContain('--mis-success');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1, avan_fix: 0.5 }, 'met')).toContain('--mis-danger');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'met')).toContain('--mis-danger');
  });

  it('claseCelda(fila, "mon") siempre usa el token primario, sin importar avan_fix', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'mon')).toContain('--mis-primary');
  });

  it('claseCelda(fila, "real")/"ini" usan los tokens secundario/neutro del sistema', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'real')).toContain('--mis-secondary-light');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'ini')).toContain('--mis-bg');
  });
});
