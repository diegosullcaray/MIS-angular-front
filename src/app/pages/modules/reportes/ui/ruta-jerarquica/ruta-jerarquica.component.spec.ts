import { TestBed } from '@angular/core/testing';
import { RutaJerarquicaComponent } from './ruta-jerarquica.component';
import type { HierarquiaNodo } from '../../models/jerarquia.model';

const RUTA: HierarquiaNodo[] = [
  { tip_cod: 9, cod_rel: 'FC', des_rel: 'Financiera' },
  { tip_cod: 12, cod_rel: 'N1', des_rel: 'Norte 1' },
  { tip_cod: 18, cod_rel: 'AG-1', des_rel: 'Agencia Centro' },
];

describe('RutaJerarquicaComponent', () => {
  function crear(ruta: HierarquiaNodo[]) {
    const fixture = TestBed.createComponent(RutaJerarquicaComponent);
    fixture.componentRef.setInput('ruta', ruta);
    const emitidos: number[] = [];
    fixture.componentInstance.irANivel.subscribe((i) => emitidos.push(i));
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, emitidos };
  }

  it('muestra el nivel actual como marcado y los anteriores como enlaces', () => {
    const { el } = crear(RUTA);
    expect(el.querySelector('[aria-current="page"]')?.textContent).toContain('Agencia Centro');
    const enlaces = [...el.querySelectorAll('nav button')].map((b) => b.textContent?.trim());
    expect(enlaces).toEqual(['Financiera', 'Norte 1']);
  });

  it('emite el índice del nivel al que volver', () => {
    const { el, emitidos } = crear(RUTA);
    (el.querySelectorAll('nav button')[1] as HTMLButtonElement).click();
    expect(emitidos).toEqual([1]);
  });

  it('no ofrece botón "Volver" y sin ruta no pinta nada', () => {
    expect(crear(RUTA).el.textContent).not.toContain('Volver');
    expect(crear([]).el.querySelector('nav')).toBeNull();
  });
});
