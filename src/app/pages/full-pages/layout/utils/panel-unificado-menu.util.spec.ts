import { ACCESO_PANEL_UNIFICADO, conPanelUnificado } from './panel-unificado-menu.util';

describe('conPanelUnificado', () => {
  it('agrega el acceso al inicio de la carpeta Analista, también anidada', () => {
    const origen = [{ etiqueta: 'Comercial', hijos: [{ etiqueta: ' Analista ', hijos: [{ etiqueta: 'Cartera', ruta: '/x' }] }] }];
    expect(conPanelUnificado(origen)).toEqual([
      {
        etiqueta: 'Comercial',
        hijos: [{ etiqueta: ' Analista ', hijos: [{ ...ACCESO_PANEL_UNIFICADO }, { etiqueta: 'Cartera', ruta: '/x' }] }],
      },
    ]);
  });

  it('no duplica el acceso ni toca otras carpetas', () => {
    const conAcceso = [{ etiqueta: 'Analista', hijos: [{ ...ACCESO_PANEL_UNIFICADO }] }];
    expect(conPanelUnificado(conAcceso)[0].hijos).toHaveLength(1);
    expect(conPanelUnificado([])).toEqual([]);
    expect(conPanelUnificado([{ etiqueta: 'Cartera', hijos: [] }])[0].hijos).toEqual([]);
  });
});
