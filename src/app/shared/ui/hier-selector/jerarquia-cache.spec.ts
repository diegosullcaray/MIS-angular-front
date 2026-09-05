import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HierSelectorComponent } from './hier-selector.component';
import { JerarquiaCacheService } from './jerarquia-cache.service';
import { ModSysAdminService } from '../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import type { HierarquiaNodo, ParamsJerarquia } from './jerarquia.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA UNIDAD' };
const RAIZ: HierarquiaNodo = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 };

const respuesta = (clave: 'base_hierarchy' | 'level_hierarchy', nodos: HierarquiaNodo[]) =>
  of({ code: '0', headers: {}, body: { [clave]: nodos } } as never);

/**
 * Caché de la jerarquía.
 *
 * El STG resuelve cada nivel una vez y lo lee de `localStorage` en los
 * siguientes montajes (`CacheService.isCache/loadCache`). La migración no
 * cacheaba nada: cada una de las 44 pantallas que montan el selector repetía
 * `base_hier` + `level_hier` + el nivel siguiente, en serie, antes de que
 * arrancara la consulta del reporte. Estos tests fijan que eso no vuelva.
 */
describe('Caché de jerarquía', () => {
  let antAdmin: {
    getBaseHierarchy: ReturnType<typeof vi.fn>;
    getLevelHierarchy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    antAdmin = {
      getBaseHierarchy: vi.fn().mockReturnValue(respuesta('base_hierarchy', [RAIZ])),
      getLevelHierarchy: vi.fn().mockReturnValue(respuesta('level_hierarchy', [RAIZ])),
    };

    // El caché de jerarquía persiste en `sessionStorage`: sin vaciarlo, un test
    // le serviría a otro el árbol ya resuelto y nadie pediría nada.
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [HierSelectorComponent],
      providers: [{ provide: ModSysAdminService, useValue: antAdmin }, ShellStateService],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', PARAMS);
    fixture.detectChanges();
    return fixture;
  }

  it('el segundo montaje no vuelve a pedir la raíz al backend', () => {
    montar();
    const trasElPrimero = antAdmin.getBaseHierarchy.mock.calls.length;
    expect(trasElPrimero).toBe(1);

    montar();

    expect(antAdmin.getBaseHierarchy.mock.calls.length).toBe(trasElPrimero);
  });

  it('el segundo montaje tampoco vuelve a pedir los niveles', () => {
    montar();
    const trasElPrimero = antAdmin.getLevelHierarchy.mock.calls.length;
    expect(trasElPrimero).toBeGreaterThan(0);

    montar();

    expect(antAdmin.getLevelHierarchy.mock.calls.length).toBe(trasElPrimero);
  });

  it('el árbol que ve el usuario es el mismo: cachear no cambia lo que se muestra', () => {
    const primera = montar();
    const segunda = montar();

    const texto = (f: ReturnType<typeof montar>) => (f.nativeElement as HTMLElement).textContent ?? '';
    expect(texto(segunda)).toBe(texto(primera));
  });

  it('tras limpiar el caché se vuelve a preguntar: es lo que corre al cerrar sesión', () => {
    montar();
    const antes = antAdmin.getBaseHierarchy.mock.calls.length;

    TestBed.inject(JerarquiaCacheService).limpiar();
    montar();

    expect(antAdmin.getBaseHierarchy.mock.calls.length).toBe(antes + 1);
  });

  describe('claves', () => {
    let cache: JerarquiaCacheService;
    beforeEach(() => (cache = TestBed.inject(JerarquiaCacheService)));

    it('la raíz depende del usuario: dos personas no comparten entrada', () => {
      expect(cache.claveBase('ana@confianza.pe', 9)).not.toBe(cache.claveBase('luis@confianza.pe', 9));
    });

    /** Sin `fec` en la clave, cambiar de corte seguiría mostrando el árbol viejo. */
    it('el nivel depende de la fecha de corte', () => {
      expect(cache.claveNivel(9, 2, 7, ['231'], '2026-08-31')).not.toBe(
        cache.claveNivel(9, 2, 7, ['231'], '2026-09-30'),
      );
    });

    it('el orden en que llegan los `cod_rels` no cambia la entrada', () => {
      expect(cache.claveNivel(9, 2, 7, ['A', 'B'], 'f')).toBe(cache.claveNivel(9, 2, 7, ['B', 'A'], 'f'));
    });

    it('`limpiar()` deja el caché en cero', () => {
      cache.obtener('k', () => of([]));
      expect(cache.tamano).toBe(1);

      cache.limpiar();

      expect(cache.tamano).toBe(0);
    });
  });
});
