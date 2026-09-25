import { describe, expect, it } from 'vitest';
import type { GraficoDashboardRevision } from '../constantes/cartera-mora.constantes';
import {
  graficoDashboardRevision,
  kpisCeroCuotas,
  mapaCalorDashboardRevision,
} from './cero-cuotas-mapeo.util';

describe('cero-cuotas-mapeo.util', () => {
  it('mantiene las columnas posicionales y convierte los saldos a millones', () => {
    const config: GraficoDashboardRevision = {
      titulo: 'Saldo',
      bloque: 0,
      enMillones: true,
      series: [{ nombre: 'Nuevo', columna: 3, color: '#000' }],
    };
    const grafico = graficoDashboardRevision(config, [
      { a: 'x', periodo: 'Sep', c: 0, saldo: '2500000' },
    ]);

    expect(grafico).toEqual({
      titulo: 'Saldo',
      categorias: ['Sep'],
      series: [{ nombre: 'Nuevo', datos: [2.5], color: '#000' }],
    });
  });

  it('descarta valores no numéricos para no dibujar cifras falsas', () => {
    const config: GraficoDashboardRevision = {
      titulo: 'Número',
      bloque: 0,
      series: [{ nombre: 'Total', columna: 2, color: '#000' }],
    };
    const grafico = graficoDashboardRevision(config, [
      { a: 'x', periodo: 'Sep', total: 'sin dato' },
    ]);

    expect(grafico.series[0].datos).toEqual([null]);
  });

  it('interpreta el JSON de un mapa de calor y conserva su orientación', () => {
    const mapa = mapaCalorDashboardRevision(
      {
        data: [
          {
            json: JSON.stringify({
              categories: ['2025', '2026'],
              series: [{ name: '1-8 días', data: [1, '2.5'] }],
            }),
          },
        ],
      },
      'Mapa',
      true,
    );

    expect(mapa).toEqual({
      titulo: 'Mapa',
      categoriasX: ['2025', '2026'],
      categoriasY: ['1-8 días'],
      valores: [[1, 2.5]],
      ejeYInvertido: true,
    });
  });

  it('devuelve null para payloads inválidos', () => {
    expect(mapaCalorDashboardRevision({ data: [{ json: 'no-json' }] }, 'Mapa', false)).toBeNull();
  });

  it('obtiene las cuatro KPI desde la primera fila del bloque de tarjetas', () => {
    const kpis = kpisCeroCuotas([
      { saldo_act: '5000000', saldo_ant: '4000000', dif_saldo: '1000000', men60_act: 1200000 },
    ]);

    expect(kpis).toHaveLength(4);
    expect(kpis[0]).toMatchObject({
      actual: 5000000,
      anterior: 4000000,
      variacion: 1000000,
      favorableCuandoBaja: false,
    });
    expect(kpis[2]).toMatchObject({ actual: 1200000, favorableCuandoBaja: true });
  });
});
