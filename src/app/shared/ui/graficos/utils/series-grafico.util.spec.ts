import { seriesDeGraficoConColor } from './series-grafico.util';
import { AZUL, MAGENTA, NAVY, colorSerieReporte } from './paleta-colores.util';

/**
 * La corrección de la incidencia de Agro: Actividad Diaria pintaba sus gráficos
 * con la paleta de respaldo del factory —los colores del sistema viejo— porque
 * su mapeo no asignaba ninguno. Ahora los dos reportes comparten esta función,
 * así que el color deja de depender de por dónde venga el bloque.
 */
describe('seriesDeGraficoConColor', () => {
  it('sin payload devuelve un bloque vacío', () => {
    expect(seriesDeGraficoConColor(undefined)).toEqual({ categorias: [], series: [] });
  });

  it('un payload roto es un gráfico vacío, no una excepción', () => {
    expect(seriesDeGraficoConColor('{no es json')).toEqual({ categorias: [], series: [] });
  });

  it('lee categorías y series del JSON del legado', () => {
    const bloque = seriesDeGraficoConColor(
      JSON.stringify({ categories: ['Ene', 'Feb'], series: [{ name: 'Saldo', data: [1, 2] }] }),
    );

    expect(bloque.categorias).toEqual(['Ene', 'Feb']);
    expect(bloque.series[0].nombre).toBe('Saldo');
    expect(bloque.series[0].datos).toEqual([1, 2]);
  });

  // Esto es lo que faltaba en la versión diaria: sin color, manda el respaldo.
  it('toda serie sale con color de la paleta corporativa', () => {
    const bloque = seriesDeGraficoConColor(
      JSON.stringify({
        categories: ['Ene'],
        series: [
          { name: 'Saldo', data: [1] },
          { name: 'Saldo Vencido', data: [2] },
        ],
      }),
    );

    expect(bloque.series.map((s) => s.color)).toEqual([NAVY, MAGENTA]);
  });

  it('con una sola serie el color no distingue nada: va el azul de marca', () => {
    const bloque = seriesDeGraficoConColor(JSON.stringify({ series: [{ name: 'Saldo', data: [1] }] }));

    expect(bloque.series[0].color).toBe(AZUL);
  });

  it('el color sale de `colorSerieReporte`, no de una tabla propia', () => {
    const bloque = seriesDeGraficoConColor(
      JSON.stringify({ series: [{ name: 'Participación %', data: [1] }, { name: 'Otro', data: [2] }] }),
    );

    expect(bloque.series[0].color).toBe(colorSerieReporte('Participación %', false));
  });

  it('tolera series sin nombre ni datos', () => {
    const bloque = seriesDeGraficoConColor(JSON.stringify({ series: [{}] }));

    expect(bloque.series[0]).toEqual({ nombre: '', datos: [], color: AZUL });
  });
});
