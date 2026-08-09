import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategorizacionDashboardComponent } from './categorizacion-dashboard.component';
import { CategorizacionService } from '../../services/categorizacion.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';
import type { DetalleCategorizacion, NodoJerarquiaAncla, SectoristaItem } from '../../models';

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

const DETALLE: DetalleCategorizacion = {
  perfil: { nombre: 'Ana Torres', cargo: 'Asesora', genero: 'F', categoria: 'Oro', unidad: 'U1', corredor: 'C1', territorio: 'T1' },
  requisitos: [{ etiqueta: 'Disciplina', valor: 'Cumple', cumplido: true }],
  comisiones: [{ periodo: 'Ene', valor: '1,000', cumplido: true }],
};

const ANCLA: NodoJerarquiaAncla = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' };
const SECTORISTAS: SectoristaItem[] = [{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }];

describe('CategorizacionDashboardComponent', () => {
  let categorizacionFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    obtenerDetalle: ReturnType<typeof vi.fn>;
    obtenerAnclaAdmin: ReturnType<typeof vi.fn>;
    obtenerSectoristas: ReturnType<typeof vi.fn>;
  };
  let shell: ShellStateService;

  beforeEach(() => {
    categorizacionFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      obtenerDetalle: vi.fn().mockReturnValue(of(DETALLE)),
      obtenerAnclaAdmin: vi.fn().mockReturnValue(of(ANCLA)),
      obtenerSectoristas: vi.fn().mockReturnValue(of(SECTORISTAS)),
    };

    TestBed.configureTestingModule({
      imports: [CategorizacionDashboardComponent],
      providers: [{ provide: CategorizacionService, useValue: categorizacionFalso }],
    });
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario());
  });

  function crear() {
    const fixture = TestBed.createComponent(CategorizacionDashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('para un colaborador (no admin), carga su propia categorización con el codBt de la sesión activa', () => {
    categorizacionFalso.esAdmin.mockReturnValue(false);
    const fixture = crear();

    expect(categorizacionFalso.obtenerDetalle).toHaveBeenCalledWith('BT-001');
    expect(fixture.componentInstance['perfil']()).toEqual(DETALLE.perfil);
    expect(fixture.componentInstance['requisitos']()).toEqual(DETALLE.requisitos);
    expect(fixture.componentInstance['comisiones']()).toEqual(DETALLE.comisiones);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('para un admin, solo prepara el nodo ancla — no carga ninguna categorización hasta elegir colaborador', () => {
    categorizacionFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    expect(categorizacionFalso.obtenerAnclaAdmin).toHaveBeenCalled();
    expect(categorizacionFalso.obtenerDetalle).not.toHaveBeenCalled();
    expect(fixture.componentInstance['perfil']()).toBeNull();
  });

  it('abrirSelector() abre el diálogo y pide la lista de sectoristas usando el nodo ancla', () => {
    categorizacionFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelector']();

    expect(instancia['dialogAbierto']()).toBe(true);
    expect(categorizacionFalso.obtenerSectoristas).toHaveBeenCalledWith(7, '231');
    expect(instancia['sectoristas']()).toEqual(SECTORISTAS);
  });

  it('abrirSelector() no vuelve a pedir la lista si ya se cargó antes', () => {
    categorizacionFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelector']();
    instancia['dialogAbierto'].set(false);
    instancia['abrirSelector']();

    expect(categorizacionFalso.obtenerSectoristas).toHaveBeenCalledTimes(1);
  });

  it('onSectoristaSeleccionado() carga la categorización del colaborador elegido', () => {
    categorizacionFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    fixture.componentInstance['onSectoristaSeleccionado']({ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' });

    expect(categorizacionFalso.obtenerDetalle).toHaveBeenCalledWith('SEC-1');
    expect(fixture.componentInstance['perfil']()).toEqual(DETALLE.perfil);
  });

  it('cargar() sin resultado del backend (null) fija un mensaje de error y limpia el estado', () => {
    categorizacionFalso.obtenerDetalle.mockReturnValue(of(null));
    const fixture = crear();

    expect(fixture.componentInstance['error']()).toContain('BT-001');
    expect(fixture.componentInstance['perfil']()).toBeNull();
  });

  it('cargar() muestra un mensaje de error genérico si falla la petición', () => {
    categorizacionFalso.obtenerDetalle.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = crear();

    expect(fixture.componentInstance['error']()).toBe('No se pudo cargar la categorización. Inténtalo de nuevo en unos segundos.');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('reintentar() vuelve a pedir la última categorización cargada', () => {
    const fixture = crear();
    categorizacionFalso.obtenerDetalle.mockClear();

    fixture.componentInstance['reintentar']();

    expect(categorizacionFalso.obtenerDetalle).toHaveBeenCalledWith('BT-001');
  });
});
