import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuscadorColaboradorDialogComponent } from './buscador-colaborador-dialog.component';
import { KaypachaDashboardService } from '../../services/kaypacha-dashboard.service';
import type { KaypachaColaboradorItem } from '../../models/kaypacha-colaborador.model';

const COLABORADORES: KaypachaColaboradorItem[] = [
  { cod_bt: 'BT-001', des_col: 'Ana Torres', HCOLCAR: 'Asesor Comercial', RCODCOL: 'Puma', num_doc: '12345678' },
  { cod_bt: 'BT-002', des_col: 'Beto Ruiz', HCOLCAR: 'Supervisor', RCODCOL: 'Condor', num_doc: '87654321' },
];

describe('BuscadorColaboradorDialogComponent', () => {
  let serviceFalso: { colaboradores: ReturnType<typeof signal<KaypachaColaboradorItem[]>>; cargandoColaboradores: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    serviceFalso = { colaboradores: signal(COLABORADORES), cargandoColaboradores: signal(false) };
    TestBed.configureTestingModule({
      imports: [BuscadorColaboradorDialogComponent],
      providers: [{ provide: KaypachaDashboardService, useValue: serviceFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(BuscadorColaboradorDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('la fila elegida en la tabla queda como selección', () => {
    const fixture = crear();

    fixture.componentInstance['itemSeleccionado'].set(COLABORADORES[0]);
    expect(fixture.componentInstance['itemSeleccionado']()).toEqual(COLABORADORES[0]);

    fixture.componentInstance['itemSeleccionado'].set(null);
    expect(fixture.componentInstance['itemSeleccionado']()).toBeNull();
  });

  it('seleccionarYCerrar() emite colaboradorSeleccionado y cierra el diálogo', () => {
    const fixture = crear();
    let emitido: KaypachaColaboradorItem | undefined;
    fixture.componentInstance.colaboradorSeleccionado.subscribe((c) => (emitido = c));

    fixture.componentInstance['seleccionarYCerrar']();
    expect(emitido).toBeUndefined();

    fixture.componentInstance['itemSeleccionado'].set(COLABORADORES[0]);
    fixture.componentInstance['seleccionarYCerrar']();

    expect(emitido).toEqual(COLABORADORES[0]);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('cerrar() cierra el diálogo y limpia la selección', () => {
    const fixture = crear();
    fixture.componentInstance['itemSeleccionado'].set(COLABORADORES[0]);

    fixture.componentInstance['cerrar']();

    expect(fixture.componentInstance.visible()).toBe(false);
    expect(fixture.componentInstance['itemSeleccionado']()).toBeNull();
  });
});
