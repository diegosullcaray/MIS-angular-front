import { TestBed } from '@angular/core/testing';
import { SelectorSectoristaDialogComponent } from './selector-sectorista-dialog.component';
import type { SectoristaItem } from '../../models/colaborador.model';

const SECTORISTAS: SectoristaItem[] = [
  { cod_sec: 'SEC-1', des_sec: 'Juan Pérez' },
  { cod_sec: 'SEC-2', des_sec: 'María López' },
];

describe('SelectorSectoristaDialogComponent', () => {
  function crear(sectoristas: SectoristaItem[] = SECTORISTAS) {
    TestBed.configureTestingModule({ imports: [SelectorSectoristaDialogComponent] });
    const fixture = TestBed.createComponent(SelectorSectoristaDialogComponent);
    fixture.componentRef.setInput('sectoristas', sectoristas);
    fixture.detectChanges();
    return fixture;
  }

  it('filtrados() sin filtro devuelve todos los sectoristas', () => {
    const fixture = crear();
    expect(fixture.componentInstance['filtrados']()).toEqual(SECTORISTAS);
  });

  it('filtrados() filtra por nombre o código, sin distinguir mayúsculas/minúsculas', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['filtro'].set('maría');
    expect(instancia['filtrados']()).toEqual([{ cod_sec: 'SEC-2', des_sec: 'María López' }]);

    instancia['filtro'].set('sec-1');
    expect(instancia['filtrados']()).toEqual([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }]);
  });

  it('confirmar() no hace nada si no hay ningún sectorista seleccionado', () => {
    const fixture = crear();
    const emitSpy = vi.fn();
    fixture.componentInstance.sectoristaSeleccionado.subscribe(emitSpy);

    fixture.componentInstance['confirmar']();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('onSeleccionarFila() + confirmar() emite el sectorista elegido y cierra el diálogo', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const seleccionadoSpy = vi.fn();
    const visibleChangeSpy = vi.fn();
    instancia.sectoristaSeleccionado.subscribe(seleccionadoSpy);
    instancia.visibleChange.subscribe(visibleChangeSpy);

    instancia['onSeleccionarFila'](SECTORISTAS[1]);
    instancia['confirmar']();

    expect(seleccionadoSpy).toHaveBeenCalledWith(SECTORISTAS[1]);
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
  });

  it('cerrar() limpia el filtro y la selección', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['filtro'].set('juan');
    instancia['onSeleccionarFila'](SECTORISTAS[0]);

    instancia['cerrar']();

    expect(instancia['filtro']()).toBe('');
    expect(instancia['seleccionado']()).toBeNull();
  });
});
