import { TestBed } from '@angular/core/testing';
import { ConfiguracionDialogComponent } from './configuracion-dialog.component';
import { SECCIONES_CONFIGURACION } from './configuracion.model';

describe('ConfiguracionDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfiguracionDialogComponent] });
  });

  function crear(visible = true) {
    const fixture = TestBed.createComponent(ConfiguracionDialogComponent);
    fixture.componentRef.setInput('visible', visible);
    fixture.detectChanges();
    return fixture;
  }

  it('arranca en la primera sección y su primer item', () => {
    const componente = crear().componentInstance;

    expect(componente['seccion']().clave).toBe(SECCIONES_CONFIGURACION[0].clave);
    expect(componente['item']().clave).toBe(SECCIONES_CONFIGURACION[0].items[0].clave);
  });

  it('al cambiar de sección el detalle salta a su primer item, no queda en el de la sección anterior', () => {
    const componente = crear().componentInstance;
    const general = SECCIONES_CONFIGURACION.find((s) => s.clave === 'general')!;

    componente['elegirSeccion'](general);

    expect(componente['seccion']().clave).toBe('general');
    expect(componente['item']().clave).toBe(general.items[0].clave);
  });

  it('elegirItem() abre el item dentro de la sección abierta', () => {
    const componente = crear().componentInstance;
    const seguridad = SECCIONES_CONFIGURACION.find((s) => s.clave === 'seguridad')!;

    componente['elegirSeccion'](seguridad);
    componente['elegirItem'](seguridad.items[1]);

    expect(componente['item']().clave).toBe(seguridad.items[1].clave);
  });

  it('en mobile la navegación baja de nivel al elegir sección e item, y vuelve con volver()', () => {
    const componente = crear().componentInstance;

    expect(componente['nivelMovil']()).toBe(0);

    componente['elegirSeccion'](SECCIONES_CONFIGURACION[1]);
    expect(componente['nivelMovil']()).toBe(1);

    componente['elegirItem'](SECCIONES_CONFIGURACION[1].items[0]);
    expect(componente['nivelMovil']()).toBe(2);

    componente['volver']();
    expect(componente['nivelMovil']()).toBe(1);

    componente['volver']();
    componente['volver']();
    expect(componente['nivelMovil']()).toBe(0);
  });

  it('el buscador deja solo las secciones con alguna coincidencia', () => {
    const componente = crear().componentInstance;

    componente['filtro'].set('contraseña');

    expect(componente['seccionesVisibles']().map((s) => s.clave)).toEqual(['seguridad']);
  });

  // El término no aparece en ninguna etiqueta: la única forma de llegar a
  // "Preferencias" es que la descripción también entre en la búsqueda.
  it('el buscador mira también la descripción del item, no solo su etiqueta', () => {
    const componente = crear().componentInstance;

    componente['filtro'].set('entre sesiones');

    expect(componente['seccionesVisibles']().map((s) => s.clave)).toEqual(['general']);
  });

  it('el buscador ignora acentos y mayúsculas', () => {
    const componente = crear().componentInstance;

    componente['filtro'].set('AUTENTICACION');

    expect(componente['seccionesVisibles']().map((s) => s.clave)).toEqual(['seguridad']);
  });

  it('si la sección abierta coincide por nombre, se muestran todos sus items', () => {
    const componente = crear().componentInstance;
    const general = SECCIONES_CONFIGURACION.find((s) => s.clave === 'general')!;
    componente['elegirSeccion'](general);

    componente['filtro'].set('general');

    expect(componente['itemsVisibles']().length).toBe(general.items.length);
  });

  it('si solo coincide un item, la sección abierta muestra únicamente ese', () => {
    const componente = crear().componentInstance;
    const general = SECCIONES_CONFIGURACION.find((s) => s.clave === 'general')!;
    componente['elegirSeccion'](general);

    componente['filtro'].set('apariencia');

    expect(componente['itemsVisibles']().map((i) => i.clave)).toEqual(['apariencia']);
  });

  it('sin coincidencias no queda ninguna sección visible', () => {
    const componente = crear().componentInstance;

    componente['filtro'].set('zzzz');

    expect(componente['seccionesVisibles']()).toEqual([]);
  });

  it('cerrar() emite visibleChange(false) y deja el diálogo listo para la próxima apertura', () => {
    const componente = crear().componentInstance;
    let valor: boolean | undefined;
    componente.visibleChange.subscribe((v: boolean) => (valor = v));
    componente['elegirSeccion'](SECCIONES_CONFIGURACION[1]);
    componente['filtro'].set('apariencia');

    componente['cerrar']();

    expect(valor).toBe(false);
    expect(componente['nivelMovil']()).toBe(0);
    expect(componente['filtro']()).toBe('');
  });

  it('filtrar() toma el valor del input del buscador', () => {
    const componente = crear().componentInstance;
    const input = document.createElement('input');
    input.value = 'grupos';

    componente['filtrar']({ target: input } as unknown as Event);

    expect(componente['filtro']()).toBe('grupos');
    expect(componente['seccionesVisibles']().map((s) => s.clave)).toEqual(['contactos']);
  });
});
