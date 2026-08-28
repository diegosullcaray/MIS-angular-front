import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { MentoringComponent } from './mentoring.component';
import { CampanasService } from '../../services/campanas.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };
const OTRO_NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'BP' };
const TABLA_VACIA = { headers: [], body: [], additional: {} };

/**
 * Regresión del ítem 2 de `docs/09-incidencias/incidencias-campañas.md`:
 * "no estás trayendo los filtros de los asesores".
 *
 * El legado (`report-cra-v1p7.component.ts`) trae las opciones de "Asesor"
 * del BACKEND para el nodo elegido (`SEL_JER_MENTORING_01`), no de un
 * catálogo fijo, y resetea el asesor a "TODO" cada vez que cambia el nivel
 * (`renderUltGestion()` crea un `SelectService` nuevo).
 */
describe('MentoringComponent', () => {
  function crear(opcionesAsesorMentoring = vi.fn().mockReturnValue(of([{ id: 'TODO', desc: 'TODO' }]))) {
    const mentoring = vi.fn().mockReturnValue(of(TABLA_VACIA));
    TestBed.configureTestingModule({
      imports: [MentoringComponent],
      providers: [{ provide: CampanasService, useValue: { mentoring, opcionesAsesorMentoring } }, PrimeNgMessageService],
    });
    const fixture = TestBed.createComponent(MentoringComponent);
    fixture.detectChanges();
    return {
      instancia: fixture.componentInstance as unknown as {
        onNivelSeleccionado(nodo: HierarquiaNodo): void;
        asesor: { (): string; set(v: string): void };
        opcionesAsesor: () => { id: string; desc: string }[];
      },
      fixture,
      mentoring,
      opcionesAsesorMentoring,
    };
  }

  it('al elegir un nivel pide las opciones de asesor para ESE nodo', () => {
    const { instancia, fixture, opcionesAsesorMentoring } = crear();

    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();

    expect(opcionesAsesorMentoring).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' });
  });

  it('la tabla se pide con "TODO" antes de elegir ningún asesor', () => {
    const { instancia, fixture, mentoring } = crear();

    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();

    expect(mentoring).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' }, 'TODO');
  });

  it('elegir un asesor vuelve a pedir la tabla con ese asesor, mismo nivel', () => {
    const { instancia, fixture, mentoring } = crear();
    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();
    mentoring.mockClear();

    instancia.asesor.set('TTABA100');
    fixture.detectChanges();

    expect(mentoring).toHaveBeenCalledTimes(1);
    expect(mentoring).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' }, 'TTABA100');
  });

  /**
   * El legado descarta el asesor elegido al cambiar de nivel: un asesor de la
   * unidad anterior no tiene por qué existir en la nueva.
   */
  it('cambiar de nivel resetea el asesor a "TODO", no arrastra el anterior', () => {
    const { instancia, fixture, mentoring, opcionesAsesorMentoring } = crear();
    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();
    instancia.asesor.set('TTABA100');
    fixture.detectChanges();
    mentoring.mockClear();
    opcionesAsesorMentoring.mockClear();

    instancia.onNivelSeleccionado(OTRO_NODO);
    fixture.detectChanges();

    expect(instancia.asesor()).toBe('TODO');
    expect(opcionesAsesorMentoring).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'BP' });
    // La última llamada a la tabla debe quedar con el nodo nuevo y "TODO" — no con el asesor de la unidad anterior.
    expect(mentoring).toHaveBeenLastCalledWith({ tip_cod: 9, cod_rel: 'BP' }, 'TODO');
  });

  it('un error al traer las opciones de asesor deja "TODO" como única opción, sin romper la pantalla', () => {
    const { instancia, fixture, opcionesAsesorMentoring } = crear(
      vi.fn().mockReturnValue({ subscribe: ({ error }: { error: () => void }) => error() }),
    );

    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();

    expect(opcionesAsesorMentoring).toHaveBeenCalled();
    expect(instancia.opcionesAsesor()).toEqual([{ id: 'TODO', desc: 'TODO' }]);
  });
});
