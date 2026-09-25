import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Image, ImageModule } from 'primeng/image';
import { By } from '@angular/platform-browser';
import { ImagenAmpliableDirective } from './imagen-ampliable.directive';

@Component({
  standalone: true,
  imports: [ImageModule, ImagenAmpliableDirective],
  template: `
    <div class="tarjeta" style="backdrop-filter: blur(4px)">
      <p-image src="guia.png" alt="Guía" [preview]="true" appendTo="body" appImagenAmpliable />
    </div>
  `,
})
class AnfitrionComponent {}

describe('ImagenAmpliableDirective', () => {
  function crear() {
    TestBed.configureTestingModule({ imports: [AnfitrionComponent] });
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();
    const imagenDe = fixture.debugElement.query(By.directive(Image));
    return { fixture, imagen: imagenDe.injector.get(Image), host: imagenDe.nativeElement as HTMLElement };
  }

  afterEach(() => document.querySelectorAll('body > .p-image-mask').forEach((m) => m.remove()));

  // La máscara quedaba dentro de la tarjeta: un ancestro con backdrop-filter la
  // encerraba y la vista previa no cubría la pantalla.
  it('al abrir la vista previa lleva la máscara al body, fuera de la tarjeta', () => {
    const { host, imagen } = crear();
    const mascara = document.createElement('div');
    mascara.className = 'p-image-mask';
    host.append(mascara);

    imagen.onShow.emit({});

    expect(mascara.parentElement).toBe(document.body);
  });

  it('sin máscara renderizada no hace nada', () => {
    const { imagen } = crear();
    expect(() => imagen.onShow.emit({})).not.toThrow();
    expect(document.querySelector('body > .p-image-mask')).toBeNull();
  });

  it('si la pantalla se destruye con la vista previa abierta, retira la máscara del body', () => {
    const { fixture, host, imagen } = crear();
    const mascara = document.createElement('div');
    mascara.className = 'p-image-mask';
    host.append(mascara);
    imagen.onShow.emit({});

    fixture.destroy();

    expect(document.body.contains(mascara)).toBe(false);
  });
});
