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

  // Cada celda numérica es un "chip" con fondo de color (`chipFn1`/`chipFn2`
  // del legado). Antes estos colores se aplicaban como color de TEXTO, así que
  // las cifras salían del color del fondo de la página — invisibles.
  it('claseCelda(fila, "met") usa el chip verde cuando avan_fix>=1 y el rojo en cualquier otro caso', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1, avan_fix: 1 }, 'met')).toBe('chip chip--meta-ok');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1, avan_fix: 0.5 }, 'met')).toBe('chip chip--meta-baja');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'met')).toBe('chip chip--meta-baja');
  });

  it('claseCelda(fila, "mon") siempre usa el chip de monetización, sin importar avan_fix', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'mon')).toBe('chip chip--mon');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1, avan_fix: 1 }, 'mon')).toBe('chip chip--mon');
  });

  it('claseCelda(fila, "real")/"ini" distinguen el valor real del de referencia', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'real')).toBe('chip chip--real');
    expect(fixture.componentInstance['claseCelda']({ cod_var: 1 }, 'ini')).toBe('chip chip--neutro');
  });

  it('onClicFila() traduce el cod_var de la tabla al que espera el detalle (Cartera 1 → 91)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirDetalle.subscribe(emitido);

    fixture.componentInstance['onClicFila'](1);
    expect(emitido).toHaveBeenCalledWith(expect.objectContaining({ codVar: 91 }));

    fixture.componentInstance['onClicFila'](5);
    expect(emitido).toHaveBeenLastCalledWith(expect.objectContaining({ codVar: 5 }));
  });
});
