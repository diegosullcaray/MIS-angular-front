import { TestBed } from '@angular/core/testing';
import { GraficoColumnasApiladasComponent } from './grafico-columnas-apiladas.component';

describe('GraficoColumnasApiladasComponent', () => {
  function opciones(meta?: { valor: number; etiqueta: string }) {
    const fixture = TestBed.createComponent(GraficoColumnasApiladasComponent);
    fixture.componentRef.setInput('datos', {
      categorias: ['Hoy', 'Cierre'],
      series: [
        { nombre: 'Propia', valores: [100, 150], color: '#0A4681' },
        { nombre: 'Heredada', valores: [40, null], color: '#9DB4D3' },
      ],
      meta,
    });
    fixture.detectChanges();
    return fixture.componentInstance['opciones']();
  }

  it('apila una serie por tramo en el orden recibido (el primero abajo)', () => {
    const o = opciones();

    expect((o.series ?? []).map((s) => (s as { name: string }).name)).toEqual(['Propia', 'Heredada']);
    expect((o.yAxis as { reversedStacks: boolean }).reversedStacks).toBe(false);
    expect((o.plotOptions?.column as { stacking: string }).stacking).toBe('normal');
  });

  it('solo dibuja la línea de meta cuando hay meta', () => {
    expect((opciones().yAxis as { plotLines: unknown[] }).plotLines).toEqual([]);

    const conMeta = opciones({ valor: 500, etiqueta: 'Meta 500' });
    const lineas = (conMeta.yAxis as { plotLines: { value: number }[] }).plotLines;
    expect(lineas).toHaveLength(1);
    expect(lineas[0].value).toBe(500);
  });
});
