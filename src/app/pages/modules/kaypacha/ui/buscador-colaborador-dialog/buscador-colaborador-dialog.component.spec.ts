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

  it('sin filtro, muestra todos los colaboradores', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colaboradoresFiltrados']()).toEqual(COLABORADORES);
  });

  it('filtra por nombre (des_col), sin importar mayúsculas/minúsculas', () => {
    const fixture = crear();
    fixture.componentInstance['filtroTexto'].set('ana');

    expect(fixture.componentInstance['colaboradoresFiltrados']()).toEqual([COLABORADORES[0]]);
  });

  it('filtra por cargo (HCOLCAR)', () => {
    const fixture = crear();
    fixture.componentInstance['filtroTexto'].set('supervisor');

    expect(fixture.componentInstance['colaboradoresFiltrados']()).toEqual([COLABORADORES[1]]);
  });

  it('filtra por código BT o número de documento', () => {
    const fixture = crear();

    fixture.componentInstance['filtroTexto'].set('bt-002');
    expect(fixture.componentInstance['colaboradoresFiltrados']()).toEqual([COLABORADORES[1]]);

    fixture.componentInstance['filtroTexto'].set('12345678');
    expect(fixture.componentInstance['colaboradoresFiltrados']()).toEqual([COLABORADORES[0]]);
  });

  it('onFilterInput() actualiza filtroTexto desde el valor del input', () => {
    const fixture = crear();
    const input = document.createElement('input');
    input.value = 'beto';

    fixture.componentInstance['onFilterInput']({ target: input } as unknown as Event);

    expect(fixture.componentInstance['filtroTexto']()).toBe('beto');
  });

  it('onRowSelect() guarda el ítem seleccionado', () => {
    const fixture = crear();

    fixture.componentInstance['onRowSelect'](COLABORADORES[0]);
    expect(fixture.componentInstance['itemSeleccionado']()).toEqual(COLABORADORES[0]);

    fixture.componentInstance['onRowSelect']([COLABORADORES[1]]);
    expect(fixture.componentInstance['itemSeleccionado']()).toEqual(COLABORADORES[0]);
  });

  it('seleccionarYCerrar() emite colaboradorSeleccionado y cierra el diálogo', () => {
    const fixture = crear();
    let emitido: KaypachaColaboradorItem | undefined;
    fixture.componentInstance.colaboradorSeleccionado.subscribe((c) => (emitido = c));

    fixture.componentInstance['seleccionarYCerrar']();
    expect(emitido).toBeUndefined();

    fixture.componentInstance['onRowSelect'](COLABORADORES[0]);
    fixture.componentInstance['seleccionarYCerrar']();

    expect(emitido).toEqual(COLABORADORES[0]);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('cerrar() cierra el diálogo y limpia el filtro/selección', () => {
    const fixture = crear();
    fixture.componentInstance['filtroTexto'].set('ana');
    fixture.componentInstance['onRowSelect'](COLABORADORES[0]);

    fixture.componentInstance['cerrar']();

    expect(fixture.componentInstance.visible()).toBe(false);
    expect(fixture.componentInstance['filtroTexto']()).toBe('');
    expect(fixture.componentInstance['itemSeleccionado']()).toBeNull();
  });
});
