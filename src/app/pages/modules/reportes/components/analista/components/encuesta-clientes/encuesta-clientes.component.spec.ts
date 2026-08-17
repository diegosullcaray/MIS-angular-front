import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { EncuestaClientesComponent } from './encuesta-clientes.component';
import { EncuestaClientesService } from '../../../services/analista/encuesta-clientes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { CiiuOpcion } from '../../../models/analista/encuesta-clientes.model';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };
const CIIU: CiiuOpcion[] = [
  { sec_eco: 'COMERCIO', id: 'COM-01', desc: 'Bodega' },
  { sec_eco: 'SERVICIO', id: 'SER-01', desc: 'Peluquería' },
];
const CLIENTE: FilaReporte = { nom_cli: 'María López', num_doc: '87654321' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('EncuestaClientesComponent', () => {
  let servicioFalso: {
    obtenerAsesores: ReturnType<typeof vi.fn>;
    obtenerCiiu: ReturnType<typeof vi.fn>;
    obtenerClientes: ReturnType<typeof vi.fn>;
    guardarEncuesta: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerCiiu: vi.fn().mockReturnValue(of(CIIU)),
      obtenerClientes: vi.fn().mockReturnValue(of(tabla({ body: [CLIENTE] }))),
      guardarEncuesta: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [EncuestaClientesComponent],
      providers: [{ provide: EncuestaClientesService, useValue: servicioFalso }, ToastService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(EncuestaClientesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga asesores y CIIU', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(servicioFalso.obtenerCiiu).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga la cartera de clientes del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerClientes).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tablaClientes']().body).toEqual([CLIENTE]);
  });

  it('onClienteSeleccionado() resetea el formulario y pasa a la pestaña "encuesta"', () => {
    const fixture = crear();
    fixture.componentInstance['model'].set({
      afecNeg: 'Total',
      funNeg: 'Si',
      sitNeg: 'Se redujo',
      secEco: '',
      redNeg: '0 -10%',
      girNeg: '',
    });

    fixture.componentInstance['onClienteSeleccionado'](CLIENTE);

    expect(fixture.componentInstance['clienteSeleccionado']()).toEqual(CLIENTE);
    expect(fixture.componentInstance['tabActiva']()).toBe('encuesta');
    expect(fixture.componentInstance['model']()).toEqual({ afecNeg: '', funNeg: '', sitNeg: '', secEco: '', redNeg: '', girNeg: '' });
  });

  it('onClienteSeleccionado() precarga la encuesta si el cliente ya la había respondido antes (reaccion snake_case)', () => {
    // Regresión: el legado guarda `reaccion` como un string JSON con las `variable`
    // originales (snake_case, ej. `fun_neg`), no con las claves camelCase del modelo.
    const fixture = crear();
    const clienteConReaccion: FilaReporte = {
      ...CLIENTE,
      reaccion: JSON.stringify({ afec_neg: 'Parcial', fun_neg: 'Si', sit_neg: 'Se mantiene igual', sec_eco: '', red_neg: '', gir_neg: '' }),
    };

    fixture.componentInstance['onClienteSeleccionado'](clienteConReaccion);

    expect(fixture.componentInstance['model']()).toEqual({
      afecNeg: 'Parcial',
      funNeg: 'Si',
      sitNeg: 'Se mantiene igual',
      secEco: '',
      redNeg: '',
      girNeg: '',
    });
  });

  describe('cascada condicional del formulario (encuestaForm)', () => {
    it('funNeg="Si": sitNeg visible+requerido; secEco/girNeg ocultos', () => {
      const fixture = crear();
      const form = fixture.componentInstance['encuestaForm'];
      fixture.componentInstance['actualizarCampo']('funNeg', 'Si');

      expect(form.sitNeg().hidden()).toBe(false);
      expect(form.secEco().hidden()).toBe(true);
      expect(form.girNeg().hidden()).toBe(true);

      // sitNeg vacío + requerido ⇒ el form no es válido todavía
      expect(form().valid()).toBe(false);
      fixture.componentInstance['actualizarCampo']('afecNeg', 'Total');
      fixture.componentInstance['actualizarCampo']('sitNeg', 'Se mantiene igual');
      expect(form().valid()).toBe(true);
    });

    it('funNeg="Cambio Giro": sitNeg y secEco visibles+requeridos; girNeg requerido pero oculto hasta que secEco tenga valor', () => {
      const fixture = crear();
      const form = fixture.componentInstance['encuestaForm'];
      fixture.componentInstance['actualizarCampo']('funNeg', 'Cambio Giro');

      expect(form.sitNeg().hidden()).toBe(false);
      expect(form.secEco().hidden()).toBe(false);
      expect(form.girNeg().hidden()).toBe(true);
      // secEco vacío + requerido ⇒ el form no es válido todavía (Signal Forms excluye
      // los campos ocultos de su propio invalid(), pero secEco ya bloquea el conjunto).
      expect(form().valid()).toBe(false);

      fixture.componentInstance['actualizarCampo']('secEco', 'COMERCIO');
      expect(form.girNeg().hidden()).toBe(false);
    });

    it('funNeg="No presenta Negocio": todo lo demás queda oculto y sin requerir', () => {
      const fixture = crear();
      const form = fixture.componentInstance['encuestaForm'];
      fixture.componentInstance['actualizarCampo']('funNeg', 'No presenta Negocio');

      expect(form.sitNeg().hidden()).toBe(true);
      expect(form.secEco().hidden()).toBe(true);
      expect(form.redNeg().hidden()).toBe(true);
      expect(form.girNeg().hidden()).toBe(true);

      fixture.componentInstance['actualizarCampo']('afecNeg', 'Ninguno');
      expect(form().valid()).toBe(true);
    });

    it('sitNeg="Se redujo": redNeg visible+requerido; con otro valor queda oculto', () => {
      const fixture = crear();
      const form = fixture.componentInstance['encuestaForm'];
      fixture.componentInstance['actualizarCampo']('funNeg', 'Si');
      fixture.componentInstance['actualizarCampo']('sitNeg', 'Se redujo');

      expect(form.redNeg().hidden()).toBe(false);
      expect(form.redNeg().invalid()).toBe(true);

      fixture.componentInstance['actualizarCampo']('sitNeg', 'Son más altos');
      expect(form.redNeg().hidden()).toBe(true);
    });

    it('opcionesGirNeg() filtra la lista CIIU por el sector económico elegido', () => {
      const fixture = crear();
      fixture.componentInstance['actualizarCampo']('secEco', 'SERVICIO');
      expect(fixture.componentInstance['opcionesGirNeg']()).toEqual([{ id: 'SER-01', desc: 'Peluquería' }]);
    });
  });

  it('onGuardar() no llama al servicio si el formulario es inválido', () => {
    const fixture = crear();
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['onGuardar']();
    expect(servicioFalso.guardarEncuesta).not.toHaveBeenCalled();
  });

  it('onGuardar() guarda, vuelve a "lista" y recarga la cartera cuando el formulario es válido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['tabActiva'].set('encuesta');
    fixture.componentInstance['model'].set({
      afecNeg: 'Total',
      funNeg: 'No presenta Negocio',
      sitNeg: '',
      secEco: '',
      redNeg: '',
      girNeg: '',
    });
    servicioFalso.obtenerClientes.mockClear();

    fixture.componentInstance['onGuardar']();

    expect(servicioFalso.guardarEncuesta).toHaveBeenCalledWith(CLIENTE, fixture.componentInstance['model']());
    expect(fixture.componentInstance['tabActiva']()).toBe('lista');
    expect(fixture.componentInstance['clienteSeleccionado']()).toBeNull();
    expect(servicioFalso.obtenerClientes).toHaveBeenCalled();
  });

  it('onGuardar() ante un error del backend muestra un toast y no bloquea el botón', () => {
    servicioFalso.guardarEncuesta.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['model'].set({
      afecNeg: 'Total',
      funNeg: 'No presenta Negocio',
      sitNeg: '',
      secEco: '',
      redNeg: '',
      girNeg: '',
    });

    fixture.componentInstance['onGuardar']();

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['guardando']()).toBe(false);
  });
});
