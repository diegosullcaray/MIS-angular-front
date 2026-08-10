import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IncentivosService } from './incentivos.service';
import { ModIncentivosService } from '../../../../core/winder/instances/mod-incentivos.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: [],
    codBt: 'BT-001',
    ...overrides,
  };
}

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

const DS_BASE = {
  ds1: [{ cod_var: 1, cie_n: 100 }],
  ds2: [{ cod_var: 4, efec: 0.5 }],
  ds3: { car_avan_fix: 0.8, car_avan_floor: 80, pag1: 0.3, pag2: 0.3, pag3: 0.4, tas_min: 0.01, tas_met: 0.02, mar_ren: 5 },
  ds4: { flag_car: 1, bob_car: 100, bop_car: 20, bos_prod: 30, flag_act: 1 },
};

interface AntFalso {
  getFromHierList: ReturnType<typeof vi.fn>;
  getDataSourcesIndividual: ReturnType<typeof vi.fn>;
  getDataSourcesGrupal: ReturnType<typeof vi.fn>;
  calcularIndividual: ReturnType<typeof vi.fn>;
  calcularGrupal: ReturnType<typeof vi.fn>;
  getDetail: ReturnType<typeof vi.fn>;
  getTasa: ReturnType<typeof vi.fn>;
  getProd: ReturnType<typeof vi.fn>;
  getCliBanc: ReturnType<typeof vi.fn>;
  getRetencion: ReturnType<typeof vi.fn>;
}

interface AntAdminFalso {
  getBaseHierarchy: ReturnType<typeof vi.fn>;
  getListPick01: ReturnType<typeof vi.fn>;
}

