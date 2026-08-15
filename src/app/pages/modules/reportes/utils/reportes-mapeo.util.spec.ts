import { filtrarFilas, mapearBloquesGrafico } from './reportes-mapeo.util';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

describe('filtrarFilas()', () => {
  const filas = [
    { nombre: 'Juan Pérez', dni: '12345678' },
    { nombre: 'María López', dni: '87654321' },
  ];

  it('devuelve todas las filas si el texto está vacío', () => {
    expect(filtrarFilas(filas, '')).toEqual(filas);
    expect(filtrarFilas(filas, '   ')).toEqual(filas);
  });

  it('filtra por coincidencia parcial en cualquier columna, insensible a mayúsculas', () => {
    expect(filtrarFilas(filas, 'juan')).toEqual([filas[0]]);
    expect(filtrarFilas(filas, '8765')).toEqual([filas[1]]);
  });

  it('devuelve un array vacío si no hay coincidencias', () => {
    expect(filtrarFilas(filas, 'inexistente')).toEqual([]);
  });
});

describe('mapearBloquesGrafico()', () => {
  it('mapea cada elemento de `result` a un BloqueGrafico, con los nombres de campo del legado', () => {
    const respuesta: IWinderResponse = {
      code: '0',
      headers: {},
      body: {
        result: [
          {
            graphName: 'Inversión',
            graphSubName: 'Últimos 12 meses',
            categories: [{ columnDef: ['Ene', 'Feb', 'Mar'] }],
            series: [
              { name: 'Real', data: [10, 20, 30], color: '#0191CE' },
              { name: 'Meta', data: [15, 15, 15] },
            ],
            getUnitGraph: 'S/.',
          },
        ],
      },
    };

    expect(mapearBloquesGrafico(respuesta)).toEqual([
      {
        titulo: 'Inversión',
        subtitulo: 'Últimos 12 meses',
        categorias: ['Ene', 'Feb', 'Mar'],
        series: [
          { nombre: 'Real', datos: [10, 20, 30], color: '#0191CE' },
          { nombre: 'Meta', datos: [15, 15, 15], color: undefined },
        ],
        tituloEjeY: 'S/.',
      },
    ]);
  });

  it('devuelve un array vacío si `result` viene vacío o ausente', () => {
    expect(mapearBloquesGrafico({ code: '0', headers: {}, body: { result: [] } })).toEqual([]);
    expect(mapearBloquesGrafico({ code: '0', headers: {}, body: {} })).toEqual([]);
    expect(mapearBloquesGrafico({ code: '0', headers: {}, body: null })).toEqual([]);
  });
});
