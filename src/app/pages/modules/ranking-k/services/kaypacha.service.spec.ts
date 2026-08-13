import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { KaypachaService } from './kaypacha.service';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
    codBt: 'BT-001',
    ...overrides,
  };
}

function respuestaCategorias(categorias: unknown[]): IWinderResponse {
  return { code: '0', headers: {}, body: { resultado: { list: [{ JSONLIST: JSON.stringify(categorias) }] } } };
}

describe('KaypachaService', () => {
  let service: KaypachaService;
  let shell: ShellStateService;
  let getListRankingSpy: ReturnType<typeof vi.fn>;
  let getDetalleRankingSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getListRankingSpy = vi.fn();
    getDetalleRankingSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: ModKaypachaService, useValue: { getListRanking: getListRankingSpy, getDetalleRanking: getDetalleRankingSpy } },
      ],
    });
    service = TestBed.inject(KaypachaService);
    shell = TestBed.inject(ShellStateService);
  });

  it('ruta apunta a /app/ranking-k', () => {
    expect(service.ruta).toBe('/app/ranking-k');
  });

  it('cargarCategorias() no pide nada sin cod_bt', () => {
    shell.setUsuarioActivo(usuario({ codBt: undefined }));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.cargarCategorias();

    expect(getListRankingSpy).not.toHaveBeenCalled();
    expect(service.error()).toBe('No se pudo determinar tu código de negocio/agencia.');
    expect(service.cargando()).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('cargarCategorias() pide la lista con el cod_bt del usuario activo y la parsea', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));
    getListRankingSpy.mockReturnValue(of(respuestaCategorias([{ name: 'A', reportType: 'Medal', rdestip: '1' }])));

    service.cargarCategorias();

    expect(getListRankingSpy).toHaveBeenCalledWith('BT-001');
    expect(service.categorias()).toEqual([{ name: 'A', reportType: 'Medal', rdestip: '1' }]);
    expect(service.cargando()).toBe(false);
  });

  it('cargarCategorias() solo pide la lista una vez por sesión', () => {
    shell.setUsuarioActivo(usuario());
    getListRankingSpy.mockReturnValue(of(respuestaCategorias([])));

    service.cargarCategorias();
    service.cargarCategorias();

    expect(getListRankingSpy).toHaveBeenCalledTimes(1);
  });

  it('recargarCategorias() fuerza una nueva petición aunque ya se hubiera cargado antes', () => {
    shell.setUsuarioActivo(usuario());
    getListRankingSpy.mockReturnValue(of(respuestaCategorias([])));
    service.cargarCategorias();

    service.recargarCategorias();

    expect(getListRankingSpy).toHaveBeenCalledTimes(2);
  });

  it('en caso de error, permite reintentar', () => {
    shell.setUsuarioActivo(usuario());
    getListRankingSpy.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    service.cargarCategorias();
    expect(service.error()).toBe('No se pudo cargar la lista de categorías.');

    getListRankingSpy.mockReturnValue(of(respuestaCategorias([{ name: 'A', reportType: 'x', rdestip: '1' }])));
    service.cargarCategorias();

    expect(getListRankingSpy).toHaveBeenCalledTimes(2);
    expect(service.categorias()).toEqual([{ name: 'A', reportType: 'x', rdestip: '1' }]);
  });

  it('buscarCategoria() compara rdestip como string', () => {
    shell.setUsuarioActivo(usuario());
    getListRankingSpy.mockReturnValue(of(respuestaCategorias([{ name: 'A', reportType: 'x', rdestip: 1 }])));
    service.cargarCategorias();

    expect(service.buscarCategoria('1')).toEqual({ name: 'A', reportType: 'x', rdestip: 1 });
    expect(service.buscarCategoria('2')).toBeUndefined();
  });

  it('panelPara() arma el panel con la sección "Categoría" y las rutas de detalle', () => {
    shell.setUsuarioActivo(usuario());
    getListRankingSpy.mockReturnValue(of(respuestaCategorias([{ name: 'Zona Norte', reportType: 'x', rdestip: 'z1' }])));
    service.cargarCategorias();

    const panel = service.panelPara('Ranking Kaypacha', 'pi pi-trophy');

    expect(panel).toEqual({
      tipo: 'host-admin',
      titulo: 'Ranking Kaypacha',
      icono: 'pi pi-trophy',
      secciones: [{ titulo: 'Categoría', rutas: [{ etiqueta: 'Zona Norte', ruta: '/app/ranking-k/categoria/z1' }] }],
    });
  });

  it('obtenerDetalle() devuelve las filas y la fecha de actualización cuando el backend la trae', async () => {
    const body = {
      resultado: {
        list: [{ JSONLIST: JSON.stringify([{ ROWNUMBER: 1, HCOLNOM: 'Ana', TOTAL_MES: 500, hdester: 'Norte' }]) }],
        datTable: [{ fechaMax: '2026-08-01' }],
      },
    };
    getDetalleRankingSpy.mockReturnValue(of({ code: '0', headers: {}, body }));

    const resultado = await new Promise((resolve) => service.obtenerDetalle('z1').subscribe(resolve));

    expect(resultado).toEqual({
      filas: [{ ROWNUMBER: 1, HCOLNOM: 'Ana', TOTAL_MES: 500, hdester: 'Norte' }],
      fechaActualizacion: '2026-08-01',
    });
  });

  it('obtenerDetalle() devuelve fechaActualizacion null cuando datTable no es un arreglo', async () => {
    const body = { resultado: { list: [{ JSONLIST: '[]' }], datTable: 'no-es-un-arreglo' } };
    getDetalleRankingSpy.mockReturnValue(of({ code: '0', headers: {}, body }));

    const resultado = await new Promise((resolve) => service.obtenerDetalle('z1').subscribe(resolve));

    expect(resultado).toEqual({ filas: [], fechaActualizacion: null });
  });
});
