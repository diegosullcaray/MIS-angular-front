import { TestBed } from '@angular/core/testing';
import { CategoriaMetricasTablaComponent } from './categoria-metricas-tabla.component';
import type { EsgMetricaFila } from '../../models';

describe('CategoriaMetricasTablaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CategoriaMetricasTablaComponent] });
  });

  function crear() {
    const fixture = TestBed.createComponent(CategoriaMetricasTablaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('columnasHistoricasCol() convierte las claves dinámicas en columnas {key,label}', () => {
    const fixture = crear();
    fixture.componentRef.setInput('columnasHistoricas', ['2024-01', '2024-02']);

    expect(fixture.componentInstance['columnasHistoricasCol']()).toEqual([
      { key: '2024-01', label: '2024-01' },
      { key: '2024-02', label: '2024-02' },
    ]);
  });

  it('onSeleccionFila() emite la fila seleccionada', () => {
    const fixture = crear();
    const fila: EsgMetricaFila = {
      cod_met: 1,
      cod_cat: 1,
      des_met: 'M1',
      des_med: 'u',
      des_dis: 'Sí',
      sit_met: 1,
      cfg_met: '{}',
    };
    const emitido = vi.fn();
    fixture.componentInstance.filaSeleccionada.subscribe(emitido);

    fixture.componentInstance['onSeleccionFila'](fila);

    expect(emitido).toHaveBeenCalledWith(fila);
  });

  it('truncar() recorta valores de más de 24 caracteres', () => {
    const fixture = crear();
    expect(fixture.componentInstance['truncar']('a'.repeat(30))).toBe(`${'a'.repeat(24)}…`);
    expect(fixture.componentInstance['truncar']('corto')).toBe('corto');
    expect(fixture.componentInstance['truncar'](null)).toBe('');
  });
});
