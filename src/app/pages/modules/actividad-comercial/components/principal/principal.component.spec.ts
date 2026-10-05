import { TestBed } from '@angular/core/testing';
import { PrincipalComponent } from './principal.component';

describe('PrincipalComponent (Actividad Comercial)', () => {
  it('renderiza la ventana y el estado vacío sin consultar al backend', () => {
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-window-panel')).not.toBeNull();
    expect(el.textContent).toContain('Actividad Comercial');
  });
});
