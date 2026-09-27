import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { AnimarDirective } from './animar.directive';

@Component({
  imports: [AnimarDirective],
  template: `<div appAnimar="entrada">hola</div>`,
})
class AnfitrionComponent {}

async function montarCon(reducirMovimiento: boolean): Promise<HTMLElement> {
  window.matchMedia = ((q: string) => ({ matches: reducirMovimiento && q.includes('reduce') })) as never;
  const fixture = TestBed.createComponent(AnfitrionComponent);
  await fixture.whenStable();
  return fixture.nativeElement.querySelector('div');
}

// Se mira si hay tween, no el valor intermedio: GSAP difiere el primer render a
// su próximo tick, y en la suite completa eso llega o no antes de la aserción.
describe('AnimarDirective', () => {
  it('anima la entrada del elemento con su desplazamiento', async () => {
    const [tween] = gsap.getTweensOf(await montarCon(false));
    expect(tween.vars).toMatchObject({ autoAlpha: 0, y: 16 });
  });

  it('con movimiento reducido solo funde, sin desplazar', async () => {
    const [tween] = gsap.getTweensOf(await montarCon(true));
    expect(tween.vars).toMatchObject({ autoAlpha: 0, duration: 0.2 });
    expect(tween.vars['y']).toBeUndefined();
  });
});
