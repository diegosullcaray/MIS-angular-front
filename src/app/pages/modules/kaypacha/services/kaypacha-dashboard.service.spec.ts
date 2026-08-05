import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { KaypachaDashboardService } from './kaypacha-dashboard.service';
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

describe('KaypachaDashboardService', () => {
  let service: KaypachaDashboardService;
  let shell: ShellStateService;
  let getColaboradoresDataSpy: ReturnType<typeof vi.fn>;
  let getUserListsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getColaboradoresDataSpy = vi.fn();
    getUserListsSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: ModKaypachaService, useValue: { getColaboradoresData: getColaboradoresDataSpy, getUserLists: getUserListsSpy } },
      ],
    });
    service = TestBed.inject(KaypachaDashboardService);
    shell = TestBed.inject(ShellStateService);
  });

  it('cargarDatos() usa el cod_bt del usuario activo cuando no se pasa uno explícito', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));
    getColaboradoresDataSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: {} } } as IWinderResponse));

    service.cargarDatos();

    expect(getColaboradoresDataSpy).toHaveBeenCalledWith('BT-001');
  });

  it('cargarDatos(codBT) prioriza el código explícito sobre el del usuario activo', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));
    getColaboradoresDataSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: {} } } as IWinderResponse));

    service.cargarDatos('BT-999');

    expect(getColaboradoresDataSpy).toHaveBeenCalledWith('BT-999');
  });

  it('cargarDatos() parsea las tablas/cabeceras y los puntos del resultado', () => {
    getColaboradoresDataSpy.mockReturnValue(
      of({
        code: '0',
        headers: {},
        body: {
          resultado: {
            cab1: [{ JSONNHEAD1: JSON.stringify([{ label: 'DOR', key: 'HDOR' }]) }],
            res1: [{ HDOR: '01' }],
            puntos: { HPUNTAFINAL: '87.5', HDESPOS: 3 },
          },
        },
      } as IWinderResponse)
    );

    service.cargarDatos();

    expect(service.headers1()).toEqual([{ label: 'DOR', key: 'HDOR' }]);
    expect(service.dataSources1()).toEqual([{ HDOR: '01' }]);
    expect(service.puntajeFinal()).toBe('87.5');
    expect(service.posicion()).toBe(3);
    expect(service.loading()).toBe(false);
  });

  it('sin codBT explícito, no muestra nombre/cargo del colaborador (solo al buscar a alguien puntual)', () => {
    getColaboradoresDataSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { datosUsurio: { HDESPER: 'Ana Torres', HDESCAR: 'Asesor' } } } } as IWinderResponse)
    );

    service.cargarDatos();

    expect(service.nombreUsuario()).toBe('');
    expect(service.cargo()).toBe('');
  });

  it('con codBT explícito, sí muestra el nombre/cargo del colaborador buscado', () => {
    getColaboradoresDataSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { datosUsurio: { HDESPER: 'Ana Torres', HDESCAR: 'Asesor' } } } } as IWinderResponse)
    );

    service.cargarDatos('BT-002');

    expect(service.nombreUsuario()).toBe('Ana Torres');
    expect(service.cargo()).toBe('Asesor');
  });

  it('cargarDatos() muestra un mensaje de error si el backend no devuelve resultado', () => {
    getColaboradoresDataSpy.mockReturnValue(of({ code: '0', headers: {}, body: {} } as IWinderResponse));

    service.cargarDatos();

    expect(service.error()).toBe('No se encontraron resultados para este usuario.');
    expect(service.loading()).toBe(false);
  });

  it('cargarDatos() muestra un mensaje de error ante un fallo del backend', () => {
    getColaboradoresDataSpy.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    service.cargarDatos();

    expect(service.error()).toBe('No se pudo cargar la información del tablero Kaypacha.');
    expect(service.loading()).toBe(false);
  });

  it('limpiar() resetea todo el estado en memoria', () => {
    getColaboradoresDataSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { puntos: { HPUNTAFINAL: '99' } } } } as IWinderResponse)
    );
    service.cargarDatos('BT-002');

    service.limpiar();

    expect(service.puntajeFinal()).toBe('0');
    expect(service.posicion()).toBe('-');
    expect(service.dataSources1()).toEqual([]);
    expect(service.colaboradores()).toEqual([]);
    expect(service.error()).toBeNull();
  });

  it('cargarListaColaboradores() pide la lista al backend', () => {
    getUserListsSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: [{ cod_bt: 'BT-002', des_col: 'Beto' }] } } as IWinderResponse));

    service.cargarListaColaboradores();

    expect(getUserListsSpy).toHaveBeenCalled();
    expect(service.colaboradores()).toEqual([{ cod_bt: 'BT-002', des_col: 'Beto' }]);
    expect(service.cargandoColaboradores()).toBe(false);
  });

  it('cargarListaColaboradores() no vuelve a pedir la lista si ya está cargada sin error', () => {
    getUserListsSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: [{ cod_bt: 'BT-002', des_col: 'Beto' }] } } as IWinderResponse));
    service.cargarListaColaboradores();

    service.cargarListaColaboradores();

    expect(getUserListsSpy).toHaveBeenCalledTimes(1);
  });

  it('cargarListaColaboradores() muestra un mensaje de error ante un fallo del backend', () => {
    getUserListsSpy.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    service.cargarListaColaboradores();

    expect(service.errorColaboradores()).toBe('No se pudo cargar la lista de colaboradores.');
    expect(service.cargandoColaboradores()).toBe(false);
  });
});
