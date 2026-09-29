import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PanelAsesorComponent } from './panel-asesor.component';
import { PanelAsesorService } from '../../services/panel-asesor.service';
import { PanelAsesorConsultasService } from '../../services/panel-asesor-consultas.service';
import { AsesorSecService } from '../../services/asesor-sec.service';
import { ShellStateService } from '../../../../../../../core/services/shell-state.service';
import type { ResultadoPanelAsesor } from '../../models/panel-asesor.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const EVOLUCION: TablaReporteResultado = {
  headers: [
    {
      columns: [
        { columnDef: 'var', header: 'Variable', isdata: 1 },
        { columnDef: 'cie', header: 'Cierre mes ant.', isdata: 2, format: { type: 'number' } },
        { columnDef: 'eje', header: 'Ejecutado', isdata: 3, format: { type: 'number' } },
        { columnDef: 'dif', header: 'Variación', isdata: 4, format: { type: 'number' } },
      ],
    },
  ],
  body: [{ var: 'Stock de cartera', cie: 3528967, eje: 3254743, dif: -274224 }],
  additional: {},
};

const RESPUESTAS: Record<string, ResultadoPanelAsesor> = {
  L_CART_SEC: { tabla1: EVOLUCION },
  L_MONI_DESE_SEC: {
    kpiOperaciones: { cumpl_des_acum: '84.4%', fecha: '22/09/2026', hora: '18:00' },
    kpiMonto: { cumpl_ope_acum: '81.4%' },
    tabla1: EVOLUCION,
  },
};

describe('PanelAsesorComponent', () => {
  let consultar: ReturnType<typeof vi.fn>;

  function crear(tipoUsuario = 1) {
    TestBed.configureTestingModule({
      imports: [PanelAsesorComponent],
      providers: [provideRouter([]), { provide: AsesorSecService, useValue: { obtenerAsesores: () => of([]) } }],
    }).overrideComponent(PanelAsesorComponent, {
      set: { providers: [PanelAsesorService, { provide: PanelAsesorConsultasService, useValue: { consultar } }] },
    });
    TestBed.inject(ShellStateService).setUsuarioActivo({
      id: 'u1',
      nombre: 'Ana Torres',
      email: 'ana@ejemplo.test',
      rol: 'supervisor-area',
      subsistemas: [],
      tipoUsuario,
      numDoc: '87654321',
    } as never);
    const fixture = TestBed.createComponent(PanelAsesorComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    return fixture;
  }

  function refrescar(fixture: ReturnType<typeof crear>) {
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  }

  beforeEach(() => {
    consultar = vi.fn((codigo: string) => of(RESPUESTAS[codigo] ?? { tabla1: EVOLUCION }));
  });

  it('sin asesor elegido pide elegir uno en vez de mostrar un vacío', () => {
    const el: HTMLElement = crear(2).nativeElement;
    expect(el.querySelector('app-empty-state')?.textContent).toContain('Elegí un asesor');
    expect(consultar).not.toHaveBeenCalled();
  });

  it('sin título ni subtítulos: ni "Impacto del mes" ni el asesor con la fecha de corte', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.textContent).not.toContain('Impacto del mes');
    expect(el.textContent).not.toContain('Corte al');
    expect(el.querySelector('.mis-window-bar')?.textContent).not.toContain('Ana Torres');
    expect(el.textContent).not.toContain('Toca un foco');
  });

  it('seis tarjetas por dominio y sin los 4 KPI titulares de la maqueta', () => {
    const el: HTMLElement = crear().nativeElement;
    const titulos = [...el.querySelectorAll('.tarjeta-titulo')].map((t) => t.textContent!.trim());
    expect(titulos).toEqual(['Cartera', 'Clientes', 'Colocación · metas', 'Autonomía de tasas', 'Seguros', 'Recuperación y mora']);
    expect(el.querySelector('[aria-label="Indicadores titulares"]')).toBeNull();
  });

  it('la tarjeta de Cartera resume la fila real "Stock de cartera"', () => {
    const el: HTMLElement = crear().nativeElement;
    const cartera = el.querySelector('.tarjeta[aria-label="Cartera"]')!;
    expect(cartera.textContent).toContain('3,528,967');
    expect(cartera.textContent).toContain('3,254,743');
  });

  it('una tarjeta cuyo reporte falla muestra el error con reintento, no un vacío', () => {
    consultar.mockImplementation((codigo: string) =>
      codigo === 'L_SEG_SEC' ? throwError(() => new Error('500')) : of(RESPUESTAS[codigo] ?? { tabla1: EVOLUCION }),
    );
    const el: HTMLElement = crear().nativeElement;
    const seguros = el.querySelector('.tarjeta[aria-label="Seguros"]')!;
    expect(seguros.querySelector('app-inline-error')).not.toBeNull();
    expect(seguros.querySelector('app-empty-state')).toBeNull();
  });

  it('"Ver detalle" abre el diálogo del dominio con sus pestañas, indicadores y tablas; las pestañas cambian de dominio', () => {
    const fixture = crear();
    (fixture.nativeElement.querySelector('.tarjeta[aria-label="Cartera"] .tarjeta-cabecera') as HTMLButtonElement).click();
    refrescar(fixture);

    // La barra del diálogo solo lleva el nombre; los chips globales van en el cuerpo.
    const dialogo = document.querySelector('.p-dialog')!;
    expect(dialogo.querySelector('.p-dialog-header .p-dialog-title')?.textContent?.trim()).toBe('Cartera');
    expect(dialogo.querySelector('.p-dialog-header .mis-chip')).toBeNull();
    expect(dialogo.querySelector('.p-dialog-content .mis-chip--activo')?.textContent).toContain('Cartera');
    expect([...dialogo.querySelectorAll('.p-dialog-content .mis-chip')].map((p) => p.textContent!.trim())).toEqual([
      'Cartera', 'Clientes', 'Colocación', 'Tasas', 'Seguros', 'Mora',
    ]);
    expect(dialogo.querySelectorAll('.kpi-card.indicador')).toHaveLength(4);
    expect(dialogo.querySelector('app-bloque-panel')).not.toBeNull();

    (dialogo.querySelectorAll('.p-dialog-content .mis-chip')[4] as HTMLButtonElement).click();
    refrescar(fixture);
    expect(document.querySelector('.p-dialog-content .mis-chip--activo')?.textContent).toContain('Seguros');
    expect(document.querySelector('.p-dialog-header .p-dialog-title')?.textContent?.trim()).toBe('Seguros');
  });

  it('el detalle de Mora muestra los 6 filtros de efectividades del legado', () => {
    const fixture = crear();
    fixture.componentInstance['abrir']('mora');
    refrescar(fixture);
    expect(document.querySelectorAll('.filtros-reporte p-select')).toHaveLength(6);
  });
});
