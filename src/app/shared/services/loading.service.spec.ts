import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('empieza sin loading activo', () => {
    expect(service.cargando()).toBe(false);
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });
  });

  it('show() activa el loading y guarda el mensaje', () => {
    service.show('Cargando categorías...');

    expect(service.cargando()).toBe(true);
    expect(service.estado().message).toBe('Cargando categorías...');
    expect(service.estado().requestCount).toBe(1);
  });

  it('hide() solo apaga el loading cuando no quedan requests pendientes', () => {
    service.show();
    service.show(); // dos requests concurrentes

    service.hide();
    expect(service.cargando()).toBe(true); // todavía queda 1 pendiente
    expect(service.estado().requestCount).toBe(1);

    service.hide();
    expect(service.cargando()).toBe(false);
    expect(service.estado().requestCount).toBe(0);
  });

  it('hide() sin ningún show() previo no baja el contador de 0', () => {
    service.hide();
    expect(service.estado().requestCount).toBe(0);
    expect(service.cargando()).toBe(false);
  });

  it('forceHide() apaga el loading inmediatamente sin importar cuántos requests queden', () => {
    service.show();
    service.show();
    service.show();

    service.forceHide();

    expect(service.cargando()).toBe(false);
    expect(service.estado().requestCount).toBe(0);
  });

  it('estado es un signal que refleja cada cambio', () => {
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });

    service.show();
    expect(service.estado().isLoading).toBe(true);
    expect(service.cargando()).toBe(true);

    service.hide();
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });
    expect(service.cargando()).toBe(false);
  });

  describe('carga independiente de las peticiones HTTP', () => {
    /** Termina la tarea actual: lo que arranque después es una tanda nueva. */
    const otraTarea = () => Promise.resolve();

    it('una tanda muestra el overlay hasta que responde la primera petición', () => {
      const tanda = service.iniciarPeticion();
      service.iniciarPeticion();
      service.iniciarPeticion();
      expect(service.cargando()).toBe(true);

      service.terminarPeticion(tanda);
      expect(service.cargando()).toBe(false);
      expect(service.estado().requestCount).toBe(2);
    });

    it('cuando terminan todas, la siguiente tanda vuelve a mostrar el overlay', async () => {
      service.terminarPeticion(service.iniciarPeticion());
      expect(service.cargando()).toBe(false);
      await otraTarea();

      service.iniciarPeticion();
      expect(service.cargando()).toBe(true);
    });

    it('una consulta nueva muestra el spinner aunque otra anterior siga en vuelo', async () => {
      const periodos = service.iniciarPeticion();
      await otraTarea();

      // Arrancan las tablas del reporte mientras la anterior sigue pendiente.
      const reporte = service.iniciarPeticion();
      service.iniciarPeticion();
      expect(service.cargando()).toBe(true);

      service.terminarPeticion(reporte);
      expect(service.cargando()).toBe(false);
      service.terminarPeticion(periodos);
      expect(service.estado().requestCount).toBe(1);
    });

    it('la respuesta de una consulta anterior no corta el spinner de la nueva', async () => {
      // Las opciones del siguiente nivel de la jerarquía siguen en vuelo...
      const jerarquia = service.iniciarPeticion();
      await otraTarea();
      // ...cuando arrancan los bloques del reporte.
      const bloque = service.iniciarPeticion();
      service.iniciarPeticion();

      service.terminarPeticion(jerarquia);
      expect(service.cargando()).toBe(true);

      service.terminarPeticion(bloque);
      expect(service.cargando()).toBe(false);
    });

    it('en una pantalla ya cargada, cambiar de pestaña o filtro no vuelve a mostrar el overlay', async () => {
      service.terminarPeticion(service.iniciarPeticion('/app/panel'));
      await otraTarea();

      // Otra pestaña de la misma pantalla: la carga la cuenta el esqueleto de su tabla.
      const pestana = service.iniciarPeticion('/app/panel');
      expect(service.cargando()).toBe(false);
      expect(service.estado().requestCount).toBe(1);
      service.terminarPeticion(pestana);
    });

    it('al entrar a otra pantalla el overlay vuelve para su primera carga', async () => {
      service.terminarPeticion(service.iniciarPeticion('/app/panel'));
      await otraTarea();

      const otra = service.iniciarPeticion('/app/reportes');
      expect(service.cargando()).toBe(true);
      service.terminarPeticion(otra);
      expect(service.cargando()).toBe(false);
    });

    it('si la primera carga no respondió, la pantalla sigue mostrando el overlay', async () => {
      service.iniciarPeticion('/app/panel');
      await otraTarea();
      service.iniciarPeticion('/app/panel');
      expect(service.cargando()).toBe(true);
    });

    it('un show() manual sigue bloqueando aunque las peticiones ya respondieran', () => {
      service.show('Guardando...');
      service.terminarPeticion(service.iniciarPeticion());
      expect(service.cargando()).toBe(true);
      expect(service.estado().message).toBe('Guardando...');

      service.hide();
      expect(service.cargando()).toBe(false);
    });
  });
});
