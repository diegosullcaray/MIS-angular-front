import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategorizacionService } from './categorizacion.service';
import { ModSeccionesService } from '../../../../core/winder/instances/mod-secciones.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { DetalleCategorizacionRaw } from '../models';

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

const DATA: DetalleCategorizacionRaw = {
  nom: 'Ana Torres',
  car: 'Asesor de Negocios',
  gen: 'F',
  cat: 'Oro',
  uni: 'Lima Norte',
  corr: 'Corredor 1',
  terr: 'Territorio A',
  r1: 'Cumple', ri1: 1,
  r2: 'No cumple', ri2: 0,
  r3: 'Cumple', ri3: 1,
  r4: 'Cumple', ri4: 1,
  c1: '1,200', ci1: 1,
  c2: '900', ci2: 0,
  c3: '1,500', ci3: 1,
  c4: '1,100', ci4: 1,
  c5: '800', ci5: 0,
  c6: '1,300', ci6: 1,
};

describe('CategorizacionService', () => {
  let service: CategorizacionService;
  let shell: ShellStateService;
  let ant: { getDetalleCategorizacion: ReturnType<typeof vi.fn> };
  let antAdmin: { getBaseHierarchy: ReturnType<typeof vi.fn>; getListPick01: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ant = { getDetalleCategorizacion: vi.fn() };
    antAdmin = { getBaseHierarchy: vi.fn(), getListPick01: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModSeccionesService, useValue: ant },
        { provide: ModSysAdminService, useValue: antAdmin },
      ],
    });
    service = TestBed.inject(CategorizacionService);
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  it('esAdmin() delega en ShellStateService.esAdmin()', () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    expect(service.esAdmin()).toBe(false);

    shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdmin()).toBe(true);
  });

  describe('obtenerDetalle()', () => {
    it('pide categorizacion.detalle y arma perfil/requisitos/comisiones', async () => {
      ant.getDetalleCategorizacion.mockReturnValue(
        of(respuesta({ resultado: { data: DATA, per: [{ nom: 'Ene' }, { nom: 'Feb' }, { nom: 'Mar' }, { nom: 'Abr' }, { nom: 'May' }, { nom: 'Jun' }] } }))
      );

      const detalle = await new Promise((resolve) => service.obtenerDetalle('BT-001').subscribe(resolve));

      expect(ant.getDetalleCategorizacion).toHaveBeenCalledWith('BT-001');
      expect(detalle).toEqual({
        perfil: {
          nombre: 'Ana Torres',
          cargo: 'Asesor de Negocios',
          genero: 'F',
          categoria: 'Oro',
          unidad: 'Lima Norte',
          corredor: 'Corredor 1',
          territorio: 'Territorio A',
        },
        requisitos: [
          { etiqueta: 'Disciplina', valor: 'Cumple', cumplido: true },
          { etiqueta: 'Calificación', valor: 'No cumple', cumplido: false },
          { etiqueta: 'Permanencia', valor: 'Cumple', cumplido: true },
          { etiqueta: 'Formación', valor: 'Cumple', cumplido: true },
        ],
        comisiones: [
          { periodo: 'Ene', valor: '1,200', cumplido: true },
          { periodo: 'Feb', valor: '900', cumplido: false },
          { periodo: 'Mar', valor: '1,500', cumplido: true },
          { periodo: 'Abr', valor: '1,100', cumplido: true },
          { periodo: 'May', valor: '800', cumplido: false },
          { periodo: 'Jun', valor: '1,300', cumplido: true },
        ],
      });
    });

    it('devuelve null si el backend no trae resultado.data (sin datos para el colaborador)', async () => {
      ant.getDetalleCategorizacion.mockReturnValue(of(respuesta({ resultado: {} })));
      const detalle = await new Promise((resolve) => service.obtenerDetalle('BT-404').subscribe(resolve));
      expect(detalle).toBeNull();
    });
  });

  describe('obtenerAnclaAdmin()', () => {
    it('pide base_hier (cod_jer=9) con el email del usuario activo y devuelve el primer nodo con flag_1 en {0,1,2}', async () => {
      antAdmin.getBaseHierarchy.mockReturnValue(
        of(
          respuesta({
            base_hierarchy: [
              { tip_cod: 4, cod_rel: 'X1', flag_1: 9 },
              { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', flag_1: 1 },
            ],
          })
        )
      );

      const ancla = await new Promise((resolve) => service.obtenerAnclaAdmin().subscribe(resolve));

      expect(antAdmin.getBaseHierarchy).toHaveBeenCalledWith('ana.torres@confianza.pe', 9);
      expect(ancla).toEqual({ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', flag_1: 1 });
    });

    it('devuelve null si ningún nodo tiene flag_1 en {0,1,2}', async () => {
      antAdmin.getBaseHierarchy.mockReturnValue(of(respuesta({ base_hierarchy: [{ tip_cod: 4, cod_rel: 'X1', flag_1: 9 }] })));
      const ancla = await new Promise((resolve) => service.obtenerAnclaAdmin().subscribe(resolve));
      expect(ancla).toBeNull();
    });
  });

  describe('obtenerSectoristas()', () => {
    it('pide list_pick_01 con tip_cod/cod_rel y devuelve list_res', async () => {
      antAdmin.getListPick01.mockReturnValue(
        of(respuesta({ list_res: [{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }] }))
      );

      const lista = await new Promise((resolve) => service.obtenerSectoristas(7, '231').subscribe(resolve));

      expect(antAdmin.getListPick01).toHaveBeenCalledWith(7, '231');
      expect(lista).toEqual([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }]);
    });

    it('devuelve un arreglo vacío si el backend no trae list_res', async () => {
      antAdmin.getListPick01.mockReturnValue(of(respuesta({})));
      const lista = await new Promise((resolve) => service.obtenerSectoristas(7, '231').subscribe(resolve));
      expect(lista).toEqual([]);
    });
  });
});
