import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InicioComponent } from './inicio.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { KaypachaService } from '../../../ranking-k/services/kaypacha.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';
import type { CategoriaRanking } from '../../../ranking-k/models';

describe('InicioComponent', () => {
  let shell: ShellStateService;
  let kaypachaFalso: { categorias: ReturnType<typeof signal<CategoriaRanking[]>>; cargarCategorias: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    kaypachaFalso = { categorias: signal<CategoriaRanking[]>([]), cargarCategorias: vi.fn() };

    TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideRouter([]), { provide: KaypachaService, useValue: kaypachaFalso }],
    });
    shell = TestBed.inject(ShellStateService);
  });

  it('carga las categorías de ranking-k al construirse', () => {
    TestBed.createComponent(InicioComponent).detectChanges();
    expect(kaypachaFalso.cargarCategorias).toHaveBeenCalled();
  });

  it('primerNombre() toma solo el primer nombre del usuario activo', () => {
    shell.setUsuarioActivo({
      id: 'u-1',
      nombre: 'Ana María Torres',
      email: 'ana.torres@confianza.pe',
      rol: 'admin-sistema',
      subsistemas: [],
    } as UsuarioActivo);

    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['primerNombre']()).toBe('Ana');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¡Hola, Ana!');
  });

  it('primerNombre() es vacío sin usuario activo', () => {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['primerNombre']()).toBe('');
  });

  it('muestra la cantidad de categorías de ranking-k y enlaza a /app/ranking-k', () => {
    kaypachaFalso.categorias.set([{ name: 'A', reportType: 'x', rdestip: '1' }, { name: 'B', reportType: 'x', rdestip: '2' }]);

    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2 categorías');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/app/ranking-k');
  });
});
