import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { PrincipalComponent } from './principal.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemAvance, ItemSuperPlus, PerfilUsuarioIncentivo } from '../../models';

// jsdom no implementa ResizeObserver — lo usan internamente varios componentes de PrimeNG.
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('PrincipalComponent', () => {
  let incentivosFalso: {
    iniciar: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    requiereSeleccionInicial: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    cargando: ReturnType<typeof signal<boolean>>;
    perfil: ReturnType<typeof signal<PerfilUsuarioIncentivo | null>>;
    semaforo: ReturnType<typeof signal<unknown[]>>;
    avances: ReturnType<typeof signal<unknown[]>>;
    superPlus: ReturnType<typeof signal<unknown[]>>;
    tablaVariables: ReturnType<typeof signal<unknown[]>>;
    tablaEfectividad: ReturnType<typeof signal<unknown[]>>;
    calculadora: ReturnType<typeof signal<unknown>>;
    monetizado: ReturnType<typeof signal<unknown>>;
    puedeElegirNivel: ReturnType<typeof signal<boolean>>;
    nivelesSelector: unknown[];
    fechaActual: ReturnType<typeof signal<string>>;
    seleccionarFecha: ReturnType<typeof vi.fn>;
    fechaCorte: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;

    incentivosFalso = {
      iniciar: vi.fn(),
      actualizar: vi.fn(),
      requiereSeleccionInicial: signal(false),
      error: signal<string | null>(null),
      cargando: signal(false),
      perfil: signal<PerfilUsuarioIncentivo | null>({ nombre: 'Juan Pérez', nivel: 'CARGO', descripcionNivel: 'Asesor', imagenUrl: '' }),
      semaforo: signal([]),
      avances: signal([]),
      superPlus: signal([]),
      tablaVariables: signal([]),
      tablaEfectividad: signal([]),
      calculadora: signal({
        variables: [], plus: [], bonoBase: 0, bonoPlus: 0, bonoSuperPlus: 0, bonoTotal: 0, activo: 0, margenRenovacion: 0, claseUsuario: 0,
      }),
      monetizado: signal({
        bonoBase: 0, bonoPlus: 0, bonoSuperPlus: 0, bonoTotal: 0, codigoSituacion: 0, descripcionSituacion: '--',
        puedeSimular: false, modelo: '2026', modeloDescripcion: 'M2026', mostrarModelo: false, fechasHabilitadas: [],
      }),
      puedeElegirNivel: signal(false),
      nivelesSelector: [],
      fechaActual: signal('20260115'),
      seleccionarFecha: vi.fn(),
      fechaCorte: vi.fn().mockReturnValue('20260115'),
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al construirse, llama a iniciar()', () => {
    crear();
    expect(incentivosFalso.iniciar).toHaveBeenCalled();
  });

  it('si requiereSeleccionInicial es true, abre el selector de nivel automáticamente', () => {
    incentivosFalso.requiereSeleccionInicial.set(true);
    const fixture = crear();
    expect(fixture.componentInstance['mostrarSelector']()).toBe(true);
  });

  it('si requiereSeleccionInicial es false, no abre el selector', () => {
    const fixture = crear();
    expect(fixture.componentInstance['mostrarSelector']()).toBe(false);
  });

  it('abrirSelector()/abrirCalculadora() abren sus diálogos respectivos', () => {
    const fixture = crear();
    fixture.componentInstance['abrirSelector']();
    expect(fixture.componentInstance['mostrarSelector']()).toBe(true);

    fixture.componentInstance['abrirCalculadora']();
    expect(fixture.componentInstance['mostrarCalculadora']()).toBe(true);
  });

  it('actualizar() delega en el servicio', () => {
    const fixture = crear();
    fixture.componentInstance['actualizar']();
    expect(incentivosFalso.actualizar).toHaveBeenCalled();
  });

  it('abrirDetalleAvance() arma detalleActivo con req="getDetail" y card=true, y abre el diálogo de variable', () => {
    const fixture = crear();
    const item: ItemAvance = { id: 'car', des: 'Cartera', icono: 'pi pi-briefcase', val: 0.5, per: 50, sit: 1, show: true, enab: true };

    fixture.componentInstance['abrirDetalleAvance']({ item, codVar: 91 });

    expect(fixture.componentInstance['detalleActivo']()).toEqual({ titulo: 'Cartera', icono: 'pi pi-briefcase', req: 'getDetail', codVar: 91, card: true });
    expect(fixture.componentInstance['mostrarDetalleVariable']()).toBe(true);
  });

  it('abrirDetalleTabla() arma detalleActivo con req="getDetail" y card=true, y abre el diálogo de variable', () => {
    const fixture = crear();

    fixture.componentInstance['abrirDetalleTabla']({ codVar: 4, titulo: 'Efect. -30 a 0 días', icono: 'pi pi-clock' });

    expect(fixture.componentInstance['detalleActivo']()).toEqual({ titulo: 'Efect. -30 a 0 días', icono: 'pi pi-clock', req: 'getDetail', codVar: 4, card: true });
    expect(fixture.componentInstance['mostrarDetalleVariable']()).toBe(true);
  });

  it('abrirDetalleSuperPlus() con comp=1 abre el diálogo de variable con los parámetros del ítem', () => {
    const fixture = crear();
    const item: ItemSuperPlus = {
      id: 'prod', des: 'Productividad', icono: 'pi pi-star', val: 10, show: true, enab: true, estado: 1,
      parametros: { comp: 1, req: 'getProd', card: true, typ: 'sp' },
    };

    fixture.componentInstance['abrirDetalleSuperPlus']({ item, codVar: 1 });

    expect(fixture.componentInstance['detalleActivo']()).toEqual({ titulo: 'Productividad', icono: 'pi pi-star', req: 'getProd', codVar: 1, card: true });
    expect(fixture.componentInstance['mostrarDetalleVariable']()).toBe(true);
    expect(fixture.componentInstance['mostrarDetalleBancarizacion']()).toBe(false);
  });

  it('abrirDetalleSuperPlus() con comp=2 abre el diálogo de bancarización en vez del de variable', () => {
    const fixture = crear();
    const item: ItemSuperPlus = {
      id: 'clib', des: 'Bancarización', icono: 'pi pi-id-card', val: 5, show: true, enab: true, estado: 1,
      parametros: { comp: 2, req: 'getCliBanc', card: false },
    };

    fixture.componentInstance['abrirDetalleSuperPlus']({ item, codVar: 4 });

    expect(fixture.componentInstance['mostrarDetalleBancarizacion']()).toBe(true);
    expect(fixture.componentInstance['mostrarDetalleVariable']()).toBe(false);
    expect(fixture.componentInstance['detalleActivo']()).toBeNull();
  });
});
