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
    buscarSpy = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [ConsultaRiesgoDialogComponent],
      providers: [{ provide: BaseNegativaService, useValue: { buscar: buscarSpy } }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ConsultaRiesgoDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga el listado completo (término vacío) al crearse', () => {
    buscarSpy.mockReturnValue(of([fila()]));
    const fixture = crear();

    expect(buscarSpy).toHaveBeenCalledWith('');
    expect(fixture.componentInstance['resultados']()).toEqual([fila()]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('cargarClientes() vuelve a pedir el listado y marca cargando mientras espera', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    buscarSpy.mockClear();
    buscarSpy.mockReturnValue(of([fila({ HCTACLI: 'C-002' })]));

    instancia['cargarClientes']();

    expect(buscarSpy).toHaveBeenCalledWith('');
    expect(instancia['resultados']()).toEqual([fila({ HCTACLI: 'C-002' })]);
  });

  it('seleccionar() emite clienteSeleccionado con la fila y cierra el diálogo', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    let emitido: BaseNegativaBusquedaFila | undefined;
    instancia.clienteSeleccionado.subscribe((f) => (emitido = f));

    instancia['seleccionar'](fila());

    expect(emitido).toEqual(fila());
    expect(instancia.visible).toBe(false);
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    let visibleEmitido: boolean | undefined;
    instancia.visibleChange.subscribe((v) => (visibleEmitido = v));

    instancia['cerrar']();

    expect(visibleEmitido).toBe(false);
  });
});