describe('IncentivosService', () => {
  let service: IncentivosService;
  let shell: ShellStateService;
  let ant: AntFalso;
  let antAdmin: AntAdminFalso;

  beforeEach(() => {
    ant = {
      getFromHierList: vi.fn(),
      getDataSourcesIndividual: vi.fn().mockReturnValue(of(respuesta({ resultado: DS_BASE }))),
      getDataSourcesGrupal: vi.fn().mockReturnValue(of(respuesta({ resultado: DS_BASE }))),
      calcularIndividual: vi.fn(),
      calcularGrupal: vi.fn(),
      getDetail: vi.fn(),
      getTasa: vi.fn(),
      getProd: vi.fn(),
      getCliBanc: vi.fn(),
      getRetencion: vi.fn(),
    };
    antAdmin = {
      getBaseHierarchy: vi.fn().mockReturnValue(of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231' }] }))),
      getListPick01: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModIncentivosService, useValue: ant },
        { provide: ModSysAdminService, useValue: antAdmin },
      ],
    });
    service = TestBed.inject(IncentivosService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  describe('iniciar() — usuario NO admin (aproximación a SECTORISTA individual)', () => {
    it('carga directo el perfil propio con tip_cod=1/cla_usu=1/cod_rel=codBt, sin selector', () => {
      service.iniciar();

      expect(service.puedeElegirNivel()).toBe(false);
      expect(service.requiereSeleccionInicial()).toBe(false);
      expect(ant.getDataSourcesIndividual).toHaveBeenCalledWith('2026', 1, 'BT-001', expect.any(String));
      expect(service.nivelActual()).toEqual({ tipCod: 1, codRel: 'BT-001', claUsu: 1 });
    });

    it('muestra un error si el usuario activo no tiene codBt y no llama al backend', () => {
      shell.setUsuarioActivo(usuario({ codBt: undefined }));

      service.iniciar();

      expect(service.error()).toBeTruthy();
      expect(ant.getDataSourcesIndividual).not.toHaveBeenCalled();
    });
  });

  describe('iniciar() — usuario admin (aproximación a STAFF)', () => {
    beforeEach(() => {
      vi.spyOn(shell, 'esAdmin').mockReturnValue(true as any);
    });

    it('exige seleccionar un nivel antes de cargar datos y no llama al backend de resultados', () => {
      service.iniciar();

      expect(service.puedeElegirNivel()).toBe(true);
      expect(service.requiereSeleccionInicial()).toBe(true);
      expect(ant.getDataSourcesIndividual).not.toHaveBeenCalled();
      expect(ant.getDataSourcesGrupal).not.toHaveBeenCalled();
    });

    it('precarga la raíz de jerarquía (base_hier, cod_jer=9) para el selector', () => {
      service.iniciar();
      expect(antAdmin.getBaseHierarchy).toHaveBeenCalledWith('ana.torres@confianza.pe', 9);
    });
  });

  describe('seleccionarAsesor()/seleccionarNodoJerarquia()/seleccionarFinancieraConfianza()', () => {
    it('seleccionarAsesor() con cod_gru=1 pide datos individuales y activa mostrarModelo', () => {
      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', des_car: 'Asesor', cod_gru: 1 });

      expect(ant.getDataSourcesIndividual).toHaveBeenCalledWith('2026', 1, 'BT-002', expect.any(String));
      expect(service.perfil()?.nombre).toBe('Juan Pérez');
      expect(service.monetizado().mostrarModelo).toBe(true);
    });

    it('seleccionarAsesor() con cod_gru=2 pide datos grupales y apaga mostrarModelo', () => {
      service.seleccionarAsesor({ cod_sec: 'BT-003', des_sec: 'Grupo X', cod_gru: 2 });

      expect(ant.getDataSourcesGrupal).toHaveBeenCalledWith(1, 'BT-003', expect.any(String));
      expect(service.monetizado().mostrarModelo).toBe(false);
    });

    it('seleccionarNodoJerarquia() usa el tip_cod/cod_rel del nodo y siempre apaga mostrarModelo', () => {
      service.monetizado.update((m) => ({ ...m, mostrarModelo: true }));

      service.seleccionarNodoJerarquia({ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' });

      expect(ant.getDataSourcesIndividual).toHaveBeenCalledWith('2026', 18, 'U-01', expect.any(String));
      expect(service.monetizado().mostrarModelo).toBe(false);
    });

    it('seleccionarFinancieraConfianza(1) pide tip_cod=7/cod_rel=231 individual', () => {
      service.seleccionarFinancieraConfianza(1);
      expect(ant.getDataSourcesIndividual).toHaveBeenCalledWith('2026', 7, '231', expect.any(String));
    });

    it('seleccionarFinancieraConfianza(2) pide tip_cod=7/cod_rel=231 grupal', () => {
      service.seleccionarFinancieraConfianza(2);
      expect(ant.getDataSourcesGrupal).toHaveBeenCalledWith(7, '231', expect.any(String));
    });
  });

  describe('cargarDatos() — mapeo de ds3/ds4 a las señales del Cuadro de Mando', () => {
    it('arma semáforo/avances/superPlus/monetizado a partir de ds3/ds4 (perfil sectorista individual)', () => {
      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', cod_gru: 1 });

      expect(service.semaforo().find((s) => s.id === 'car')).toMatchObject({ show: true, val: 1 });
      expect(service.avances().find((a) => a.id === 'car')).toMatchObject({ show: true, val: 0.8, per: 80 });
      expect(service.superPlus().find((s) => s.id === 'prod')).toMatchObject({ show: true });
      expect(service.monetizado()).toMatchObject({ bonoBase: 100, bonoPlus: 20, bonoSuperPlus: 30, bonoTotal: 150, codigoSituacion: 1 });
    });

    it('puedeSimular es false para tip_cod 20 o 7, true para el resto', () => {
      service.seleccionarNodoJerarquia({ tip_cod: 20, cod_rel: 'T-01', des_rel: 'Territorio 1' });
      expect(service.monetizado().puedeSimular).toBe(false);

      service.seleccionarFinancieraConfianza(1);
      expect(service.monetizado().puedeSimular).toBe(false);

      service.seleccionarNodoJerarquia({ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' });
      expect(service.monetizado().puedeSimular).toBe(true);
    });

    it('en claUsu=1, precarga tp1/tp2/tp3 de "efec1" y val1/met de "tas" desde ds3', () => {
      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', cod_gru: 1 });

      const efec1 = service.calculadora().variables.find((v) => v.id === 'efec1');
      expect(efec1).toMatchObject({ tp1: 0.3, tp2: 0.3, tp3: 0.4 });

      const tas = service.calculadora().plus.find((p) => p.id === 'tas');
      expect(tas).toMatchObject({ val1: 0.01, met: 0.02 });
    });

    it('en claUsu=2 no toca tp1/tp2/tp3 ni val1/met (son datos exclusivos de individual)', () => {
      service.seleccionarAsesor({ cod_sec: 'BT-003', des_sec: 'Grupo X', cod_gru: 2 });

      const efec1 = service.calculadora().variables.find((v) => v.id === 'efec1');
      expect(efec1?.tp1).toBeUndefined();
    });

    it('si falla la carga, expone un error y apaga cargando', () => {
      ant.getDataSourcesIndividual.mockReturnValue(throwError(() => new Error('caído')));

      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', cod_gru: 1 });

      expect(service.error()).toBeTruthy();
      expect(service.cargando()).toBe(false);
    });
  });

  describe('simular()', () => {
    it('arma el payload con tip_cod/cod_rel/mar_ren del nivel actual y actualiza los bonos', async () => {
      ant.calcularIndividual.mockReturnValue(
        of(respuesta({ resultado: { bob_car: 200, bop_car: 40, bos_prod: 60, flag_act: 1 } }))
      );
      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', cod_gru: 1 });

      const ok = await new Promise((resolve) => service.simular({ v_car: 500 }).subscribe(resolve));

      expect(ant.calcularIndividual).toHaveBeenCalledWith(
        '2026',
        expect.objectContaining({ v_car: 500, tip_cod: 1, cod_rel: 'BT-002', mar_ren: 5 }),
        expect.any(String)
      );
      expect(ok).toBe(true);
      expect(service.calculadora().bonoBase).toBe(200);
    });

    it('resuelve false si el backend no devuelve "resultado"', async () => {
      ant.calcularIndividual.mockReturnValue(of(respuesta({})));
      service.seleccionarAsesor({ cod_sec: 'BT-002', des_sec: 'Juan Pérez', cod_gru: 1 });

      const ok = await new Promise((resolve) => service.simular({}).subscribe(resolve));

      expect(ok).toBe(false);
    });

    it('lanza si no hay un nivel seleccionado todavía', () => {
      expect(() => service.simular({})).toThrow();
    });
  });

  describe('obtenerDetalleVariable()', () => {
    it('req=getDetail pasa cod_var y usa la fecha de corte', async () => {
      ant.getDetail.mockReturnValue(of(respuesta({ resultado: { card: {}, vars: [], rank: [] } })));

      await new Promise((resolve) => service.obtenerDetalleVariable('getDetail', 1, 'BT-001', 91).subscribe(resolve));

      expect(ant.getDetail).toHaveBeenCalledWith(1, 'BT-001', 91, expect.any(String));
    });

    it('req=getTasa/getProd/getRetencion no pasan cod_var (la firma del backend no lo acepta)', async () => {
      ant.getTasa.mockReturnValue(of(respuesta({})));
      await new Promise((resolve) => service.obtenerDetalleVariable('getTasa', 1, 'BT-001', 6).subscribe(resolve));
      expect(ant.getTasa).toHaveBeenCalledWith(1, 'BT-001', expect.any(String));
    });
  });

  describe('obtenerBancarizacion()', () => {
    it('parsea det/tot del backend', async () => {
      ant.getCliBanc.mockReturnValue(of(respuesta({ resultado: { det: [{ nom: 'Ana', tf: 1, gen: 1, rur: 0, mig: 0 }], tot: { tot_c: 1 } } })));

      const resultado = await new Promise((resolve) => service.obtenerBancarizacion(1, 'BT-001').subscribe(resolve));

      expect(resultado).toEqual({ filas: [{ nom: 'Ana', tf: 1, gen: 1, rur: 0, mig: 0 }], totales: { tot_c: 1 } });
    });

    it('devuelve arreglo vacío y totales null si el backend no trae "resultado"', async () => {
      ant.getCliBanc.mockReturnValue(of(respuesta({})));
      const resultado = await new Promise((resolve) => service.obtenerBancarizacion(1, 'BT-001').subscribe(resolve));
      expect(resultado).toEqual({ filas: [], totales: null });
    });
  });

  describe('obtenerNivelesJerarquia()/obtenerAsesores()', () => {
    it('obtenerNivelesJerarquia() usa la raíz cacheada tras iniciar() como admin', async () => {
      vi.spyOn(shell, 'esAdmin').mockReturnValue(true as any);
      service.iniciar();
      ant.getFromHierList.mockReturnValue(of(respuesta({ resultado: [{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }] })));

      const nodos = await new Promise((resolve) => service.obtenerNivelesJerarquia(18).subscribe(resolve));

      expect(ant.getFromHierList).toHaveBeenCalledWith(7, '231', 18);
      expect(nodos).toEqual([{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }]);
    });

    it('obtenerAsesores() usa la raíz cacheada y lee list_res', async () => {
      vi.spyOn(shell, 'esAdmin').mockReturnValue(true as any);
      service.iniciar();
      antAdmin.getListPick01.mockReturnValue(of(respuesta({ list_res: [{ cod_sec: 'BT-002', des_sec: 'Juan' }] })));

      const asesores = await new Promise((resolve) => service.obtenerAsesores().subscribe(resolve));

      expect(antAdmin.getListPick01).toHaveBeenCalledWith(7, '231');
      expect(asesores).toEqual([{ cod_sec: 'BT-002', des_sec: 'Juan' }]);
    });
  });

  it('fechaCorte() devuelve una fecha en formato YYYYMMDD', () => {
    expect(service.fechaCorte()).toMatch(/^\d{8}$/);
  });
});
