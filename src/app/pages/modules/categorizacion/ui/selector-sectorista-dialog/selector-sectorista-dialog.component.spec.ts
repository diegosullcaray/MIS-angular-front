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

  // El filtrado lo hace `app-data-table` con `searchFields`, como el
  // `SecPickerDialog2` legado: el diálogo solo declara columnas y datos.
  it('muestra los sectoristas en la tabla con las columnas y la búsqueda del legado', () => {
    const fixture = crear();
    const texto = fixture.nativeElement.ownerDocument.body.textContent as string;

    expect(fixture.componentInstance['columnas'].map((c: { field: string }) => c.field)).toEqual([
      'des_sec',
      'des_uni',
      'des_cor',
      'des_ter',
    ]);
    expect(fixture.componentInstance.sectoristas()).toEqual(SECTORISTAS);
    expect(texto).not.toContain('undefined');
  });

  it('confirmar() no hace nada si no hay ningún sectorista seleccionado', () => {
    const fixture = crear();
    const emitSpy = vi.fn();
    fixture.componentInstance.sectoristaSeleccionado.subscribe(emitSpy);

    fixture.componentInstance['confirmar']();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('elegir una fila + confirmar() emite el sectorista elegido y cierra el diálogo', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const seleccionadoSpy = vi.fn();
    const visibleChangeSpy = vi.fn();
    instancia.sectoristaSeleccionado.subscribe(seleccionadoSpy);
    instancia.visibleChange.subscribe(visibleChangeSpy);

    instancia['seleccionado'].set(SECTORISTAS[1]);
    instancia['confirmar']();

    expect(seleccionadoSpy).toHaveBeenCalledWith(SECTORISTAS[1]);
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
  });

  it('cerrar() avisa el cierre y limpia la selección', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const visibleChangeSpy = vi.fn();
    instancia.visibleChange.subscribe(visibleChangeSpy);

    instancia['seleccionado'].set(SECTORISTAS[0]);
    instancia['cerrar']();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(instancia['seleccionado']()).toBeNull();
  });
});
