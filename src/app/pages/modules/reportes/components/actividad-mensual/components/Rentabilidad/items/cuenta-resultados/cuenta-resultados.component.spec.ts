import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CuentaResultadosComponent } from './cuenta-resultados.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { ContratoCuentaResultadosError, mapearCuentaResultados } from '../../../../utils/cuenta-resultados.util';
import type { CuentaResultadosResultado } from '../../../../models/cuenta-resultados.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 7, cod_rel: '231', desc_rel: 'Unidad 231', lvl: 1 };
const HEADERS = JSON.stringify({ preliminar: 1, fechas: ['2026-06-01', '2026-05-01'] });
const FILA = { style: 2, cuenta_codigo: 'CR012', cuenta_nombre: 'INGRESOS FINANCIEROS', periodo_actual: 3 };

function resultado(data: unknown[], fecha: string | null = null): CuentaResultadosResultado {
  return mapearCuentaResultados({ headers: HEADERS, data }, fecha);
}

type Vista = {
  onNivelSeleccionado(nodo: HierarquiaNodo): void;
  onPeriodoChange(valor: string): void;
  reintentar(): void;
  error(): string | null;
  cargando(): boolean;
  periodo(): string;
  preliminar(): boolean;
  resultado(): CuentaResultadosResultado | null;
};

describe('CuentaResultadosComponent', () => {
  let cuentaResultados: ReturnType<typeof vi.fn>;

  function crear() {
    TestBed.configureTestingModule({
      imports: [CuentaResultadosComponent],
      providers: [{ provide: ActividadMensualRepoService, useValue: { cuentaResultados } }, MessageService],
    });
    const fixture = TestBed.createComponent(CuentaResultadosComponent);
    fixture.detectChanges();
    const vista = fixture.componentInstance as unknown as Vista;
    const seleccionar = () => {
      vista.onNivelSeleccionado(NODO);
      TestBed.tick();
      fixture.detectChanges();
    };
    return { fixture, vista, seleccionar };
  }

  beforeEach(() => {
    cuentaResultados = vi.fn((_nodo, fecha: string | null) => of(resultado([FILA], fecha)));
  });

  it('la primera consulta va con NOW y toma el periodo devuelto sin pedir otra vez', () => {
    const { vista, seleccionar } = crear();
    seleccionar();

    expect(cuentaResultados).toHaveBeenCalledTimes(1);
    expect(cuentaResultados).toHaveBeenCalledWith({ tip_cod: 7, cod_rel: '231' }, null);
    expect(vista.periodo()).toBe('2026-06-01');
    expect(vista.preliminar()).toBe(true);
  });

  it('dibuja la tabla con la marca de preliminar', () => {
    const { fixture, seleccionar } = crear();
    seleccionar();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('INGRESOS FINANCIEROS');
    expect(texto).toContain('Junio de 2026');
    expect(texto).toContain('Preliminar');
  });

  it('cambiar el periodo reconsulta el mismo nodo', () => {
    const { vista, seleccionar } = crear();
    seleccionar();
    vista.onPeriodoChange('2026-05-01');
    TestBed.tick();

    expect(cuentaResultados).toHaveBeenCalledTimes(2);
    expect(cuentaResultados).toHaveBeenLastCalledWith({ tip_cod: 7, cod_rel: '231' }, '2026-05-01');
    expect(vista.periodo()).toBe('2026-05-01');
  });

  it('un periodo que no ofreció el backend es error y no consulta', () => {
    const { vista, seleccionar } = crear();
    seleccionar();
    vista.onPeriodoChange('2026-01-01');
    TestBed.tick();

    expect(cuentaResultados).toHaveBeenCalledTimes(1);
    expect(vista.error()).toBe('El período seleccionado tiene un formato inválido.');
  });

  it('sin filas muestra el vacío del legado, no un error', () => {
    cuentaResultados.mockReturnValue(of(resultado([])));
    const { fixture, vista, seleccionar } = crear();
    seleccionar();

    expect(vista.error()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron resultados para los filtros seleccionados.');
    expect(fixture.nativeElement.querySelector('app-tabla-dinamica')).toBeNull();
  });

  it('un payload inválido muestra el mensaje de contrato', () => {
    cuentaResultados.mockReturnValue(
      throwError(() => new ContratoCuentaResultadosError('El reporte devolvió metadatos inválidos.')),
    );
    const { fixture, vista, seleccionar } = crear();
    seleccionar();

    expect(vista.error()).toBe('El reporte devolvió metadatos inválidos.');
    expect(fixture.nativeElement.querySelector('app-inline-error')).not.toBeNull();
  });

  it('un fallo del backend es error persistente con reintento, no tabla vacía', () => {
    cuentaResultados.mockReturnValueOnce(throwError(() => new Error('500')));
    const { fixture, vista, seleccionar } = crear();
    seleccionar();

    expect(vista.error()).toBe('No se pudo cargar el reporte.');
    expect(vista.cargando()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();

    vista.reintentar();
    TestBed.tick();
    expect(cuentaResultados).toHaveBeenCalledTimes(2);
    expect(vista.error()).toBeNull();
    expect(vista.resultado()?.filas).toEqual([FILA]);
  });

  it('una respuesta vieja no pisa la de un periodo posterior', () => {
    const lenta = new Subject<CuentaResultadosResultado>();
    cuentaResultados.mockReturnValueOnce(lenta);
    const { vista, seleccionar } = crear();
    seleccionar();

    // Llega la respuesta tardía de la primera consulta después de pedir otra.
    cuentaResultados.mockReturnValueOnce(of(resultado([FILA], '2026-05-01')));
    vista.onNivelSeleccionado({ ...NODO, cod_rel: '999' });
    TestBed.tick();
    lenta.next(resultado([], null));

    expect(vista.resultado()?.filas).toEqual([FILA]);
  });

  it('un fallo de la jerarquía es error con reintento, no "elige un nivel"', () => {
    const { fixture } = crear();
    const vista = fixture.componentInstance as unknown as { onErrorJerarquia(): void };
    vista.onErrorJerarquia();
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('No se pudo cargar la jerarquía.');
    expect(texto).not.toContain('Elige un nivel');
    expect(cuentaResultados).not.toHaveBeenCalled();
  });
});
