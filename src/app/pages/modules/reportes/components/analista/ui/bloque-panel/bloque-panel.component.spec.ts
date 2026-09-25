import { TestBed } from '@angular/core/testing';
import { BloquePanelComponent } from './bloque-panel.component';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const RESUMEN: TablaReporteResultado = {
  headers: [
    {
      columns: [
        { columnDef: 'prod', header: 'Producto', isdata: 1 },
        { columnDef: 'saldo', header: 'Saldo', isdata: 2, format: { type: 'number' } },
      ],
    },
  ],
  body: [
    { prod: 'A', saldo: 10 },
    { prod: 'B', saldo: 20 },
  ],
  additional: {},
};

describe('BloquePanelComponent', () => {
  function crear(titulo = '', nota: string[] = [], chip = '') {
    TestBed.configureTestingModule({ imports: [BloquePanelComponent] });
    const fixture = TestBed.createComponent(BloquePanelComponent);
    fixture.componentRef.setInput('tabla', RESUMEN);
    fixture.componentRef.setInput('titulo', titulo);
    fixture.componentRef.setInput('nota', nota);
    fixture.componentRef.setInput('chip', chip);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra la tabla con su título y nota, sin opción de gráfico', () => {
    const el = crear('Resumen', ['(1) criterio']);
    expect(el.querySelector('h3')?.textContent).toBe('Resumen');
    expect(el.querySelector('app-tabla-reporte')).not.toBeNull();
    expect(el.querySelector('.bloque-nota')?.textContent).toContain('(1) criterio');
    expect(el.querySelector('app-grafico-mixto')).toBeNull();
  });

  it('sin título no pinta cabecera', () => {
    expect(crear().querySelector('header')).toBeNull();
  });

  it('muestra la nota de unidad como chip, no como título', () => {
    const el = crear('', [], 'Expresado en PEN y %');
    expect(el.querySelector('app-chip-informativo')?.textContent).toContain('Expresado en PEN y %');
    expect(el.querySelector('h3')).toBeNull();
  });

  it('sin chip no pinta ninguno', () => {
    expect(crear('Resumen').querySelector('app-chip-informativo')).toBeNull();
  });
});
