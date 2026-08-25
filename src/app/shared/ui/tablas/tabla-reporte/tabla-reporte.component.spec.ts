import { TestBed } from '@angular/core/testing';
import { TablaReporteComponent } from './tabla-reporte.component';
import type { FilaEncabezadoReporte, FilaReporte } from '../models/tabla-reporte.model';

const ENCABEZADOS: FilaEncabezadoReporte[] = [
  {
    columns: [
      { columnDef: 'nom', header: 'Nombre', isdata: 1 },
      { columnDef: 'monto', header: 'Monto', isdata: 2, format: { type: 'number' } },
      { columnDef: 'avance', header: 'Avance', isdata: 3, format: { type: 'percent' } },
      { columnDef: 'estado', header: 'Estado', isdata: 4, format: { type: 'traffic-light' } },
    ],
  },
];

const FILAS: FilaReporte[] = [{ nom: 'Agencia 1', monto: 1500.5, avance: 0.85, estado: 1 }];

describe('TablaReporteComponent', () => {
  function crear(encabezados: FilaEncabezadoReporte[] = ENCABEZADOS, filas: FilaReporte[] = FILAS, cargando = false) {
    TestBed.configureTestingModule({ imports: [TablaReporteComponent] });
    const fixture = TestBed.createComponent(TablaReporteComponent);
    fixture.componentRef.setInput('encabezados', encabezados);
    fixture.componentRef.setInput('filas', filas);
    fixture.componentRef.setInput('cargando', cargando);
    fixture.detectChanges();
    return fixture;
  }

  it('columnasDato() extrae solo las columnas con isdata, ordenadas', () => {
    const fixture = crear([
      {
        columns: [
          { columnDef: 'b', header: 'B', isdata: 2 },
          { columnDef: 'grupo', header: 'Grupo' }, // celda de agrupación, sin isdata
          { columnDef: 'a', header: 'A', isdata: 1 },
        ],
      },
    ]);

    expect(fixture.componentInstance['columnasDato']().map((c) => c.columnDef)).toEqual(['a', 'b']);
  });

  it('formatear() aplica number/percent según el formato de la columna', () => {
    const fixture = crear();
    const columnaNumero = ENCABEZADOS[0].columns[1];
    const columnaPorcentaje = ENCABEZADOS[0].columns[2];

    expect(fixture.componentInstance['formatear'](1500.5, columnaNumero)).toBe('1,500.5');
    expect(fixture.componentInstance['formatear'](0.85, columnaPorcentaje)).toBe('85.0%');
  });

  it('formatear() devuelve cadena vacía para valores nulos/indefinidos', () => {
    const fixture = crear();
    expect(fixture.componentInstance['formatear'](null, ENCABEZADOS[0].columns[0])).toBe('');
    expect(fixture.componentInstance['formatear'](undefined, ENCABEZADOS[0].columns[0])).toBe('');
  });

  it('esSemaforo() distingue columnas traffic-light de las demás', () => {
    const fixture = crear();
    expect(fixture.componentInstance['esSemaforo'](ENCABEZADOS[0].columns[3])).toBe(true);
    expect(fixture.componentInstance['esSemaforo'](ENCABEZADOS[0].columns[0])).toBe(false);
  });

  it('colorSemaforo() mapea 1/0/-1/otro a éxito/alerta/peligro/neutro', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorSemaforo'](1)).toContain('success');
    // El naranja de alerta es `orange-500` (icono más chico), no `--mis-warning`
    // (ámbar oscuro para texto/badges) — a ese tamaño se confundía con el rojo.
    expect(fixture.componentInstance['colorSemaforo'](0)).toBe('text-orange-500');
    expect(fixture.componentInstance['colorSemaforo'](-1)).toContain('danger');
    expect(fixture.componentInstance['colorSemaforo'](2)).toContain('text-tertiary');
  });

  it('colorSemaforo() acepta el valor como string — el backend lo manda así ("1"/"0"/"-1")', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorSemaforo']('1')).toContain('success');
    expect(fixture.componentInstance['colorSemaforo']('0')).toBe('text-orange-500');
    expect(fixture.componentInstance['colorSemaforo']('-1')).toContain('danger');
  });

  it('colorSemaforo() no confunde null/undefined con "0" (alerta) — quedan neutros', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorSemaforo'](null)).toContain('text-tertiary');
    expect(fixture.componentInstance['colorSemaforo'](undefined)).toContain('text-tertiary');
  });

  it('mostrarSemaforo() es false si la columna no es semáforo, o si el backend nunca mandó valor', () => {
    // Regresión: "TAM" en DESEMP_SOC_01 declara la columna de semáforo pero el
    // backend no manda valor en ninguna fila — no debe pintar un punto gris
    // "sin significado" para todas las filas, mejor dejar la celda vacía.
    const fixture = crear();
    const columnaSemaforo = ENCABEZADOS[0].columns[3];
    const columnaNumero = ENCABEZADOS[0].columns[1];

    expect(fixture.componentInstance['mostrarSemaforo']({ estado: 1 }, columnaSemaforo)).toBe(true);
    expect(fixture.componentInstance['mostrarSemaforo']({ estado: undefined }, columnaSemaforo)).toBe(false);
    expect(fixture.componentInstance['mostrarSemaforo']({}, columnaSemaforo)).toBe(false);
    expect(fixture.componentInstance['mostrarSemaforo']({ monto: 100 }, columnaNumero)).toBe(false);
  });

  it('la tabla renderiza el valor de cada columna de datos', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Agencia 1');
    expect(texto).toContain('1,500.5');
    expect(texto).toContain('85.0%');
  });

  it('filasEncabezado() excluye las columnas hidden, sin correr el resto de columnas', () => {
    // Caso real de "Monitor Metas Desembolso" (Monitor_Dese_01): "Fecha" declara
    // cols:2 para cubrir tanto la fecha como "fecha_nombre" (el día, ej. "Sábado"),
    // que va hidden porque no necesita su propio <th> — solo su dato en el cuerpo.
    const fixture = crear([
      {
        columns: [
          { columnDef: 'dia_habil', header: 'Día', rows: 2, isdata: 1 },
          { columnDef: 'Fecha', header: 'Fecha', cols: 2, rows: 2, isdata: 2 },
          { columnDef: 'fecha_nombre', header: 'fecha_nombre', isdata: 3, hidden: true },
          { columnDef: 'Diario', header: 'Diario', cols: 3 },
        ],
      },
      {
        columns: [
          { columnDef: 'ope', header: 'Operaciones', isdata: 4 },
          { columnDef: 'meta', header: 'Meta', isdata: 5 },
          { columnDef: 'cumpl', header: '%Cumplimiento', isdata: 6 },
        ],
      },
    ]);

    const filas = fixture.componentInstance['filasEncabezado']();
    expect(filas[0].map((c) => c.columnDef)).toEqual(['dia_habil', 'Fecha', 'Diario']);
    expect(filas[1].map((c) => c.columnDef)).toEqual(['ope', 'meta', 'cumpl']);
  });

  it('columnasDato() sigue incluyendo el dato de una columna hidden — solo se oculta su <th>, no su <td>', () => {
    const fixture = crear([
      {
        columns: [
          { columnDef: 'Fecha', header: 'Fecha', cols: 2, isdata: 1 },
          { columnDef: 'fecha_nombre', header: 'fecha_nombre', isdata: 2, hidden: true },
        ],
      },
    ]);

    const columnas = fixture.componentInstance['columnasDato']().map((c) => c.columnDef);
    expect(columnas).toEqual(['Fecha', 'fecha_nombre']);
  });

  it('alineacion() alinea number/percent a la derecha, texto a la izquierda, semáforos al centro', () => {
    const fixture = crear();
    expect(fixture.componentInstance['alineacion']({ columnDef: 'monto', header: 'Monto', format: { type: 'number' } })).toBe(
      'text-right',
    );
    expect(fixture.componentInstance['alineacion']({ columnDef: 'avance', header: 'Avance', format: { type: 'percent' } })).toBe(
      'text-right',
    );
    // Columna de texto libre (ej. "DESVAL"/"Variable..." de Desempeño Social) — no debe
    // alinearse a la derecha solo por no tener "fecha" en el nombre.
    expect(fixture.componentInstance['alineacion']({ columnDef: 'DESVAL', header: 'Variable', format: { type: 'string' } })).toBe(
      'text-left',
    );
    // El semáforo además va estrecho (`w-8 px-1`) — ver "la columna de semáforo queda estrecha y centrada".
    expect(fixture.componentInstance['alineacion']({ columnDef: 'estado', header: 'Estado', format: { type: 'traffic-light' } })).toContain(
      'text-center',
    );
  });

  it('filasEncabezado() ensancha el colspan de una columna visible que no cubrió a su semáforo oculto', () => {
    // Caso real de "Desempeño Social" (DESEMP_SOC_01): "META" declara cols:1 aunque
    // tiene un semáforo oculto detrás (a diferencia de "TMM", que sí declara cols:2
    // para cubrir el suyo) — sin este ajuste, "TMM"/"TAM" quedan una columna
    // desplazadas respecto a su dato real.
    const fixture = crear([
      {
        columns: [
          { columnDef: 'meta', header: 'META', cols: 1, isdata: 1, format: { type: 'number' } },
          { columnDef: 'meta_sem', isdata: 2, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: 'tmm', header: 'TMM', cols: 2, isdata: 3, format: { type: 'number' } },
          { columnDef: 'tmm_sem', isdata: 4, hidden: true, format: { type: 'traffic-light' } },
        ],
      },
    ]);

    const [meta, tmm] = fixture.componentInstance['filasEncabezado']()[0];
    expect(meta.cols).toBe(2); // ensanchado: 1 declarado, pero tenía 1 oculta detrás
    expect(tmm.cols).toBe(2); // sin cambios: ya declaraba correctamente su oculta
  });

  it('filasEncabezado() deja que la columna SIGUIENTE cubra hacia atrás un semáforo oculto cuando ya declaró ancho suficiente', () => {
    // Caso real de "Clientes Producto" (cliente_producto_sec_01): el semáforo
    // oculto de "clientes" (Número de Clientes a Hoy) va justo antes de
    // "var_clientes" (Variación), que declara cols:2 — el punto debe quedar
    // agrupado bajo "Variación", no ensanchar "clientes" (que no declaró nada).
    const fixture = crear([
      {
        columns: [
          { columnDef: 'descripcion', header: 'Productos', isdata: 1, format: { type: 'string' } },
          { columnDef: 'clientes', header: 'Número de Clientes a Hoy', isdata: 2, format: { type: 'number' } },
          { columnDef: 'sem_clientes', isdata: 3, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: 'var_clientes', header: 'Variación', cols: 2, isdata: 4, format: { type: 'number' } },
        ],
      },
    ]);

    const [descripcion, clientes, variacion] = fixture.componentInstance['filasEncabezado']()[0];
    expect(descripcion.cols ?? 1).toBe(1);
    expect(clientes.cols ?? 1).toBe(1); // no ensanchado: la siguiente ("Variación") ya cubre el semáforo
    expect(variacion.cols).toBe(2); // sin cambios: ya declaraba correctamente el semáforo que la precede
  });

  it('claseFila() resalta en negrita las filas de categoría/subtotal (style === 1)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseFila']({ style: 1 })).toContain('font-bold');
    expect(fixture.componentInstance['claseFila']({ style: 0 })).toBe('');
    expect(fixture.componentInstance['claseFila']({})).toBe('');
  });

  it('onClickFila() solo emite filaSeleccionada cuando seleccionable() es true', () => {
    const fixture = crear();
    const emitidas: FilaReporte[] = [];
    fixture.componentInstance.filaSeleccionada.subscribe((f) => emitidas.push(f));

    fixture.componentInstance['onClickFila'](FILAS[0]);
    expect(emitidas).toEqual([]);

    fixture.componentRef.setInput('seleccionable', true);
    fixture.detectChanges();
    fixture.componentInstance['onClickFila'](FILAS[0]);
    expect(emitidas).toEqual([FILAS[0]]);
  });

  it('un click en la fila del cuerpo dispara filaSeleccionada solo si seleccionable=true', () => {
    const fixture = crear(ENCABEZADOS, FILAS, false);
    fixture.componentRef.setInput('seleccionable', true);
    fixture.detectChanges();

    const emitidas: FilaReporte[] = [];
    fixture.componentInstance.filaSeleccionada.subscribe((f) => emitidas.push(f));

    const filaDom = (fixture.nativeElement as HTMLElement).querySelector('tbody tr') as HTMLElement;
    filaDom.click();

    expect(emitidas).toEqual([FILAS[0]]);
  });

  // ─── Estilos: encabezado vs. cuerpo ──────────────────────────────────────
  // El `style` de una columna es del ENCABEZADO (legado: `'background-color':
  // c.style?.background` en el `<th>`). Volcarlo sobre las celdas de datos
  // pintaba columnas enteras y tapaba los números.

  it('el color de la columna pinta el encabezado, nunca las celdas de datos', () => {
    const fixture = crear(
      [
        {
          columns: [
            { columnDef: 'nom', header: 'Nombre', isdata: 1, style: { background: '#1B7A3D' } },
            { columnDef: 'monto', header: 'Monto', isdata: 2, format: { type: 'number' } },
          ],
        },
      ],
      [{ nom: 'Agencia 1', monto: 1500 }],
    );

    const th = (fixture.nativeElement as HTMLElement).querySelector('thead th') as HTMLElement;
    expect(th.style.backgroundColor).toBe('rgb(27, 122, 61)');

    // Ninguna celda del cuerpo hereda ese color.
    for (const td of Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody td'))) {
      expect((td as HTMLElement).style.background).toBe('');
    }
  });

  it('sin color del backend, el encabezado usa el azul del tema', () => {
    const fixture = crear();
    const th = (fixture.nativeElement as HTMLElement).querySelector('thead th') as HTMLElement;
    expect(th.style.backgroundColor).toBe('var(--mis-primary)');
  });

  it('el fondo de una celda del cuerpo viene por fila (background_<columnDef>), no por columna', () => {
    const fixture = crear(ENCABEZADOS, [{ ...FILAS[0], background_monto: '#FDE68A' }]);

    const celdas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody td')) as HTMLElement[];
    expect(celdas[1].style.background).toBe('rgb(253, 230, 138)');
    expect(celdas[0].style.background).toBe('');
  });

  it('style_<columnDef> tiñe el texto de una celda suelta según el signo', () => {
    const fixture = crear(ENCABEZADOS, [FILAS[0]]);
    const instancia = fixture.componentInstance;
    const columnaMonto = instancia['columnasDato']()[1];

    expect(instancia['claseTextoCelda']({ style_monto: 1 }, columnaMonto)).toContain('--mis-success');
    expect(instancia['claseTextoCelda']({ style_monto: -1 }, columnaMonto)).toContain('--mis-danger');
    expect(instancia['claseTextoCelda']({ style_monto: 0 }, columnaMonto)).toContain('orange');
    expect(instancia['claseTextoCelda']({}, columnaMonto)).toBe('');
  });

  it('la columna de semáforo queda estrecha y centrada', () => {
    const fixture = crear();
    const columnaEstado = fixture.componentInstance['columnasDato']()[3];
    expect(fixture.componentInstance['alineacion'](columnaEstado)).toContain('text-center');
    expect(fixture.componentInstance['alineacion'](columnaEstado)).toContain('w-8');
  });

  // Estos `computed` se evalúan dentro de la detección de cambios: si tiran una
  // excepción no se rompe solo la tabla, se aborta el ciclo entero y la app
  // queda congelada con el spinner global tapando la pantalla. Una fila de
  // encabezado rara tiene que degradar, no colgar.
  describe('encabezados malformados del backend', () => {
    it('no revienta si una fila viene sin `columns`', () => {
      const encabezadosRotos = [{ columnDef: 'nom', header: 'Nombre' }] as unknown as FilaEncabezadoReporte[];

      expect(() => crear(encabezadosRotos, FILAS)).not.toThrow();
    });

    it('no revienta si una fila trae huecos entre sus columnas', () => {
      const conHuecos = [
        { columns: [null, { columnDef: 'nom', header: 'Nombre', isdata: 1 }, undefined] },
      ] as unknown as FilaEncabezadoReporte[];

      const fixture = crear(conHuecos, FILAS);

      // La columna sana sobrevive; los huecos simplemente se ignoran.
      expect(fixture.componentInstance['columnasDato']().map((c) => c.columnDef)).toEqual(['nom']);
    });
  });
});
