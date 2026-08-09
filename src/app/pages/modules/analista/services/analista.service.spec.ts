import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AnalistaService } from './analista.service';
import { ModSeccionesService } from '../../../../core/winder/instances/mod-secciones.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { ResumenDashboard } from '../models';

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

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

describe('AnalistaService', () => {
  let service: AnalistaService;
  let shell: ShellStateService;
  let ant: {
    getResumenDashboard: ReturnType<typeof vi.fn>;
    getHistoricoVariable: ReturnType<typeof vi.fn>;
    getDetalleCliente: ReturnType<typeof vi.fn>;
    getListaPrioLeads: ReturnType<typeof vi.fn>;
    getListaBecas: ReturnType<typeof vi.fn>;
    postProsBecas: ReturnType<typeof vi.fn>;
  };
  let antAdmin: { getBaseHierarchy: ReturnType<typeof vi.fn>; getListPick01: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ant = {
      getResumenDashboard: vi.fn(),
      getHistoricoVariable: vi.fn(),
      getDetalleCliente: vi.fn(),
      getListaPrioLeads: vi.fn(),
      getListaBecas: vi.fn(),
      postProsBecas: vi.fn(),
    };
    antAdmin = { getBaseHierarchy: vi.fn(), getListPick01: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModSeccionesService, useValue: ant },
        { provide: ModSysAdminService, useValue: antAdmin },
      ],
    });
    service = TestBed.inject(AnalistaService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('esAdmin() delega en ShellStateService.esAdmin()', () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    expect(service.esAdmin()).toBe(false);
    shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdmin()).toBe(true);
  });

  it('usarColaboradorPropio() fija colaboradorActivo con los datos de la sesión', () => {
    service.usarColaboradorPropio();
    expect(service.colaboradorActivo()).toEqual({ codBt: 'BT-001', nombre: 'Ana Torres' });
  });

  it('establecerColaborador() fija colaboradorActivo con el ítem elegido', () => {
    service.establecerColaborador({ cod_sec: 'SEC-9', des_sec: 'Juan Pérez' });
    expect(service.colaboradorActivo()).toEqual({ codBt: 'SEC-9', nombre: 'Juan Pérez' });
  });

  it('obtenerDashboard() pide dashboard.resumen y devuelve resultado', async () => {
    const resumen: ResumenDashboard = {
      prof: [{ lab: 'DNI', val: '12345678' }],
      data: {
        nom: 'Ana', car: 'Analista', cod_bt: 'BT-001', f4: '2026-08-09',
        sal_cap: 100, mon_des: 50, mor_1: 5, mor_30: 2,
        f1: 'Ago', f2: 'Jul', f3: 'Jun', sal_cap_ant: 90, sal_cap_mant: 80,
        da_t1: 1, da_t2: 2, da_t3: 3, da_t4: 4, da_t5: 5, da_t6: 6,
      },
      cli_cre: [{ num_doc: '1', nom: 'Cliente 1', opes: 2, sal_cap: 300 }],
      h_cods: [{ cod: 'sal', des: 'Saldo' }],
    };
    ant.getResumenDashboard.mockReturnValue(of(respuesta({ resultado: resumen })));

    const resultado = await new Promise((resolve) => service.obtenerDashboard('BT-001').subscribe(resolve));

    expect(ant.getResumenDashboard).toHaveBeenCalledWith('BT-001');
    expect(resultado).toEqual(resumen);
  });

  it('obtenerDashboard() devuelve null si el backend no trae resultado', async () => {
    ant.getResumenDashboard.mockReturnValue(of(respuesta({})));
    const resultado = await new Promise((resolve) => service.obtenerDashboard('BT-001').subscribe(resolve));
    expect(resultado).toBeNull();
  });

  it('obtenerHistoricoVariable() pide dashboard.historico y devuelve resultado', async () => {
    const historico = { meta: { s1: 'Serie 1', s2: 'Serie 2', s3: 'Serie 3' }, his_1: [1, 2], his_2: [3, 4], his_3: [5, 6] };
    ant.getHistoricoVariable.mockReturnValue(of(respuesta({ resultado: historico })));

    const resultado = await new Promise((resolve) => service.obtenerHistoricoVariable('BT-001', 'sal').subscribe(resolve));

    expect(ant.getHistoricoVariable).toHaveBeenCalledWith('BT-001', 'sal');
    expect(resultado).toEqual(historico);
  });

  it('obtenerDetalleCliente() pide dashboard.cliente y devuelve resultado.prof', async () => {
    ant.getDetalleCliente.mockReturnValue(of(respuesta({ resultado: { prof: [{ lab: 'DNI', val: '1' }] } })));

    const filas = await new Promise((resolve) =>
      service.obtenerDetalleCliente('BT-001', '12345678', 1, 604).subscribe(resolve)
    );

    expect(ant.getDetalleCliente).toHaveBeenCalledWith('BT-001', '12345678', 1, 604);
    expect(filas).toEqual([{ lab: 'DNI', val: '1' }]);
  });

  it('obtenerListaPrioLeads()/obtenerListaBecas() devuelven un arreglo vacío si no hay resultado', async () => {
    ant.getListaPrioLeads.mockReturnValue(of(respuesta({})));
    ant.getListaBecas.mockReturnValue(of(respuesta({})));

    expect(await new Promise((resolve) => service.obtenerListaPrioLeads('BT-001').subscribe(resolve))).toEqual([]);
    expect(await new Promise((resolve) => service.obtenerListaBecas('BT-001').subscribe(resolve))).toEqual([]);
  });

  it('prospectarBeca() interpreta result.code === 200 como éxito', async () => {
    ant.postProsBecas.mockReturnValue(of({ body: { result: { code: 200, fec_pro: '2026-08-09' } } }));

    const r = await new Promise((resolve) =>
      service.prospectarBeca('BT-001', '12345678', 'Interesado').subscribe(resolve)
    );

    expect(ant.postProsBecas).toHaveBeenCalledWith('BT-001', '12345678', 'Interesado');
    expect(r).toEqual({ exito: true, fecPro: '2026-08-09' });
  });

  it('prospectarBeca() interpreta cualquier otro código como fallo', async () => {
    ant.postProsBecas.mockReturnValue(of({ body: { result: { code: 500 } } }));
    const r = await new Promise((resolve) => service.prospectarBeca('BT-001', '1', 'x').subscribe(resolve));
    expect(r).toEqual({ exito: false, fecPro: undefined });
  });

  it('obtenerAnclaAdmin() pide base_hier (cod_jer=9) y devuelve el primer nodo con flag_1 en {0,1}', async () => {
    antAdmin.getBaseHierarchy.mockReturnValue(
      of(
        respuesta({
          base_hierarchy: [
            { tip_cod: 4, cod_rel: 'X1', flag_1: 2 },
            { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', flag_1: 1 },
          ],
        })
      )
    );

    const ancla = await new Promise((resolve) => service.obtenerAnclaAdmin().subscribe(resolve));

    expect(antAdmin.getBaseHierarchy).toHaveBeenCalledWith('ana.torres@confianza.pe', 9);
    expect(ancla).toEqual({ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', flag_1: 1 });
  });

  it('obtenerColaboradores() pide list_pick_01 y devuelve list_res', async () => {
    antAdmin.getListPick01.mockReturnValue(of(respuesta({ list_res: [{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }] })));

    const lista = await new Promise((resolve) => service.obtenerColaboradores(7, '231').subscribe(resolve));

    expect(antAdmin.getListPick01).toHaveBeenCalledWith(7, '231');
    expect(lista).toEqual([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }]);
  });
});
