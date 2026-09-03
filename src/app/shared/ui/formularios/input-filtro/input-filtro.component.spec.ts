import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { InputFiltroComponent } from './input-filtro.component';

@Component({
  standalone: true,
  imports: [InputFiltroComponent],
  template: `
    <app-input-filtro
      [etiqueta]="etiqueta"
      [placeholder]="placeholder"
      [ancho]="ancho"
      [(valor)]="valor"
    />
  `,
})
class HostComponent {
  etiqueta = 'Buscar Código';
  placeholder = 'Ej: 12345';
  ancho = 'w-60';
  valor = signal('inicial');
}

describe('InputFiltroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, InputFiltroComponent],
    }).compileComponents();
  });

  it('renderiza la etiqueta y el placeholder adecuadamente', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(span.textContent).toContain('Buscar Código');
    expect(input.placeholder).toBe('Ej: 12345');
    expect(input.getAttribute('aria-label')).toBe('Buscar Código');
  });

  it('enlaza el valor inicial y actualiza bidireccionalmente el model', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('inicial');

    input.value = 'nuevo valor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.valor()).toBe('nuevo valor');
  });
});
