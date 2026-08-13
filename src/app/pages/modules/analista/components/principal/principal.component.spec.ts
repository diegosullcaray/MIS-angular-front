import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { PrincipalComponent } from './principal.component';
import { AnalistaService } from '../../services/analista.service';
import type { ColaboradorActivo, ColaboradorItem, NodoJerarquiaAncla } from '../../models/colaborador.model';
import type { ResumenDashboard } from '../../models/dashboard.model';

const ANCLA: NodoJerarquiaAncla = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' };
const COLABORADORES: ColaboradorItem[] = [{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }];

const DASHBOARD: ResumenDashboard = {
  prof: [{ lab: 'DNI', val: '12345678' }],
  data: {
    nom: 'Ana', car: 'Analista', cod_bt: 'BT-001', f4: '2026-08-09',
    sal_cap: 100, mon_des: 50, mor_1: 5, mor_30: 2,
    f1: 'Ago', f2: 'Jul', f3: 'Jun', sal_cap_ant: 90, sal_cap_mant: 80,
    da_t1: 1, da_t2: 2, da_t3: 3, da_t4: 4, da_t5: 5, da_t6: 6,
  },
  cli_cre: [{ num_doc: '1', nom: 'Cliente 1', opes: 2, sal_cap: 300, tip_doc: 1, pais: 604 }],
  h_cods: [{ cod: 'sal', des: 'Saldo' }, { cod: 'des', des: 'Desembolso' }],
};

