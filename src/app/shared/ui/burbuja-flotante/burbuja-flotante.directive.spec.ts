import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BurbujaFlotanteDirective, posicionBurbuja } from './burbuja-flotante.directive';

const ancla = { top: 200, bottom: 280, left: 1300, right: 1380, width: 80, height: 80 } as DOMRect;
const burbuja = { width: 180, height: 60 };
const limites = { top: 100, left: 100, right: 1420 };

describe('posicionBurbuja', () => {
  it('arriba: encima del ancla y centrada sobre ella', () => {
    expect(posicionBurbuja(ancla, { width: 100, height: 60 }, limites, 'arriba', 6)).toEqual({ top: 134, left: 1290 });
  });

  it('arriba: no se sale por el costado del contenedor', () => {
    expect(posicionBurbuja(ancla, burbuja, limites, 'arriba', 6).left).toBe(1420 - 180 - 6);
  });

  it('arriba: sin lugar encima se queda al borde superior del contenedor', () => {
    expect(posicionBurbuja({ ...ancla, top: 120 } as DOMRect, burbuja, limites, 'arriba', 6).top).toBe(106);
  });

  it('derecha: al lado del ancla, a la altura de su parte superior', () => {
    expect(posicionBurbuja(ancla, burbuja, limites, 'derecha', 6)).toEqual({ top: 200, left: 1386 });
  });
});

@Component({
  standalone: true,
  imports: [BurbujaFlotanteDirective],
  template: `
    @if (mostrar()) {
      <div class="caja"><img #a alt="ancla" /><p [appBurbujaFlotante]="a" class="burbuja">Hola</p></div>
    }
  `,
})
class Anfitrion {
  readonly mostrar = signal(true);
}

describe('BurbujaFlotanteDirective', () => {
  it('lleva la burbuja al body, fija y sin ocupar lugar, y la retira al destruirse', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    TestBed.tick();

    const burbujaEl = document.body.querySelector<HTMLElement>(':scope > .burbuja')!;
    expect(burbujaEl).not.toBeNull();
    expect(burbujaEl.style.position).toBe('fixed');
    expect(fixture.nativeElement.querySelector('.caja .burbuja')).toBeNull();

    fixture.componentInstance.mostrar.set(false);
    fixture.detectChanges();
    TestBed.tick();
    // Angular puede diferir la baja de la vista: se espera a que la burbuja salga del body.
    await vi.waitFor(() => expect(document.body.querySelector('.burbuja')).toBeNull());
  });
});
