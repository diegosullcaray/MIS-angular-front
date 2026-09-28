import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { CategorizacionDashboardComponent } from './categorizacion-dashboard.component';
import { CategorizacionService } from '../../services/categorizacion.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';
import type { DetalleCategorizacion } from '../../models/dashboard.model';
import type { NodoJerarquiaAncla, SectoristaItem } from '../../models/colaborador.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: [],
    codBt: 'BT-001',
    // Asesor (`tip_use = 1`): el único rol que abre su propia ficha sin elegir colaborador.
    tipoUsuario: 1,
    ...overrides,
  };
}

const DETALLE: DetalleCategorizacion = {
  tipoComision: 'grupal',
  perfil: { nombre: 'Ana Torres', cargo: 'Asesora', genero: 'F', categoria: 'Oro', unidad: 'U1', corredor: 'C1', territorio: 'T1' },
  requisitos: [{ etiqueta: 'Disciplina', valor: 'Cumple', cumplido: true }],
  comisiones: [{ periodo: 'Ene', valor: '1,000', cumplido: true, indicadores: [] }],
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

  it('para un asesor, carga su propia categorización con el codBt de la sesión activa', () => {
    const fixture = crear();

    expect(categorizacionFalso.obtenerDetalle).toHaveBeenCalledWith('BT-001');
    expect(fixture.componentInstance['perfil']()).toEqual(DETALLE.perfil);
    expect(fixture.componentInstance['requisitos']()).toEqual(DETALLE.requisitos);
    expect(fixture.componentInstance['comisiones']()).toEqual(DETALLE.comisiones);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('para otro rol, solo prepara el nodo ancla — no carga ninguna categorización hasta elegir colaborador', () => {
    shell.setUsuarioActivo(usuario({ tipoUsuario: 2 }));
    const fixture = crear();

    expect(categorizacionFalso.obtenerAnclaAdmin).toHaveBeenCalled();
    expect(categorizacionFalso.obtenerDetalle).not.toHaveBeenCalled();
    expect(fixture.componentInstance['perfil']()).toBeNull();
  });

  it('abrirSelector() abre el diálogo y pide la lista de sectoristas usando el nodo ancla', () => {
    shell.setUsuarioActivo(usuario({ tipoUsuario: 2 }));
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelector']();
    fixture.detectChanges();

    expect(instancia['dialogAbierto']()).toBe(true);
    expect(categorizacionFalso.obtenerSectoristas).toHaveBeenCalledWith(7, '231');
    expect(instancia['sectoristas']()).toEqual(SECTORISTAS);
    expect(instancia['cargandoSectoristas']()).toBe(false);
  });

  it('abrirSelector() muestra el spinner de carga si se hace click antes de que resuelva el nodo ancla', () => {
    shell.setUsuarioActivo(usuario({ tipoUsuario: 2 }));
    categorizacionFalso.obtenerAnclaAdmin.mockReturnValue(new Subject<NodoJerarquiaAncla | null>());
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelector']();
    fixture.detectChanges();

    expect(instancia['dialogAbierto']()).toBe(true);
    expect(instancia['cargandoSectoristas']()).toBe(true);
    expect(categorizacionFalso.obtenerSectoristas).not.toHaveBeenCalled();
  });

  it('abrirSelector() no vuelve a pedir la lista si ya se cargó antes', () => {
    shell.setUsuarioActivo(usuario({ tipoUsuario: 2 }));
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelector']();
    fixture.detectChanges();
    instancia['dialogAbierto'].set(false);
    instancia['abrirSelector']();
    fixture.detectChanges();

    expect(categorizacionFalso.obtenerSectoristas).toHaveBeenCalledTimes(1);
  });

  it('onSectoristaSeleccionado() carga la categorización del colaborador elegido', () => {
    shell.setUsuarioActivo(usuario({ tipoUsuario: 2 }));
    const fixture = crear();

    fixture.componentInstance['onSectoristaSeleccionado']({ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' });

    expect(categorizacionFalso.obtenerDetalle).toHaveBeenCalledWith('SEC-1');
    expect(fixture.componentInstance['perfil']()).toEqual(DETALLE.perfil);
  });

  it('cargar() sin resultado del backend (null) muestra el estado vacío estándar, no un error ni la guía', () => {
    categorizacionFalso.obtenerDetalle.mockReturnValue(of(null));
    const fixture = crear();
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBeNull();
    expect(fixture.componentInstance['sinDatos']()).toBe('BT-001');
    expect(fixture.componentInstance['perfil']()).toBeNull();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-empty-state')?.textContent).toContain('Sin datos de categorización');
    expect(el.querySelector('p-image')).toBeNull();
  });

  it('con datos, la primera fila tiene tres columnas: perfil, estado de requisitos e imagen guía', () => {
    const fixture = crear();
    fixture.detectChanges();
    const fila = (fixture.nativeElement as HTMLElement).querySelector('.fila-principal');
    expect(fila).not.toBeNull();
    const hijos = Array.from(fila!.children).map((c) => c.getAttribute('aria-label') ?? c.tagName.toLowerCase());
    expect(hijos).toEqual(['Perfil del asesor', 'Estado Requisitos', 'div']);
    // Estado Requisitos es la columna angosta; la imagen guía, la más ancha.
    expect(fila!.className).toContain('xl:grid-cols-[minmax(0,4fr)_minmax(14rem,2.4fr)_minmax(0,7fr)]');
  });

  it('Estado Requisitos va en una sola columna: cada fila con su descripción y un Tag al costado', () => {
    const fixture = crear();
    fixture.detectChanges();
    const seccion = (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Estado Requisitos"]')!;
    expect(seccion.querySelector('.sm\\:grid-cols-2')).toBeNull();
    const fila = seccion.querySelector('li.requisito')!;
    expect(fila.textContent).toContain('Disciplina');
    expect(fila.querySelector('p-tag')?.textContent).toContain('Cumple');
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
