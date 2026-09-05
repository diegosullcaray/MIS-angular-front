import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PresupuestoService } from './presupuesto.service';
import { ModPresupuestoService } from '../../../../core/winder/instances/mod-presupuesto.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { ResumenLineaSimple } from '../models/linea-simple.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1', nombre: 'Ana Torres', email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema', subsistemas: [], codBt: 'BT-001',
    ...overrides,
  };
}

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

const RESUMEN: ResumenLineaSimple = {
  ws: [{ ord: 1, a1: 100 }],
  bp: { tip_cod_edi: 4, ord_ini_edi: 1, act_res: true, cod_sec: 'SEC-1' },
};

interface AntFalso {
  getRegResultados: ReturnType<typeof vi.fn>; postRegResultados: ReturnType<typeof vi.fn>;
  getLogVerificaciones: ReturnType<typeof vi.fn>; postLogVerificaciones: ReturnType<typeof vi.fn>;
  getResCarCreditos: ReturnType<typeof vi.fn>; postResCarCreditos: ReturnType<typeof vi.fn>;
  getResDepBP: ReturnType<typeof vi.fn>; postResDepBP: ReturnType<typeof vi.fn>;
  getResDepRed: ReturnType<typeof vi.fn>; postResDepRed: ReturnType<typeof vi.fn>;
  getResSegComercial: ReturnType<typeof vi.fn>; postResSegComercial: ReturnType<typeof vi.fn>;
  getResSegOperaciones: ReturnType<typeof vi.fn>; postResSegOperaciones: ReturnType<typeof vi.fn>;
}

interface AntAdminFalso {
  getBaseHierarchy: ReturnType<typeof vi.fn>;
  getLevelHierarchy: ReturnType<typeof vi.fn>;
}

