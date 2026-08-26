import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { MonitorImrComponent } from './monitor-imr.component';
import { MonitorImrService } from '../../services/monitor-imr.service';
import { RESULTADO_IMR_VACIO } from '../../models/cartera-en-mora.model';

/** Fila normal de la tabla: se puede bajar de nivel y abrir su detalle. */
const FILA = { tip_cod: 18, cod_rel: 'U01', desc: 'UNIDAD 1', sali2: 5, sali3: 3, style: 0 };
/** Fila de total: el legado la descarta en las tres ramas. */
const FILA_TOTAL = { ...FILA, style: 1 };

/**
 * Regresión de la incidencia 1 de `docs/09-incidencias/incidencias-mora.md`:
 * "me está abriendo diálogos que no pertenecen".
 *
 * El `ddEvent()` del legado hace tres cosas distintas según la COLUMNA tocada:
 * `desc` baja un nivel de jerarquía, `sali2`/`sali3` abren el listado de
 * clientes, y cualquier otra columna no hace nada.
 */
describe('MonitorImrComponent — clic en la tabla', () => {
  let resultados: ReturnType<typeof vi.fn>;
  let detalle: ReturnType<typeof vi.fn>;

  function crear() {
    resultados = vi.fn().mockReturnValue(of(RESULTADO_IMR_VACIO));
    detalle = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [MonitorImrComponent],
      providers: [
        { provide: MonitorImrService, useValue: { resultados, detalle } },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(MonitorImrComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      onCelda(e: { clave: string; fila: Record<string, unknown> }): void;
      metrica(): string | null;
      nivelActual(): { cod_rel: string } | null;
    };
  }

  it('`sali2` abre el detalle con esa métrica', () => {
    const c = crear();
    c.onCelda({ clave: 'sali2', fila: FILA });

    expect(c.metrica()).toBe('sali2');
  });

  it('`sali3` abre el detalle con esa métrica', () => {
    const c = crear();
    c.onCelda({ clave: 'sali3', fila: FILA });

    expect(c.metrica()).toBe('sali3');
  });

  it('`desc` NO abre el detalle: baja un nivel en la jerarquía', () => {
    const c = crear();
    c.onCelda({ clave: 'desc', fila: FILA });

    expect(c.metrica()).toBeNull();
    expect(c.nivelActual()?.cod_rel).toBe('U01');
  });

  it('una columna cualquiera no abre nada — el bug reportado', () => {
    const c = crear();
    c.onCelda({ clave: 'sali1', fila: FILA });
    c.onCelda({ clave: 'IncVarMes', fila: FILA });

    expect(c.metrica()).toBeNull();
  });

  it('las filas de total (`style === 1`) no responden en ninguna columna', () => {
    const c = crear();
    c.onCelda({ clave: 'sali2', fila: FILA_TOTAL });
    c.onCelda({ clave: 'desc', fila: FILA_TOTAL });

    expect(c.metrica()).toBeNull();
    expect(c.nivelActual()).toBeNull();
  });

  it('el drill-down corta en Financiera (`tip_cod === 1`), como `ddHier()` del legado', () => {
    const c = crear();
    c.onCelda({ clave: 'desc', fila: { ...FILA, tip_cod: 1 } });

    expect(c.nivelActual()).toBeNull();
  });

  it('una fila sin nodo de jerarquía se ignora', () => {
    const c = crear();
    c.onCelda({ clave: 'sali2', fila: { desc: 'x', style: 0 } });

    expect(c.metrica()).toBeNull();
  });

});
