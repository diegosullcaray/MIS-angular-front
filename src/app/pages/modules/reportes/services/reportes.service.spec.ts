import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportesService } from './reportes.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
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

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

interface AntFalso {
  getRegularData: ReturnType<typeof vi.fn>;
}

interface AntAdminFalso {
  getBaseHierarchy: ReturnType<typeof vi.fn>;
  getLevelHierarchy: ReturnType<typeof vi.fn>;
}

describe('ReportesService', () => {
  let service: ReportesService;
  let shell: ShellStateService;
  let ant: AntFalso;
  let antAdmin: AntAdminFalso;

  beforeEach(() => {
    ant = { getRegularData: vi.fn() };
    antAdmin = { getBaseHierarchy: vi.fn(), getLevelHierarchy: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: ant },
        { provide: ModSysAdminService, useValue: antAdmin },
      ],
    });
    service = TestBed.inject(ReportesService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('fechaUltimoDia() devuelve la fecha de ayer en formato YYYYMMDD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));

    expect(service.fechaUltimoDia()).toBe('20260809');

    vi.useRealTimers();
  });

  it('fechaCorte() devuelve una fecha en formato YYYY-MM-DD', () => {
    expect(service.fechaCorte()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('obtenerJerarquiaBase() pide base_hier con el email del usuario activo y devuelve base_hierarchy', async () => {
    antAdmin.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }] }))
    );

    const nodos = await new Promise((resolve) => service.obtenerJerarquiaBase(9).subscribe(resolve));

    expect(antAdmin.getBaseHierarchy).toHaveBeenCalledWith('ana.torres@confianza.pe', 9);
    expect(nodos).toEqual([{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 }]);
  });

  it('obtenerJerarquiaBase() devuelve un arreglo vacío si el backend no trae base_hierarchy', async () => {
    antAdmin.getBaseHierarchy.mockReturnValue(of(respuesta({})));
    const nodos = await new Promise((resolve) => service.obtenerJerarquiaBase(9).subscribe(resolve));
    expect(nodos).toEqual([]);
  });

  it('obtenerJerarquiaNivel() delega en getLevelHierarchy() y devuelve level_hierarchy', async () => {
    antAdmin.getLevelHierarchy.mockReturnValue(of(respuesta({ level_hierarchy: [{ tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1' }] })));

    const nodos = await new Promise((resolve) => service.obtenerJerarquiaNivel(9, 2, 7, ['231']).subscribe(resolve));

    expect(antAdmin.getLevelHierarchy).toHaveBeenCalledWith(9, 2, 7, ['231'], undefined);
    expect(nodos).toEqual([{ tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1' }]);
  });

  it('obtenerBloqueReporte() delega en getRegularData() y devuelve headers/body/additional', async () => {
    ant.getRegularData.mockReturnValue(
      of(
        respuesta({
          result: {
            headers: [{ columns: [{ columnDef: 'nom', header: 'Nombre', isdata: 1 }] }],
            body: [{ nom: 'Ana' }],
            additional: { fecha: '2026-08-10' },
          },
        })
      )
    );

    const resultado = await new Promise((resolve) =>
      service.obtenerBloqueReporte('Monitor_Dese_01', { tip_cod: 7, cod_rel: '231' }).subscribe(resolve)
    );

    expect(ant.getRegularData).toHaveBeenCalledWith('Monitor_Dese_01', { tip_cod: 7, cod_rel: '231' });
    expect(resultado).toEqual({
      headers: [{ columns: [{ columnDef: 'nom', header: 'Nombre', isdata: 1 }] }],
      body: [{ nom: 'Ana' }],
      additional: { fecha: '2026-08-10' },
    });
  });

  it('obtenerBloqueReporte() devuelve valores vacíos por defecto si el backend no trae result', async () => {
    ant.getRegularData.mockReturnValue(of(respuesta({})));

    const resultado = await new Promise((resolve) => service.obtenerBloqueReporte('X', {}).subscribe(resolve));

    expect(resultado).toEqual({ headers: [], body: [], additional: {} });
  });
});
