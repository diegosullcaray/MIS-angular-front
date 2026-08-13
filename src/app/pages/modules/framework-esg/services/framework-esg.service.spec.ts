import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FrameworkEsgService } from './framework-esg.service';
import { ModFrameworkEsgService } from '../../../../core/winder/instances/mod-framework-esg.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { EsgConfiguracionModulo } from '../models/configuracion.model';

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

interface AntFalso {
  getConfiguracionMod: ReturnType<typeof vi.fn>;
  getResumenPor: ReturnType<typeof vi.fn>;
  getResumenCat: ReturnType<typeof vi.fn>;
  postActualizaMet: ReturnType<typeof vi.fn>;
  getMetUsers: ReturnType<typeof vi.fn>;
  postMetUsers: ReturnType<typeof vi.fn>;
}

describe('FrameworkEsgService', () => {
  let service: FrameworkEsgService;
  let shell: ShellStateService;
  let ant: AntFalso;

  beforeEach(() => {
    ant = {
      getConfiguracionMod: vi.fn(),
      getResumenPor: vi.fn(),
      getResumenCat: vi.fn(),
      postActualizaMet: vi.fn(),
      getMetUsers: vi.fn(),
      postMetUsers: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ModFrameworkEsgService, useValue: ant }],
    });
    service = TestBed.inject(FrameworkEsgService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('esAdmin() es true si el usuario es admin del Host, aunque el módulo no lo marque admin', () => {
    shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdmin(null)).toBe(true);
  });

  it('esAdmin() es true si "mod_admin.cfg" lo marca admin del módulo, aunque no sea admin del Host', () => {
    const cfg = { moduloAdmin: true } as EsgConfiguracionModulo;
    expect(service.esAdmin(cfg)).toBe(true);
  });

  it('esAdmin() es false si ninguna de las dos condiciones se cumple', () => {
    const cfg = { moduloAdmin: false } as EsgConfiguracionModulo;
    expect(service.esAdmin(cfg)).toBe(false);
  });

  it('cargarConfiguracion() parsea los 5 bloques JSON de esg.cfg_mod', async () => {
    ant.getConfiguracionMod.mockReturnValue(
      of(
        respuesta({
          resultado: {
            sit: { cfg: JSON.stringify([{ cod: 1, des: 'Activo' }]) },
            attr: { cfg: JSON.stringify([{ key: 'k1', label: 'Atributo 1' }]) },
            cats: { cfg: JSON.stringify([{ cod: 1, des: 'Medioambiente' }]) },
            mod_admin: { cfg: 'true' },
            can_edit: { cfg: 'false' },
          },
        })
      )
    );

    const cfg = await new Promise((resolve) => service.cargarConfiguracion().subscribe(resolve));

    expect(ant.getConfiguracionMod).toHaveBeenCalledWith('BT-001');
    expect(cfg).toEqual({
      situaciones: [{ cod: 1, des: 'Activo' }],
      atributos: [{ key: 'k1', label: 'Atributo 1' }],
      categorias: [{ cod: 1, des: 'Medioambiente' }],
      moduloAdmin: true,
      puedeEditar: false,
    });
  });

  it('cargarConfiguracion() usa valores por defecto seguros si faltan bloques o el JSON es inválido', async () => {
    ant.getConfiguracionMod.mockReturnValue(of(respuesta({ resultado: { sit: { cfg: '{roto' } } })));

    const cfg = await new Promise((resolve) => service.cargarConfiguracion().subscribe(resolve));

    expect(cfg).toEqual({
      situaciones: [],
      atributos: [],
      categorias: [],
      moduloAdmin: false,
      puedeEditar: false,
    });
  });

  it('cargarResumenPortada() devuelve el arreglo de esg.res_por directo (sin envoltura)', async () => {
    const filas = [{ des: 'Bueno', c1: 1, c2: 2, c3: 3, c4: 4, c99: 10 }];
    ant.getResumenPor.mockReturnValue(of(respuesta({ resultado: filas })));

    const resultado = await new Promise((resolve) => service.cargarResumenPortada().subscribe(resolve));

    expect(resultado).toEqual(filas);
  });

  it('cargarResumenPortada() devuelve un arreglo vacío si no hay "resultado"', async () => {
    ant.getResumenPor.mockReturnValue(of(respuesta({})));
    const resultado = await new Promise((resolve) => service.cargarResumenPortada().subscribe(resolve));
    expect(resultado).toEqual([]);
  });

  it('cargarResumenCategoria() separa cab.cols por coma y pasa is_admin=1 cuando esAdmin=true', async () => {
    const filas = [{ cod_met: 1, cod_cat: 1, des_met: 'M1', des_med: 'u', des_dis: 'Sí', sit_met: 1, cfg_met: '{}' }];
    ant.getResumenCat.mockReturnValue(of(respuesta({ resultado: { cab: { cols: '2024-01,2024-02' }, res: filas } })));

    const resultado = await new Promise((resolve) => service.cargarResumenCategoria(1, true).subscribe(resolve));

    expect(ant.getResumenCat).toHaveBeenCalledWith(1, 'BT-001', 1);
    expect(resultado).toEqual({ columnasHistoricas: ['2024-01', '2024-02'], filas });
  });

  it('cargarResumenCategoria() pasa is_admin=0 cuando esAdmin=false y devuelve columnas vacías si no hay cab.cols', async () => {
    ant.getResumenCat.mockReturnValue(of(respuesta({ resultado: { res: [] } })));

    const resultado = await new Promise((resolve) => service.cargarResumenCategoria(3, false).subscribe(resolve));

    expect(ant.getResumenCat).toHaveBeenCalledWith(3, 'BT-001', 0);
    expect(resultado).toEqual({ columnasHistoricas: [], filas: [] });
  });

  it('actualizarMetrica() delega en postActualizaMet() con el cod_bt del usuario activo y resuelve true en code 200', async () => {
    ant.postActualizaMet.mockReturnValue(of({ body: { result: { code: 200 } } }));
    const payload = { des_dis: 'Sí', sit_met: 1, hist: {}, cfg_met: {} };

    const ok = await new Promise((resolve) => service.actualizarMetrica(15, payload).subscribe(resolve));

    expect(ant.postActualizaMet).toHaveBeenCalledWith('BT-001', 15, payload);
    expect(ok).toBe(true);
  });

  it('actualizarMetrica() resuelve false si el backend no responde code 200', async () => {
    ant.postActualizaMet.mockReturnValue(of({ body: { result: { code: 500 } } }));

    const ok = await new Promise((resolve) =>
      service.actualizarMetrica(15, { des_dis: '', sit_met: 1, hist: {}, cfg_met: {} }).subscribe(resolve)
    );

    expect(ok).toBe(false);
  });

  it('obtenerUsuariosMetrica() separa use_lis por coma', async () => {
    ant.getMetUsers.mockReturnValue(of(respuesta({ resultado: { code: 'ok', row: { use_lis: 'a@x.pe,b@x.pe' } } })));

    const resultado = await new Promise((resolve) => service.obtenerUsuariosMetrica('15').subscribe(resolve));

    expect(ant.getMetUsers).toHaveBeenCalledWith('15');
    expect(resultado).toEqual(['a@x.pe', 'b@x.pe']);
  });

  it('obtenerUsuariosMetrica() devuelve un arreglo vacío si code es "void" (sin usuarios)', async () => {
    ant.getMetUsers.mockReturnValue(of(respuesta({ resultado: { code: 'void' } })));

    const resultado = await new Promise((resolve) => service.obtenerUsuariosMetrica('15').subscribe(resolve));

    expect(resultado).toEqual([]);
  });

  it('guardarUsuariosPorMetrica() delega en postMetUsers() con el arreglo de cambios', () => {
    ant.postMetUsers.mockReturnValue(of({}));
    const cambios = [{ id: '15', val: 'a@x.pe' }];

    service.guardarUsuariosPorMetrica(cambios).subscribe();

    expect(ant.postMetUsers).toHaveBeenCalledWith(cambios);
  });
});
