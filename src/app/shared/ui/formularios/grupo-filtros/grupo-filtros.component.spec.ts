import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { GrupoFiltrosComponent } from './grupo-filtros.component';

@Component({
  standalone: true,
  imports: [GrupoFiltrosComponent],
  template: `
    <app-grupo-filtros [anchoCompleto]="anchoCompleto()">
      <span class="filtro-proyectado">Tipo</span>
    </app-grupo-filtros>
  `,
})
class HostComponent {
  anchoCompleto = signal(true);
}

describe('GrupoFiltrosComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, GrupoFiltrosComponent],
    }).compileComponents();
  });

  it('proyecta los filtros dentro de la baldosa de vidrio', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const grupo = fixture.nativeElement.querySelector('app-grupo-filtros') as HTMLElement;
    expect(grupo.classList).toContain('mis-baldosa');
    expect(grupo.querySelector('.filtro-proyectado')?.textContent).toBe('Tipo');
  });

  it('ocupa todo el ancho y se ajusta al contenido con anchoCompleto en false', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const grupo = fixture.nativeElement.querySelector('app-grupo-filtros') as HTMLElement;
    expect(grupo.classList).toContain('sm:w-full');
    expect(grupo.classList).not.toContain('sm:w-fit');

    fixture.componentInstance.anchoCompleto.set(false);
    fixture.detectChanges();

    expect(grupo.classList).toContain('sm:w-fit');
    expect(grupo.classList).not.toContain('sm:w-full');
  });
});
