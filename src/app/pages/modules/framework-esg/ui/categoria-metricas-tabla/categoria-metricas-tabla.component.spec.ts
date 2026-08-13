import { TestBed } from '@angular/core/testing';
import { CategoriaMetricasTablaComponent } from './categoria-metricas-tabla.component';
import type { EsgMetricaFila } from '../../models/metrica.model';

function metrica(overrides: Partial<EsgMetricaFila> = {}): EsgMetricaFila {
  return {
    cod_met: 1,
    cod_cat: 1,
    des_met: 'M1',
    des_med: 'u',
    des_dis: 'Sí',
    sit_met: 1,
    cfg_met: '{}',
    ...overrides,
  };
}

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

  it('onEditar() emite la fila en editar', () => {
    const fixture = crear();
    const fila = metrica({ is_edit: 1 });
    const emitido = vi.fn();
    fixture.componentInstance.editar.subscribe(emitido);

    fixture.componentInstance['onEditar'](fila);

    expect(emitido).toHaveBeenCalledWith(fila);
  });

  it('onVerDetalle() emite la fila en verDetalle', () => {
    const fixture = crear();
    const fila = metrica();
    const emitido = vi.fn();
    fixture.componentInstance.verDetalle.subscribe(emitido);

    fixture.componentInstance['onVerDetalle'](fila);

    expect(emitido).toHaveBeenCalledWith(fila);
  });

  it('truncar() recorta valores de más de 24 caracteres', () => {
    const fixture = crear();
    expect(fixture.componentInstance['truncar']('a'.repeat(30))).toBe(`${'a'.repeat(24)}…`);
    expect(fixture.componentInstance['truncar']('corto')).toBe('corto');
    expect(fixture.componentInstance['truncar'](null)).toBe('');
  });

  it('el botón "Editar" solo se muestra si puedeEditar()=true y la fila tiene is_edit===1', () => {
    const fixture = crear();
    fixture.componentRef.setInput('filas', [metrica({ cod_met: 1, is_edit: 1 }), metrica({ cod_met: 2, is_edit: 0 })]);
    fixture.componentRef.setInput('puedeEditar', true);
    fixture.detectChanges();

    const botonesEditar = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Editar"]');
    expect(botonesEditar.length).toBe(1);
  });

  it('sin permiso de edición (puedeEditar=false), no muestra ningún botón "Editar" aunque is_edit===1', () => {
    const fixture = crear();
    fixture.componentRef.setInput('filas', [metrica({ is_edit: 1 })]);
    fixture.componentRef.setInput('puedeEditar', false);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Editar"]').length).toBe(0);
  });

  it('el botón "Ver detalle" no se muestra en filas de agrupación (is_nod===1)', () => {
    const fixture = crear();
    fixture.componentRef.setInput('filas', [metrica({ cod_met: 1, is_nod: 1 }), metrica({ cod_met: 2, is_nod: 0 })]);
    fixture.detectChanges();

    const botonesDetalle = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Ver detalle"]');
    expect(botonesDetalle.length).toBe(1);
  });

  it('las filas de agrupación (is_nod===1) llevan la clase de resalte "esg-fila-nodo"', () => {
    const fixture = crear();
    fixture.componentRef.setInput('filas', [metrica({ cod_met: 1, is_nod: 1, des_met: '3.1 Sección' }), metrica({ cod_met: 2, is_nod: 0 })]);
    fixture.detectChanges();

    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(filas[0].classList.contains('esg-fila-nodo')).toBe(true);
    expect(filas[1].classList.contains('esg-fila-nodo')).toBe(false);
  });
});
