import { GRAFICOS_AGRICOLA, filasDeCultivo, totalesDeCultivo } from './cartera-agricola.model';

const CLIENTES = [
  { HDESCUL: 'ARROZ', HCAPMON: 400, HVENMON: 40, HEXTENS: 3 },
  { HDESCUL: 'ARROZ', HCAPMON: 100, HVENMON: 10, HEXTENS: 2 },
  { HDESCUL: 'CAFE', HCAPMON: 300, HVENMON: 0, HEXTENS: 9 },
];

describe('GRAFICOS_AGRICOLA', () => {
  it('pide los cuatro bloques en el orden en que el legado los pinta', () => {
    expect(GRAFICOS_AGRICOLA.map((g) => g.codRep)).toEqual(['RS_AGROMIX_03', 'RS_AGROMIX_02', 'RS_AGROMIX_04', 'RS_AGROMIX_05']);
  });

  it('solo los dos primeros abren detalle: son los únicos con `events.click` en el legado', () => {
    expect(GRAFICOS_AGRICOLA.map((g) => g.id)).toEqual(['saldoCartera', 'saldoVencido', undefined, undefined]);
  });
});

describe('filasDeCultivo', () => {
  it('se queda solo con las filas del cultivo elegido', () => {
    expect(filasDeCultivo(CLIENTES, 'ARROZ')).toHaveLength(2);
    expect(filasDeCultivo(CLIENTES, 'CAFE')).toHaveLength(1);
  });

  it('prefiere `HDESCUL_Agrupado` cuando el backend lo manda', () => {
    const filas = [{ HDESCUL: 'ARROZ', HDESCUL_Agrupado: 'GRANOS' }, { HDESCUL: 'CAFE' }];
    expect(filasDeCultivo(filas, 'GRANOS')).toEqual([filas[0]]);
    // Y la fila agrupada ya no responde a su cultivo original.
    expect(filasDeCultivo(filas, 'ARROZ')).toEqual([]);
  });
});

describe('totalesDeCultivo', () => {
  it('suma las tres columnas del cultivo y calcula el % vencido', () => {
    expect(totalesDeCultivo(filasDeCultivo(CLIENTES, 'ARROZ'))).toEqual({
      saldoCartera: 500,
      saldoVencido: 50,
      extension: 5,
      porcentajeVencido: 10,
    });
  });

  it('sin saldo de cartera el porcentaje queda en 0, no en NaN', () => {
    expect(totalesDeCultivo([{ HCAPMON: 0, HVENMON: 0, HEXTENS: 0 }]).porcentajeVencido).toBe(0);
  });

  it('un cultivo sin filas no rompe', () => {
    expect(totalesDeCultivo([])).toEqual({ saldoCartera: 0, saldoVencido: 0, extension: 0, porcentajeVencido: 0 });
  });
});