describe('PresupuestoService', () => {
  let service: PresupuestoService;
  let shell: ShellStateService;
  let ant: AntFalso;
  let antAdmin: AntAdminFalso;

  beforeEach(() => {
    ant = {
      getRegResultados: vi.fn(), postRegResultados: vi.fn(),
      getLogVerificaciones: vi.fn(), postLogVerificaciones: vi.fn(),
      getResCarCreditos: vi.fn(), postResCarCreditos: vi.fn(),
      getResDepBP: vi.fn(), postResDepBP: vi.fn(),
      getResDepRed: vi.fn(), postResDepRed: vi.fn(),
      getResSegComercial: vi.fn(), postResSegComercial: vi.fn(),
      getResSegOperaciones: vi.fn(), postResSegOperaciones: vi.fn(),
    };
    antAdmin = { getBaseHierarchy: vi.fn(), getLevelHierarchy: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModPresupuestoService, useValue: ant },
        { provide: ModSysAdminService, useValue: antAdmin },
      ],
    });
    service = TestBed.inject(PresupuestoService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('esAdmin() delega en ShellStateService.esAdmin()', () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    expect(service.esAdmin()).toBe(false);

    shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdmin()).toBe(true);
  });





  it('obtenerResponsables() parsea resultado.list[0].JSONLIST (igual que kaypacha.listRanking)', async () => {
    const filas = [{ des_rel: 'Ag. 1', cod_res: 'ana@confianza.pe', usu_log: 'x', tim_log: '10:00' }];
    ant.getRegResultados.mockReturnValue(of(respuesta({ resultado: { list: [{ JSONLIST: JSON.stringify(filas) }] } })));

    const resultado = await new Promise((resolve) => service.obtenerResponsables(11).subscribe(resolve));

    expect(resultado).toEqual(filas);
  });

  it('guardarResponsables() pasa el cod_bt del usuario activo', () => {
    ant.postRegResultados.mockReturnValue(of({}));
    service.guardarResponsables([{ des_rel: 'Ag. 1', cod_res: 'x', usu_log: 'y', tim_log: 'z' }]).subscribe();

    expect(ant.postRegResultados).toHaveBeenCalledWith(
      'BT-001',
      [{ des_rel: 'Ag. 1', cod_res: 'x', usu_log: 'y', tim_log: 'z' }]
    );
  });

  it('obtenerLogVerificaciones() parsea resultado.list[0].JSONLIST', async () => {
    const filas = [{ des_rel: 'Línea 1', cod_est: 1, usu_log: 'ana', tim_log: '09:00' }];
    ant.getLogVerificaciones.mockReturnValue(of(respuesta({ resultado: { list: [{ JSONLIST: JSON.stringify(filas) }] } })));

    const resultado = await new Promise((resolve) => service.obtenerLogVerificaciones(7, 'SEC-1').subscribe(resolve));

    expect(ant.getLogVerificaciones).toHaveBeenCalledWith(7, 'SEC-1');
    expect(resultado).toEqual(filas);
  });

  it('verificar() pasa el cod_bt del usuario activo a postLogVerificaciones()', () => {
    ant.postLogVerificaciones.mockReturnValue(of({}));
    service.verificar(7, 'REL-1', 'SEC-1').subscribe();

    expect(ant.postLogVerificaciones).toHaveBeenCalledWith('BT-001', 7, 'REL-1', 'SEC-1');
  });

  it('obtenerResumenCarteraCreditos() lee "resumen" directo del body (sin envoltura JSONLIST)', async () => {
    const resumenCC = { ...RESUMEN, cs: [{ ord: 1, d_1: 500 }] };
    ant.getResCarCreditos.mockReturnValue(of(respuesta({ resumen: resumenCC })));

    const resultado = await new Promise((resolve) => service.obtenerResumenCarteraCreditos(9, 'REL-1').subscribe(resolve));

    expect(ant.getResCarCreditos).toHaveBeenCalledWith('ana.torres@confianza.pe', 9, 'REL-1');
    expect(resultado).toEqual(resumenCC);
  });

  it('obtenerResumenCarteraCreditos() devuelve un resumen vacío si el backend no trae "resumen"', async () => {
    ant.getResCarCreditos.mockReturnValue(of(respuesta({})));
    const resultado = await new Promise((resolve) => service.obtenerResumenCarteraCreditos(9, 'REL-1').subscribe(resolve));
    expect(resultado).toEqual({ ws: [], bp: { tip_cod_edi: 0, ord_ini_edi: 0, act_res: false, cod_sec: '' } });
  });

  it.each([
    ['obtenerResumenDepBP', 'getResDepBP'],
    ['obtenerResumenDepRed', 'getResDepRed'],
    ['obtenerResumenSegComercial', 'getResSegComercial'],
    ['obtenerResumenSegOperaciones', 'getResSegOperaciones'],
  ] as const)('%s() delega en %s() y devuelve el resumen parseado', async (metodoServicio, metodoAnt) => {
    ant[metodoAnt].mockReturnValue(of(respuesta({ resumen: RESUMEN })));

    const resultado = await new Promise((resolve) => (service[metodoServicio] as (a: number, b: string) => any)(9, 'REL-1').subscribe(resolve));

    expect(ant[metodoAnt]).toHaveBeenCalledWith('ana.torres@confianza.pe', 9, 'REL-1');
    expect(resultado).toEqual(RESUMEN);
  });

  it.each([
    ['guardarResumenDepBP', 'postResDepBP'],
    ['guardarResumenDepRed', 'postResDepRed'],
    ['guardarResumenSegComercial', 'postResSegComercial'],
    ['guardarResumenSegOperaciones', 'postResSegOperaciones'],
  ] as const)('%s() delega en %s() con el cod_bt del usuario activo', (metodoServicio, metodoAnt) => {
    ant[metodoAnt].mockReturnValue(of({}));
    (service[metodoServicio] as (a: number, b: string, c: unknown[]) => any)(9, 'REL-1', [{ ord: 1 }]).subscribe();

    expect(ant[metodoAnt]).toHaveBeenCalledWith('BT-001', 9, 'REL-1', [{ ord: 1 }]);
  });
});
