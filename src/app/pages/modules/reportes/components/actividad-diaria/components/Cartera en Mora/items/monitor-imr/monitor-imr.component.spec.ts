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

/**
 * Segunda vuelta de la incidencia 1 (`incidencias-mora-actualizado.md`, tarea 1):
 * "al hacer clic en las tarjetas de KPI se abren modales de forma incorrecta".
 *
 * En el legado `detCard()` tiene la apertura del diálogo COMENTADA y
 * `getCardValStyle()` no devuelve subrayado: las tarjetas son solo lectura.
 */
describe('MonitorImrComponent — las tarjetas KPI no son interactivas', () => {
  function fixtureConTarjetas() {
    TestBed.configureTestingModule({
      imports: [MonitorImrComponent],
      providers: [
        {
          provide: MonitorImrService,
          useValue: {
            resultados: vi.fn().mockReturnValue(
              of({
                cards: [
                  { lbl: 'IMR', val: 10, typ: 'number' },
                  { lbl: 'Entradas', val: 20, typ: 'number' },
                ],
                table: [],
                columnas: [],
              }),
            ),
            detalle: vi.fn().mockReturnValue(of([])),
          },
        },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(MonitorImrComponent);
    const instancia = fixture.componentInstance as unknown as {
      onNivelSeleccionado(n: unknown): void;
      metrica(): string | null;
    };
    instancia.onNivelSeleccionado({ tip_cod: 9, cod_rel: 'FC', des_rel: 'FC' });
    fixture.detectChanges();
    return { fixture, instancia };
  }

  it('las tarjetas se pintan como `div`, no como `button`', () => {
    const { fixture } = fixtureConTarjetas();
    const tarjetas = fixture.nativeElement.querySelectorAll('.mis-card') as NodeListOf<HTMLElement>;

    expect(tarjetas.length).toBeGreaterThan(0);
    for (const t of tarjetas) expect(t.tagName).not.toBe('BUTTON');
  });

  it('hacer clic en una tarjeta no abre el diálogo', () => {
    const { fixture, instancia } = fixtureConTarjetas();
    const tarjeta = fixture.nativeElement.querySelector('.mis-card') as HTMLElement;

    tarjeta.click();
    fixture.detectChanges();

    expect(instancia.metrica()).toBeNull();
  });

  it('el valor de la tarjeta no lleva subrayado de enlace', () => {
    const { fixture } = fixtureConTarjetas();
    const subrayados = fixture.nativeElement.querySelectorAll('.mis-card .underline');

    expect(subrayados.length).toBe(0);
  });
});
