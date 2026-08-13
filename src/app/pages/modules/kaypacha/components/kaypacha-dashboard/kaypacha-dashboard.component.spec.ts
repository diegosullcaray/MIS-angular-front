import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { KaypachaDashboardComponent } from './kaypacha-dashboard.component';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import { KaypachaTourService } from '../../services/kaypacha-tour.service';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';

describe('KaypachaDashboardComponent', () => {
  let serviceFalso: {
    cargarDatos: ReturnType<typeof vi.fn>;
    limpiar: ReturnType<typeof vi.fn>;
    cargarListaColaboradores: ReturnType<typeof vi.fn>;
    posicion: ReturnType<typeof signal<string | number>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    cargandoColaboradores: ReturnType<typeof signal<boolean>>;
    headers1: ReturnType<typeof signal<unknown[]>>;
    headers1_1: ReturnType<typeof signal<unknown[]>>;
    dataSources1: ReturnType<typeof signal<unknown[]>>;
    headers2: ReturnType<typeof signal<unknown[]>>;
    headers2_2: ReturnType<typeof signal<unknown[]>>;
    dataSources2: ReturnType<typeof signal<unknown[]>>;
    nombreUsuario: ReturnType<typeof signal<string>>;
    cargo: ReturnType<typeof signal<string>>;
    puntajeFinal: ReturnType<typeof signal<string | number>>;
    permitirBusqueda: ReturnType<typeof signal<boolean>>;
    colaboradores: ReturnType<typeof signal<KaypachaColaboradorItem[]>>;
  };
  let tourFalso: { iniciarTourGuiado: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    serviceFalso = {
      cargarDatos: vi.fn(),
      limpiar: vi.fn(),
      cargarListaColaboradores: vi.fn(),
      posicion: signal<string | number>('-'),
      loading: signal(false),
      error: signal<string | null>(null),
      cargandoColaboradores: signal(false),
      headers1: signal([]),
      headers1_1: signal([]),
      dataSources1: signal([]),
      headers2: signal([]),
      headers2_2: signal([]),
      dataSources2: signal([]),
      nombreUsuario: signal(''),
      cargo: signal(''),
      puntajeFinal: signal<string | number>('0'),
      permitirBusqueda: signal(true),
      colaboradores: signal<KaypachaColaboradorItem[]>([]),
    };
    tourFalso = { iniciarTourGuiado: vi.fn() };

    TestBed.configureTestingModule({
      imports: [KaypachaDashboardComponent],
      providers: [
        { provide: KaypachaDashboardService, useValue: serviceFalso },
        { provide: KaypachaTourService, useValue: tourFalso },
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(KaypachaDashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga los datos del usuario activo al iniciar', () => {
    crear();
    expect(serviceFalso.cargarDatos).toHaveBeenCalledWith();
  });

  it('limpia el estado en memoria al destruirse', () => {
    const fixture = crear();
    fixture.destroy();
    expect(serviceFalso.limpiar).toHaveBeenCalled();
  });

  it('abrirBuscador() precarga la lista de colaboradores y muestra el diálogo', () => {
    const fixture = crear();
    fixture.componentInstance['abrirBuscador']();

    expect(serviceFalso.cargarListaColaboradores).toHaveBeenCalled();
    expect(fixture.componentInstance['mostrarDialogBuscador']()).toBe(true);
  });

  it('onColaboradorSeleccionado() vuelve a cargar los datos para el colaborador elegido', () => {
    const fixture = crear();
    const colaborador = { cod_bt: 'BT-002', des_col: 'Beto' } as KaypachaColaboradorItem;

    fixture.componentInstance['onColaboradorSeleccionado'](colaborador);

    expect(serviceFalso.cargarDatos).toHaveBeenCalledWith('BT-002');
  });

  it('limpiarTodo() limpia el estado y vuelve a cargar los datos por defecto', () => {
    const fixture = crear();
    fixture.componentInstance['limpiarTodo']();

    expect(serviceFalso.limpiar).toHaveBeenCalled();
    expect(serviceFalso.cargarDatos).toHaveBeenLastCalledWith();
  });

  it('iniciarTour() delega en KaypachaTourService', () => {
    const fixture = crear();
    fixture.componentInstance['iniciarTour']();

    expect(tourFalso.iniciarTourGuiado).toHaveBeenCalled();
  });

  it('imagenMedalla usa la medalla de podio para posiciones del 1 al 20', () => {
    serviceFalso.posicion.set(5);
    const fixture = crear();

    expect(fixture.componentInstance['imagenMedalla']).toContain('PlataformaMIS2.png');
  });

  it('imagenMedalla usa la imagen por defecto fuera del rango 1-20', () => {
    serviceFalso.posicion.set(45);
    const fixture = crear();

    expect(fixture.componentInstance['imagenMedalla']).toContain('PlataformaMIS1.png');
  });

  it('imagenMedalla usa la imagen por defecto cuando la posición no es un número ("-")', () => {
    serviceFalso.posicion.set('-');
    const fixture = crear();

    expect(fixture.componentInstance['imagenMedalla']).toContain('PlataformaMIS1.png');
  });
});
