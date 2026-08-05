import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MenuStgService } from './menu-stg.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

interface AntMenuItemFake {
  cod_sec: string;
  cod_par?: string | number | null;
  desc_sec: string;
  act_sec?: string;
  icon_sec?: string;
  order_sec?: number;
}

function respuestaCon(items: AntMenuItemFake[]): IWinderResponse {
  return { code: '0', headers: {}, body: { menu_response: items } };
}

describe('MenuStgService', () => {
  let service: MenuStgService;
  let getMenuItemsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMenuItemsSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ModSysAdminService, useValue: { getMenuItems: getMenuItemsSpy } }],
    });
    service = TestBed.inject(MenuStgService);
  });

  it('empieza sin sistemas ni hijos', () => {
    expect(service.sistemas()).toEqual([]);
    expect(service.hijosPorSistema()).toEqual({});
  });

  it('cargar() solo pide el menú una vez por sesión', () => {
    getMenuItemsSpy.mockReturnValue(of(respuestaCon([])));

    service.cargar('ana.torres@confianza.pe');
    service.cargar('ana.torres@confianza.pe');
    service.cargar('otro.usuario@confianza.pe');

    expect(getMenuItemsSpy).toHaveBeenCalledTimes(1);
  });

  it('filtra los ítems raíz (sin cod_par) y los ordena por order_sec', () => {
    getMenuItemsSpy.mockReturnValue(
      of(
        respuestaCon([
          { cod_sec: 'B', desc_sec: 'Sistema B', order_sec: 2 },
          { cod_sec: 'A', desc_sec: 'Sistema A', order_sec: 1 },
          { cod_sec: 'A-hijo', cod_par: 'A', desc_sec: 'Hijo de A', act_sec: 'a/hijo' },
        ])
      )
    );

    service.cargar('ana.torres@confianza.pe');

    expect(service.sistemas().map((s) => s.id)).toEqual(['A', 'B']);
  });

  it('un sistema con hijos tiene tienePanel=true y sin ruta propia; sin hijos, tienePanel=false y ruta definida', () => {
    getMenuItemsSpy.mockReturnValue(
      of(
        respuestaCon([
          { cod_sec: 'A', desc_sec: 'Con hijos', order_sec: 1, act_sec: 'a' },
          { cod_sec: 'A-hijo', cod_par: 'A', desc_sec: 'Hijo de A', act_sec: 'a/hijo' },
          { cod_sec: 'B', desc_sec: 'Sin hijos', order_sec: 2, act_sec: 'ranking-k' },
        ])
      )
    );

    service.cargar('ana.torres@confianza.pe');

    const [conHijos, sinHijos] = service.sistemas();
    expect(conHijos.tienePanel).toBe(true);
    expect(conHijos.ruta).toBeUndefined();

    expect(sinHijos.tienePanel).toBe(false);
    expect(sinHijos.ruta).toBe('/ranking-k');
  });

  it('rutaDeAntItem no duplica el segmento /app (usa act_sec tal cual, sin anteponer /app)', () => {
    getMenuItemsSpy.mockReturnValue(of(respuestaCon([{ cod_sec: 'B', desc_sec: 'B', act_sec: 'app/ranking-k' }])));

    service.cargar('ana.torres@confianza.pe');

    expect(service.sistemas()[0].ruta).toBe('/app/ranking-k');
  });

  it('cae a cod_sec cuando el ítem no trae act_sec', () => {
    getMenuItemsSpy.mockReturnValue(of(respuestaCon([{ cod_sec: 'sin-act-sec', desc_sec: 'B' }])));

    service.cargar('ana.torres@confianza.pe');

    expect(service.sistemas()[0].ruta).toBe('/sin-act-sec');
  });

  it('construye el árbol de hijos recursivamente y compara cod_par como string (tipos mixtos)', () => {
    getMenuItemsSpy.mockReturnValue(
      of(
        respuestaCon([
          { cod_sec: 1, desc_sec: 'Sistema', order_sec: 1 } as unknown as AntMenuItemFake,
          // cod_par numérico vs cod_sec string — debe emparejar igual (String()).
          { cod_sec: 'nieto', cod_par: 1, desc_sec: 'Nieto directo', act_sec: 'sistema/nieto' },
          { cod_sec: 'grupo', cod_par: '1', desc_sec: 'Grupo intermedio' },
          { cod_sec: 'hoja', cod_par: 'grupo', desc_sec: 'Hoja final', act_sec: 'sistema/grupo/hoja' },
        ])
      )
    );

    service.cargar('ana.torres@confianza.pe');

    const hijos = service.hijosPorSistema()['1'];
    expect(hijos.find((h) => h.etiqueta === 'Nieto directo')?.ruta).toBe('/sistema/nieto');

    const grupo = hijos.find((h) => h.etiqueta === 'Grupo intermedio');
    expect(grupo?.ruta).toBeUndefined(); // es un grupo, no una hoja
    expect(grupo?.hijos?.[0]).toEqual({ etiqueta: 'Hoja final', ruta: '/sistema/grupo/hoja', hijos: undefined });
  });

  it('buscarPorRuta() encuentra la cadena de etiquetas de una hoja anidada', () => {
    getMenuItemsSpy.mockReturnValue(
      of(
        respuestaCon([
          { cod_sec: 'A', desc_sec: 'Actividad Mensual', order_sec: 1 },
          { cod_sec: 'A-1', cod_par: 'A', desc_sec: 'Clientes' },
          { cod_sec: 'A-1-1', cod_par: 'A-1', desc_sec: 'CMG Clientes Flujo', act_sec: 'a/clientes/cmg' },
        ])
      )
    );

    service.cargar('ana.torres@confianza.pe');

    expect(service.buscarPorRuta('/a/clientes/cmg')).toEqual({
      sistemaId: 'A',
      etiquetas: ['Clientes', 'CMG Clientes Flujo'],
    });
  });

  it('buscarPorRuta() devuelve null si la ruta no corresponde a ninguna hoja conocida', () => {
    getMenuItemsSpy.mockReturnValue(of(respuestaCon([{ cod_sec: 'A', cod_par: null, desc_sec: 'A' }])));
    service.cargar('ana.torres@confianza.pe');

    expect(service.buscarPorRuta('/ruta/inexistente')).toBeNull();
  });

  it('en caso de error del backend, deja sistemas vacíos y registra el error en consola', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getMenuItemsSpy.mockReturnValue(throwError(() => new Error('backend caído')));

    service.cargar('ana.torres@confianza.pe');

    expect(service.sistemas()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
