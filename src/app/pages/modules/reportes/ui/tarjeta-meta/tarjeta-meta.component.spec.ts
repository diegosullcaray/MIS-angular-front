import { TestBed } from '@angular/core/testing';
import { TarjetaMetaComponent } from './tarjeta-meta.component';
import type { TarjetaCmgCartera } from '../../components/actividad-diaria/components/Cartera/models/cmg-cartera.model';

describe('TarjetaMetaComponent', () => {
  function crear(tarjeta: TarjetaCmgCartera, progreso = 0) {
    const fixture = TestBed.createComponent(TarjetaMetaComponent);
    fixture.componentRef.setInput('tarjeta', tarjeta);
    fixture.componentRef.setInput('progreso', progreso);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
  }

  it('con cumplimiento: valor, meta, nombre y el aro', () => {
    const { el } = crear(
      { etiqueta: 'Monto Desembolsado (miles PEN)', valor: 242813, comparativo: 'Meta 268,169', senal: 0, cumplimiento: 90.5 },
      90.5,
    );
    const textos = [...el.querySelectorAll('.min-w-0 > span')].map((s) => s.textContent?.trim());

    expect(textos).toEqual(['242,813', 'Meta 268,169', 'Monto Desembolsado (miles PEN)']);
    expect(el.querySelector('p-knob')).not.toBeNull();
  });

  it('con variación: flecha y color según el signo, sin aro', () => {
    const { el } = crear({ etiqueta: 'TAPP Mes/TAPP Mínima', valor: '35.26 %', comparativo: '40.38%', senal: -1, delta: '-512 pbs' });
    const variacion = el.querySelector('.pi-arrow-down')?.parentElement as HTMLElement;

    expect(el.textContent).toContain('35.26 %');
    expect(variacion.textContent).toContain('-512 pbs');
    expect(variacion.className).toContain('mis-danger');
    expect(el.querySelector('p-knob')).toBeNull();
  });

  it('el aro usa los cortes del legado', () => {
    const { cmp } = crear({ etiqueta: 'x', valor: 1, comparativo: '', senal: 0, cumplimiento: 50 }, 90.5);
    expect(cmp['colorAnillo']()).toBe('var(--mis-danger)');
  });
});
