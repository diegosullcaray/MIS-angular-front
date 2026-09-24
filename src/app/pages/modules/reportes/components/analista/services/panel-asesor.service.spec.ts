import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { PanelAsesorService } from './panel-asesor.service';
import { PanelAsesorConsultasService } from './panel-asesor-consultas.service';
import { AsesorSecService } from './asesor-sec.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ResultadoPanelAsesor } from '../models/panel-asesor.model';

const ANA: AsesorSec = { nombre: 'Ana', dni: '11111111' };
const LUIS: AsesorSec = { nombre: 'Luis', dni: '22222222' };
const RESULTADO: ResultadoPanelAsesor = { tabla1: { headers: [], body: [{ a: 1 }], additional: {} } };

describe('PanelAsesorService', () => {
  let consultar: ReturnType<typeof vi.fn>;

  function crear(usuario: Record<string, unknown> = { tipoUsuario: 2 }) {
    TestBed.configureTestingModule({
      providers: [
        PanelAsesorService,
        { provide: PanelAsesorConsultasService, useValue: { consultar } },
        { provide: AsesorSecService, useValue: { obtenerAsesores: () => of([ANA, LUIS]) } },
      ],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo({
      id: 'u1',
      nombre: 'Usuario',
      email: 'usuario@ejemplo.test',
      rol: 'supervisor-area',
      subsistemas: [],
      ...usuario,
    } as never);
    const servicio = TestBed.inject(PanelAsesorService);
    TestBed.tick();
    return servicio;
  }

  beforeEach(() => {
    consultar = vi.fn().mockReturnValue(of(RESULTADO));
  });

  it('al elegir asesor consulta solo los reportes del resumen 360', () => {
    const s = crear();
    s.seleccionarAsesor(ANA);
    TestBed.tick();
    expect(consultar.mock.calls.map((c) => c[0])).toEqual(['L_CART_SEC', 'L_MONI_DESE_SEC', 'L_INVERS_STOCK_SEC']);
    expect(consultar).toHaveBeenCalledWith('L_CART_SEC', ANA.dni, expect.any(Object));
    expect(s.estado('L_CART_SEC')).toEqual({ estado: 'listo', resultado: RESULTADO });
  });

  it('abrir un reporte lo consulta una vez; volver a él no repite la consulta', () => {
    const s = crear();
    s.seleccionarAsesor(ANA);
    s.seleccionarVista('L_SEG_SEC');
    TestBed.tick();
    s.seleccionarVista('resumen');
    TestBed.tick();
    s.seleccionarVista('L_SEG_SEC');
    TestBed.tick();
    expect(consultar.mock.calls.filter((c) => c[0] === 'L_SEG_SEC')).toHaveLength(1);
  });

  it('ignora vistas que no son reportes del panel', () => {
    const s = crear();
    s.seleccionarVista('L_INEXISTENTE');
    expect(s.vista()).toBe('resumen');
  });

  it('un error queda como error (no como vacío) y se puede reintentar', () => {
    consultar.mockImplementation((codigo: string) =>
      codigo === 'L_CART_SEC' ? throwError(() => new Error('500')) : of(RESULTADO),
    );
    const s = crear();
    s.seleccionarAsesor(ANA);
    TestBed.tick();
    expect(s.estado('L_CART_SEC')?.estado).toBe('error');

    consultar.mockReturnValue(of(RESULTADO));
    s.reintentar('L_CART_SEC');
    expect(s.estado('L_CART_SEC')?.estado).toBe('listo');
  });

  it('cambiar de asesor cancela lo pendiente y descarta respuestas del anterior', () => {
    const pendiente = new Subject<ResultadoPanelAsesor>();
    consultar.mockImplementation((_c: string, dni: string) => (dni === ANA.dni ? pendiente : of(RESULTADO)));
    const s = crear();
    s.seleccionarAsesor(ANA);
    TestBed.tick();
    expect(s.consultando()).toBe(true);

    s.seleccionarAsesor(LUIS);
    TestBed.tick();
    pendiente.next({ tabla1: { headers: [], body: [{ viejo: true }], additional: {} } });
    expect(pendiente.observed).toBe(false);
    expect(s.estado('L_CART_SEC')).toEqual({ estado: 'listo', resultado: RESULTADO });
  });

  it('efectividades se vuelve a consultar al cambiar filtros, con los filtros vigentes', () => {
    const s = crear();
    s.seleccionarAsesor(ANA);
    s.seleccionarVista('L_MON_EFE_DET_SEC');
    TestBed.tick();
    s.filtrar('prod', 'CONSUMO');
    TestBed.tick();
    const llamadas = consultar.mock.calls.filter((c) => c[0] === 'L_MON_EFE_DET_SEC');
    expect(llamadas).toHaveLength(2);
    expect(llamadas[1][2]).toEqual(expect.objectContaining({ prod: 'CONSUMO' }));
  });

  it('actualizar vuelve a consultar el resumen y el reporte abierto', () => {
    const s = crear();
    s.seleccionarAsesor(ANA);
    s.seleccionarVista('L_SEG_SEC');
    TestBed.tick();
    consultar.mockClear();
    s.actualizar();
    TestBed.tick();
    expect(consultar.mock.calls.map((c) => c[0])).toEqual(['L_CART_SEC', 'L_MONI_DESE_SEC', 'L_INVERS_STOCK_SEC', 'L_SEG_SEC']);
  });

  it('el asesor autenticado (tipoUsuario 1) se carga solo, sin selector', () => {
    const s = crear({ tipoUsuario: 1, numDoc: '33333333', nombre: 'Propio' });
    expect(s.propio()).toBe(true);
    expect(s.asesor()).toEqual({ nombre: 'Propio', dni: '33333333' });
    expect(consultar).toHaveBeenCalledWith('L_CART_SEC', '33333333', expect.any(Object));
    s.seleccionarAsesor(LUIS);
    expect(s.asesor()?.dni).toBe('33333333');
  });
});
