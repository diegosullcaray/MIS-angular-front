import { HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  TIMEOUT_MS,
  TIMEOUT_REPORTE_PESADO_MS,
} from '../../../../../../../../core/interceptors/auth.interceptor';
import { CampanasService } from './campanas.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * Regresión del ítem 2 de `docs/09-incidencias/incidencias-campañas.md`:
 * "Failed to load resource: [...] 500 [...] no está cargando la data (dale
 * más tiempo de carga) [...] además no estás trayendo los filtros de los
 * asesores".
 *
 * El legado (`report-cra-v1p7.component.ts`) manda el asesor elegido (`resp`)
 * junto al `fec` del bloque; sin `resp` el backend respondía 500.
 */
describe('CampanasService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let servicio: CampanasService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularData } }] });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(CampanasService);
  });

  describe('mentoring()', () => {
    it('sin asesor elegido manda `resp: "TODO"` por defecto, junto al `fec` del bloque', () => {
      servicio.mentoring(NODO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RMENTORIN_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '20251130', resp: 'TODO' });
    });

    it('el asesor elegido reemplaza a "TODO"', () => {
      servicio.mentoring(NODO, 'TTABA100').subscribe();

      expect(getRegularData.mock.calls[0][1]).toMatchObject({ resp: 'TTABA100' });
    });

    it('pide el timeout largo: el reporte movía tanta data que no entraba en los 30 s por defecto', () => {
      servicio.mentoring(NODO).subscribe();

      const contexto = getRegularData.mock.calls[0][2] as HttpContext | undefined;
      expect(contexto?.get(TIMEOUT_MS)).toBe(TIMEOUT_REPORTE_PESADO_MS);
    });
  });

  describe('opcionesAsesorMentoring()', () => {
    function respuestaAsesores(filas: { id: string; desc: string }[]) {
      return of({ code: '0', headers: {}, body: { result: { headers: [], body: filas, additional: {} } } });
    }

    it('pide `SEL_JER_MENTORING_01` con exactamente `{ tip_cod, cod_rel }`, sin `fec` y con timeout pesado', () => {
      getRegularData.mockReturnValue(respuestaAsesores([]));

      servicio.opcionesAsesorMentoring(NODO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('SEL_JER_MENTORING_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC' });
      const contexto = getRegularData.mock.calls[0][2] as HttpContext | undefined;
      expect(contexto?.get(TIMEOUT_MS)).toBe(TIMEOUT_REPORTE_PESADO_MS);
    });

    it('antepone "TODO" a los asesores que devuelve el backend', () => {
      getRegularData.mockReturnValue(
        respuestaAsesores([
          { id: 'TTABA100', desc: 'ABANTO ARIMUYA, THAMAR' },
          { id: 'TMABD001', desc: 'ABANTO DAVILA MISHELLE STEPH' },
        ]),
      );

      let opciones: { id: string; desc: string }[] | undefined;
      servicio.opcionesAsesorMentoring(NODO).subscribe((o) => (opciones = o));

      expect(opciones).toEqual([
        { id: 'TODO', desc: 'TODO' },
        { id: 'TTABA100', desc: 'ABANTO ARIMUYA, THAMAR' },
        { id: 'TMABD001', desc: 'ABANTO DAVILA MISHELLE STEPH' },
      ]);
    });

    it('sin asesores del backend deja solo la opción "TODO"', () => {
      getRegularData.mockReturnValue(respuestaAsesores([]));

      let opciones: { id: string; desc: string }[] | undefined;
      servicio.opcionesAsesorMentoring(NODO).subscribe((o) => (opciones = o));

      expect(opciones).toEqual([{ id: 'TODO', desc: 'TODO' }]);
    });
  });
});