describe('PrincipalComponent', () => {
  let analistaFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    colaboradorActivo: ReturnType<typeof signal<ColaboradorActivo | null>>;
    usarColaboradorPropio: ReturnType<typeof vi.fn>;
    establecerColaborador: ReturnType<typeof vi.fn>;
    obtenerAnclaAdmin: ReturnType<typeof vi.fn>;
    obtenerColaboradores: ReturnType<typeof vi.fn>;
    obtenerDashboard: ReturnType<typeof vi.fn>;
    obtenerHistoricoVariable: ReturnType<typeof vi.fn>;
    obtenerDetalleCliente: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    analistaFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      colaboradorActivo: signal<ColaboradorActivo | null>(null),
      usarColaboradorPropio: vi.fn(() => analistaFalso.colaboradorActivo.set({ codBt: 'BT-001', nombre: 'Ana Torres' })),
      establecerColaborador: vi.fn((item: ColaboradorItem) =>
        analistaFalso.colaboradorActivo.set({ codBt: item.cod_sec, nombre: item.des_sec })
      ),
      obtenerAnclaAdmin: vi.fn().mockReturnValue(of(ANCLA)),
      obtenerColaboradores: vi.fn().mockReturnValue(of(COLABORADORES)),
      obtenerDashboard: vi.fn().mockReturnValue(of(DASHBOARD)),
      obtenerHistoricoVariable: vi.fn().mockReturnValue(
        of({ meta: { s1: 'A', s2: 'B', s3: 'C' }, his_1: [1, 2], his_2: [3, 4], his_3: [5, 6] })
      ),
      obtenerDetalleCliente: vi.fn().mockReturnValue(of([{ lab: 'DNI', val: '1' }])),
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [provideRouter([]), { provide: AnalistaService, useValue: analistaFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('para un colaborador (no admin), usa su propio codBt y carga el dashboard', () => {
    analistaFalso.esAdmin.mockReturnValue(false);
    const fixture = crear();

    expect(analistaFalso.usarColaboradorPropio).toHaveBeenCalled();
    expect(analistaFalso.obtenerDashboard).toHaveBeenCalledWith('BT-001');
    expect(fixture.componentInstance['dashboard']()).toEqual(DASHBOARD);
  });

  it('al cargar el dashboard, pide el histórico de la primera variable disponible', () => {
    const fixture = crear();
    expect(analistaFalso.obtenerHistoricoVariable).toHaveBeenCalledWith('BT-001', 'sal');
    expect(fixture.componentInstance['datosEvolutivo']()).not.toBeNull();
  });

  it('para un admin, solo prepara el nodo ancla — no carga ningún dashboard hasta elegir colaborador', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    expect(analistaFalso.obtenerAnclaAdmin).toHaveBeenCalled();
    expect(analistaFalso.obtenerDashboard).not.toHaveBeenCalled();
    expect(fixture.componentInstance['dashboard']()).toBeNull();
  });

  it('abrirSelectorColaborador() abre el diálogo y pide la lista de colaboradores usando el nodo ancla', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelectorColaborador']();
    fixture.detectChanges();

    expect(instancia['dialogColaboradorAbierto']()).toBe(true);
    expect(analistaFalso.obtenerColaboradores).toHaveBeenCalledWith(7, '231');
    expect(instancia['colaboradores']()).toEqual(COLABORADORES);
    expect(instancia['cargandoColaboradores']()).toBe(false);
  });

  it('abrirSelectorColaborador() muestra el spinner de carga si se hace click antes de que resuelva el nodo ancla', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    analistaFalso.obtenerAnclaAdmin.mockReturnValue(new Subject<NodoJerarquiaAncla | null>());
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelectorColaborador']();
    fixture.detectChanges();

    expect(instancia['dialogColaboradorAbierto']()).toBe(true);
    expect(instancia['cargandoColaboradores']()).toBe(true);
    expect(analistaFalso.obtenerColaboradores).not.toHaveBeenCalled();
  });

  it('onColaboradorSeleccionado() delega en establecerColaborador() y eso dispara la carga del dashboard', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    fixture.componentInstance['onColaboradorSeleccionado']({ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' });
    fixture.detectChanges();

    expect(analistaFalso.establecerColaborador).toHaveBeenCalledWith({ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' });
    expect(analistaFalso.obtenerDashboard).toHaveBeenCalledWith('SEC-1');
  });

  it('cambiarVariable() pide el histórico de la variable elegida', () => {
    const fixture = crear();
    analistaFalso.obtenerHistoricoVariable.mockClear();

    fixture.componentInstance['cambiarVariable']('des');

    expect(analistaFalso.obtenerHistoricoVariable).toHaveBeenCalledWith('BT-001', 'des');
    expect(fixture.componentInstance['variableActual']()).toBe('des');
  });

  it('abrirDetalleCliente() abre el diálogo y pide el detalle del cliente', () => {
    const fixture = crear();

    fixture.componentInstance['abrirDetalleCliente']({ num_doc: '1', nom: 'Cliente 1', opes: 2, sal_cap: 300, tip_doc: 1, pais: 604 });

    expect(fixture.componentInstance['dialogDetalleAbierto']()).toBe(true);
    expect(analistaFalso.obtenerDetalleCliente).toHaveBeenCalledWith('BT-001', '1', 1, 604);
    expect(fixture.componentInstance['detalleCliente']()).toEqual([{ lab: 'DNI', val: '1' }]);
  });

  it('cargar() sin resultado del backend (null) fija un mensaje de error', () => {
    analistaFalso.obtenerDashboard.mockReturnValue(of(null));
    const fixture = crear();
    expect(fixture.componentInstance['error']()).toContain('BT-001');
  });

  it('cargar() muestra un mensaje de error genérico si falla la petición', () => {
    analistaFalso.obtenerDashboard.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = crear();
    expect(fixture.componentInstance['error']()).toBe('No se pudo cargar el dashboard. Inténtalo de nuevo en unos segundos.');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('reintentar() vuelve a pedir el último dashboard cargado', () => {
    const fixture = crear();
    analistaFalso.obtenerDashboard.mockClear();

    fixture.componentInstance['reintentar']();

    expect(analistaFalso.obtenerDashboard).toHaveBeenCalledWith('BT-001');
  });
});
