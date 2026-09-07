import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecientesService } from './recientes.service';
import { PreferenciasService } from '../preferencias/aplicacion/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../preferencias/infraestructura/preferencias-local-storage.repositorio';
import { MenuStgService } from '../../pages/full-pages/layout/services/menu-stg.service';
import type { SidebarNavRuta } from '../../pages/full-pages/layout/interfaces/sidebar.model';

@Component({ template: '', standalone: true })
class BlancoComponent {}

/**
 * El servicio escucha al router: los tests navegan de verdad y comprueban qué
 * quedó anotado en preferencias.
 */
describe('RecientesService', () => {
  let router: Router;
  let preferencias: PreferenciasService;
  let menu: MenuStgService;

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = ((consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlancoComponent }]),
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
        { provide: MenuStgService, useValue: { hijosPorSistema: () => ({}), buscarPorRuta: () => null } },
      ],
    });

    router = TestBed.inject(Router);
    preferencias = TestBed.inject(PreferenciasService);
    menu = TestBed.inject(MenuStgService);
    TestBed.inject(RecientesService).iniciar();
  });

  async function ir(url: string): Promise<void> {
    await router.navigateByUrl(url);
  }

  it('anota el reporte visitado con la ruta que permite volver', async () => {
    await ir('/app/actividades/dest-credito');

    expect(preferencias.recientes()).toEqual([
      expect.objectContaining({ ruta: '/app/actividades/dest-credito', titulo: 'Destino de Crédito' }),
    ]);
  });

  it('usa las etiquetas del árbol del STG cuando el menú ya cargó', async () => {
    const nodos: SidebarNavRuta[] = [
      { etiqueta: 'Actividad diaria' },
      { etiqueta: 'Cartera Agrícola', ruta: '/app/reportes/agricola' },
    ];
    vi.spyOn(menu, 'buscarPorRuta').mockReturnValue({ sistemaId: 'rep', nodos });

    await ir('/app/reportes/agricola');

    expect(preferencias.recientes()[0]).toEqual(
      expect.objectContaining({ titulo: 'Cartera Agrícola', categoria: 'Actividad diaria' }),
    );
  });

  it('descarta los parámetros de consulta: la ruta es la identidad del reporte', async () => {
    await ir('/app/actividades/dest-credito?fec=2026-01-31');

    expect(preferencias.recientes()[0].ruta).toBe('/app/actividades/dest-credito');
  });

  it('no anota el Home ni las pantallas que no son un reporte', async () => {
    await ir('/app/dashboard');

    expect(preferencias.recientes()).toEqual([]);
  });

  it('no anota los índices de módulo: hacen falta al menos dos segmentos bajo /app', async () => {
    await ir('/app/actividades');

    expect(preferencias.recientes()).toEqual([]);
  });

  it('no duplica un reporte revisitado: lo devuelve al frente', async () => {
    await ir('/app/actividades/dest-credito');
    await ir('/app/actividades/regprosp-corr');
    await ir('/app/actividades/dest-credito');

    expect(preferencias.recientes().map((r) => r.ruta)).toEqual([
      '/app/actividades/dest-credito',
      '/app/actividades/regprosp-corr',
    ]);
  });
});
