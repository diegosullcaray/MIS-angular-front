import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { KaypachaHomeComponent } from './kaypacha-home.component';
import { KaypachaService } from '../../services/kaypacha.service';
import type { CategoriaRanking } from '../../models';

describe('KaypachaHomeComponent', () => {
  let kaypachaFalso: { ruta: string; categorias: ReturnType<typeof signal<CategoriaRanking[]>>; cargarCategorias: ReturnType<typeof vi.fn>; cargando: ReturnType<typeof signal<boolean>>; error: ReturnType<typeof signal<string | null>> };
  let router: Router;

  beforeEach(() => {
    kaypachaFalso = {
      ruta: '/app/ranking-k',
      categorias: signal<CategoriaRanking[]>([]),
      cargarCategorias: vi.fn(),
      cargando: signal(false),
      error: signal<string | null>(null),
    };

    TestBed.configureTestingModule({
      imports: [KaypachaHomeComponent],
      providers: [provideRouter([]), { provide: KaypachaService, useValue: kaypachaFalso }],
    });
    router = TestBed.inject(Router);
  });

  it('carga las categorías al construirse', () => {
    TestBed.createComponent(KaypachaHomeComponent).detectChanges();
    expect(kaypachaFalso.cargarCategorias).toHaveBeenCalled();
  });

  it('sin categorías cargadas, no navega', () => {
    const navSpy = vi.spyOn(router, 'navigate');
    TestBed.createComponent(KaypachaHomeComponent).detectChanges();

    expect(navSpy).not.toHaveBeenCalled();
  });

  it('en cuanto llega la primera categoría, navega directo a su detalle (reemplazando la URL)', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(KaypachaHomeComponent);
    fixture.detectChanges();

    kaypachaFalso.categorias.set([
      { name: 'Zona Norte', reportType: 'Medal', rdestip: 'z1' },
      { name: 'Zona Sur', reportType: 'Medal', rdestip: 'z2' },
    ]);
    fixture.detectChanges();

    expect(navSpy).toHaveBeenCalledWith(['/app/ranking-k', 'categoria', 'z1'], { replaceUrl: true });
  });
});
