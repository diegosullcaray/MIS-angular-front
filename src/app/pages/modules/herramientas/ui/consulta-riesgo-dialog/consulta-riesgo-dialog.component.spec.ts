import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConsultaRiesgoDialogComponent } from './consulta-riesgo-dialog.component';
import { BaseNegativaService } from '../../services/base-negativa.service';
import type { BaseNegativaBusquedaFila } from '../../models/base-negativa.model';

function fila(overrides: Partial<BaseNegativaBusquedaFila> = {}): BaseNegativaBusquedaFila {
  return { HCTACLI: 'C-001', HDESCLI: 'Juan Pérez', FECHA: '2026-01-01', TIPO: 'Venta', ...overrides };
}

describe('ConsultaRiesgoDialogComponent', () => {
  let buscarSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    buscarSpy = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [ConsultaRiesgoDialogComponent],
      providers: [{ provide: BaseNegativaService, useValue: { buscar: buscarSpy } }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function crear() {
    const fixture = TestBed.createComponent(ConsultaRiesgoDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('hace una búsqueda inicial (término vacío) 500ms después de crearse', () => {
    buscarSpy.mockReturnValue(of([fila()]));
    const fixture = crear();

    vi.advanceTimersByTime(500);

    expect(buscarSpy).toHaveBeenCalledWith('');
    expect(fixture.componentInstance['resultados']()).toEqual([fila()]);
  });

  it('onBuscar() espera 500ms de debounce antes de buscar en el servidor', () => {
    const fixture = crear();
    vi.advanceTimersByTime(500); // consume la búsqueda inicial
    buscarSpy.mockClear();

    const input = document.createElement('input');
    input.value = 'juan';
    fixture.componentInstance['onBuscar']({ target: input } as unknown as Event);

    expect(buscarSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(buscarSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(buscarSpy).toHaveBeenCalledWith('juan');
  });

  it('no repite la búsqueda si el término no cambió (distinctUntilChanged)', () => {
    const fixture = crear();
    vi.advanceTimersByTime(500);
    buscarSpy.mockClear();

    const input = document.createElement('input');
    input.value = '';
    fixture.componentInstance['onBuscar']({ target: input } as unknown as Event); // mismo valor que la búsqueda inicial

    vi.advanceTimersByTime(500);

    expect(buscarSpy).not.toHaveBeenCalled();
  });

  it('marca cargando mientras espera la respuesta del servidor', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    const input = document.createElement('input');
    input.value = 'juan';
    instancia['onBuscar']({ target: input } as unknown as Event);
    vi.advanceTimersByTime(500);

    expect(instancia['cargando']()).toBe(false); // buscarSpy resuelve síncrono (of([]))
  });

  it('onRowSelect() guarda el ítem seleccionado, ignorando arreglos', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['onRowSelect'](fila());
    expect(instancia['itemSeleccionado']()).toEqual(fila());

    instancia['onRowSelect']([fila({ HCTACLI: 'C-002' })]);
    expect(instancia['itemSeleccionado']()).toEqual(fila()); // no cambia
  });

  it('seleccionarYCerrar() emite clienteSeleccionado y cierra, solo si hay selección', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    let emitido: BaseNegativaBusquedaFila | undefined;
    instancia.clienteSeleccionado.subscribe((f) => (emitido = f));

    instancia['seleccionarYCerrar']();
    expect(emitido).toBeUndefined();

    instancia['onRowSelect'](fila());
    instancia['seleccionarYCerrar']();

    expect(emitido).toEqual(fila());
    expect(instancia.visible).toBe(false);
  });

  it('cerrar() emite visibleChange(false) y limpia la selección', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['onRowSelect'](fila());

    let visibleEmitido: boolean | undefined;
    instancia.visibleChange.subscribe((v) => (visibleEmitido = v));

    instancia['cerrar']();

    expect(visibleEmitido).toBe(false);
    expect(instancia['itemSeleccionado']()).toBeNull();
  });
});
