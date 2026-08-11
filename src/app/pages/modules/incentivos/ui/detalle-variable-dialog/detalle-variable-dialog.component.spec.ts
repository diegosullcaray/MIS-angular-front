import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DetalleVariableDialogComponent } from './detalle-variable-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { NivelSeleccionado, PerfilUsuarioIncentivo, ResultadoDetalleVariable } from '../../models';

function resultado(): ResultadoDetalleVariable {
  return {
    card: { cie_real: 100, var_real: 10, met: 90, exis_met: 1, avan: 1.1, f1: 'Ene', f2: 'Feb', blocks: 2 },
    vars: [{ des_var: 'Var 1', cod_block: 1, f1: 10, f2: 20, diff: 10 }],
    rank: [],
  };
}

/**
 * `DetalleVariableDialogComponent` solo pone el chrome del `p-dialog` — el
 * drill-down real se prueba en `DetalleVariableContentComponent.spec.ts`.
 */
describe('DetalleVariableDialogComponent', () => {
  let incentivosFalso: {
    perfil: ReturnType<typeof signal<PerfilUsuarioIncentivo | null>>;
    nivelActual: ReturnType<typeof signal<NivelSeleccionado | null>>;
    obtenerDetalleVariable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      perfil: signal<PerfilUsuarioIncentivo | null>({ nombre: 'Juan Pérez', nivel: 'CARGO', descripcionNivel: 'Asesor', imagenUrl: '' }),
      nivelActual: signal<NivelSeleccionado | null>({ tipCod: 1, codRel: 'BT-001', claUsu: 1 }),
      obtenerDetalleVariable: vi.fn().mockReturnValue(of(resultado())),
    };
    TestBed.configureTestingModule({
      imports: [DetalleVariableDialogComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear(props: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(DetalleVariableDialogComponent);
    fixture.componentRef.setInput('visible', true);
    Object.entries(props).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture;
  }

  it('al quedar visible, pasa req/codVar/mostrarTarjetas al contenido y este pide el detalle', () => {
    crear({ req: 'getDetail', codVar: 91, mostrarTarjetas: true });
    expect(incentivosFalso.obtenerDetalleVariable).toHaveBeenCalledWith('getDetail', 1, 'BT-001', 91);
  });

  it('expone título e ícono como inputs para el header del diálogo', () => {
    const fixture = crear({ titulo: 'Cartera', icono: 'pi pi-wallet' });
    expect(fixture.componentInstance.titulo()).toBe('Cartera');
    expect(fixture.componentInstance.icono()).toBe('pi pi-wallet');
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });
});
