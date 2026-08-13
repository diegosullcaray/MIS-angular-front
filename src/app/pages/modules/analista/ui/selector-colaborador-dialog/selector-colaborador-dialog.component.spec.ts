import { TestBed } from '@angular/core/testing';
import { SelectorColaboradorDialogComponent } from './selector-colaborador-dialog.component';
import type { ColaboradorItem } from '../../models/colaborador.model';

const COLABORADORES: ColaboradorItem[] = [
  { cod_sec: 'SEC-1', des_sec: 'Juan Pérez' },
  { cod_sec: 'SEC-2', des_sec: 'María López' },
];

describe('SelectorColaboradorDialogComponent', () => {
  function crear(colaboradores: ColaboradorItem[] = COLABORADORES) {
    TestBed.configureTestingModule({ imports: [SelectorColaboradorDialogComponent] });
    const fixture = TestBed.createComponent(SelectorColaboradorDialogComponent);
    fixture.componentRef.setInput('colaboradores', colaboradores);
    fixture.detectChanges();
    return fixture;
  }

  it('filtrados() sin filtro devuelve todos los colaboradores', () => {
    const fixture = crear();
    expect(fixture.componentInstance['filtrados']()).toEqual(COLABORADORES);
  });

  it('filtrados() filtra por nombre o código, sin distinguir mayúsculas/minúsculas', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['filtro'].set('maría');
    expect(instancia['filtrados']()).toEqual([{ cod_sec: 'SEC-2', des_sec: 'María López' }]);

    instancia['filtro'].set('sec-1');
    expect(instancia['filtrados']()).toEqual([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }]);
  });

  it('confirmar() no hace nada si no hay ningún colaborador seleccionado', () => {
    const fixture = crear();
    const emitSpy = vi.fn();
    fixture.componentInstance.colaboradorSeleccionado.subscribe(emitSpy);

    fixture.componentInstance['confirmar']();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('onSeleccionarFila() + confirmar() emite el colaborador elegido y cierra el diálogo', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const seleccionadoSpy = vi.fn();
    const visibleChangeSpy = vi.fn();
    instancia.colaboradorSeleccionado.subscribe(seleccionadoSpy);
    instancia.visibleChange.subscribe(visibleChangeSpy);

    instancia['onSeleccionarFila'](COLABORADORES[1]);
    instancia['confirmar']();

    expect(seleccionadoSpy).toHaveBeenCalledWith(COLABORADORES[1]);
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
  });

  it('cerrar() limpia el filtro y la selección', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['filtro'].set('juan');
    instancia['onSeleccionarFila'](COLABORADORES[0]);

    instancia['cerrar']();

    expect(instancia['filtro']()).toBe('');
    expect(instancia['seleccionado']()).toBeNull();
  });
});
