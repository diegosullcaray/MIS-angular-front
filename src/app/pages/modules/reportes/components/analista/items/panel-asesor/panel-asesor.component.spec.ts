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

const CARTERA: TablaReporteResultado = {
  headers: [
    {
      columns: [
        { columnDef: 'prod', header: 'Producto', isdata: 1 },
        { columnDef: 'saldo', header: 'Saldo capital', isdata: 2, format: { type: 'number' } },
      ],
    },
  ],
  body: [
    { prod: 'Microempresa', saldo: 840000 },
    { prod: 'Total', saldo: 1150000, style: 1 },
  ],
  additional: {},
};

const RESPUESTAS: Record<string, ResultadoPanelAsesor> = {
  L_CART_SEC: { tabla1: CARTERA, tabla2: { headers: [], body: [], additional: {} } },
  L_MONI_DESE_SEC: {
    kpiOperaciones: { cumpl_des_acum: '84.4%', fecha: '22/09/2026', hora: '18:00', style_cumpl_des_acum: '1' },
    kpiMonto: { cumpl_ope_acum: '81.4%' },
    tabla1: CARTERA,
  },
  L_INVERS_STOCK_SEC: { graficos: [] },
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

  beforeEach(() => {
    consultar = vi.fn((codigo: string) => of(RESPUESTAS[codigo] ?? { tabla1: CARTERA }));
  });

  it('sin asesor elegido pide elegir uno en vez de mostrar un vacío', () => {
    const el: HTMLElement = crear(2).nativeElement;
    expect(el.querySelector('app-empty-state')?.textContent).toContain('Elegí un asesor');
    expect(consultar).not.toHaveBeenCalled();
  });

  it('abre directo en el reporte más consultado, sin portada de resumen', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('.chip.activa')?.textContent).toContain('Cartera');
    expect(el.textContent).not.toContain('Resumen');
    expect(el.querySelector('.enlace-completo, .detalle-cabecera')).toBeNull();
  });

  it('el monitor de desembolsos muestra sus KPI reales arriba del detalle', () => {
    const fixture = crear();
    fixture.componentInstance['abrirReporte']('L_MONI_DESE_SEC');
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const kpis = fixture.nativeElement.querySelector('.kpis')!.textContent!;
    expect(kpis).toContain('84.4%');
    expect(kpis).toContain('81.4%');
  });

  it('las categorías se ordenan por uso y abren su reporte más consultado', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    const pestanas = [...el.querySelectorAll('.pestana')].map((b) => b.textContent!.trim());
    expect(pestanas[0]).toContain('Cartera y clientes');

    (el.querySelectorAll('.pestana')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    expect(el.querySelector('.chip.activa')?.textContent).toContain('Monitor Metas Desembolso');
    expect(el.querySelector('.detalle')?.getAttribute('aria-label')).toBe('Monitor Metas Desembolso');
  });

  it('un reporte que falla muestra el error con reintento, no un vacío', () => {
    consultar.mockImplementation((codigo: string) =>
      codigo === 'L_SEG_SEC' ? throwError(() => new Error('500')) : of(RESPUESTAS[codigo] ?? {}),
    );
    const fixture = crear();
    fixture.componentInstance['abrirReporte']('L_SEG_SEC');
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.detalle app-inline-error')).not.toBeNull();
    expect(el.querySelector('.detalle app-empty-state')).toBeNull();
  });

  it('un reporte sin filas muestra el estado vacío', () => {
    consultar.mockImplementation((codigo: string) =>
      of(codigo === 'L_SEG_SEC' ? { tabla1: { headers: [], body: [], additional: {} } } : (RESPUESTAS[codigo] ?? {})),
    );
    const fixture = crear();
    fixture.componentInstance['abrirReporte']('L_SEG_SEC');
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalle app-empty-state')).not.toBeNull();
  });

  it('efectividades muestra sus 6 filtros del legado', () => {
    const fixture = crear();
    fixture.componentInstance['abrirReporte']('L_MON_EFE_DET_SEC');
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.filtros-reporte p-select')).toHaveLength(6);
  });
});
