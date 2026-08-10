import { asignarValores, marcarHabilitados, marcarVisibles, redondear, resolverSituacion, sumarPorIds } from './incentivos-calculo.util';

describe('marcarVisibles()', () => {
  it('marca show=true solo en los ids indicados', () => {
    const items = [
      { id: 'a', show: false },
      { id: 'b', show: true },
    ];
    expect(marcarVisibles(items, ['b'])).toEqual([
      { id: 'a', show: false },
      { id: 'b', show: true },
    ]);
    expect(marcarVisibles(items, ['a'])).toEqual([
      { id: 'a', show: true },
      { id: 'b', show: false },
    ]);
  });

  it('no muta el arreglo original', () => {
    const items = [{ id: 'a', show: false }];
    const resultado = marcarVisibles(items, ['a']);
    expect(items[0].show).toBe(false);
    expect(resultado[0].show).toBe(true);
  });
});

describe('marcarHabilitados()', () => {
  it('marca enab=true solo en los ids indicados', () => {
    const items = [
      { id: 'a', enab: false },
      { id: 'b', enab: false },
    ];
    expect(marcarHabilitados(items, ['a'])).toEqual([
      { id: 'a', enab: true },
      { id: 'b', enab: false },
    ]);
  });
});

describe('asignarValores()', () => {
  it('copia el valor de origen[prefijo+id+sufijo] al campo indicado', () => {
    const items = [{ id: 'car', val: 0 }];
    const origen = { flag_car: 42 };
    expect(asignarValores(items, origen, 'val', 'flag_', '')).toEqual([{ id: 'car', val: 42 }]);
  });

  it('deja el ítem sin cambios si la clave no existe en origen', () => {
    const items = [{ id: 'car', val: 0 }];
    expect(asignarValores(items, {}, 'val', 'flag_', '')).toEqual(items);
  });

  it('funciona con sufijo (no solo prefijo)', () => {
    const items = [{ id: 'car', per: 0 }];
    const origen = { car_avan_floor: 55 };
    expect(asignarValores(items, origen, 'per', '', '_avan_floor')).toEqual([{ id: 'car', per: 55 }]);
  });
});

describe('sumarPorIds()', () => {
  it('suma los valores numéricos de las claves armadas', () => {
    const origen = { bob_car: 10, bob_cli: 20, bob_otro: 5 };
    expect(sumarPorIds(origen, ['car', 'cli'], 'bob_', '')).toBe(30);
  });

  it('ignora claves ausentes o no numéricas', () => {
    const origen = { bob_car: 10, bob_cli: 'no-numero' };
    expect(sumarPorIds(origen, ['car', 'cli', 'ausente'], 'bob_', '')).toBe(10);
  });
});

describe('redondear()', () => {
  it('redondea a enteros por defecto', () => {
    expect(redondear(2.6)).toBe(3);
  });

  it('redondea a N decimales', () => {
    expect(redondear(0.12345, 2)).toBe(0.12);
  });
});

describe('resolverSituacion()', () => {
  it('flag_act=1 → Activado, código 1', () => {
    expect(resolverSituacion(1)).toEqual({ codigo: 1, descripcion: '(Activado)' });
  });

  it('flag_act=-1 → No Aplica, código 0', () => {
    expect(resolverSituacion(-1)).toEqual({ codigo: 0, descripcion: '(No Aplica)' });
  });

  it('cualquier otro valor (ej. 0) → Desactivado, código 0', () => {
    expect(resolverSituacion(0)).toEqual({ codigo: 0, descripcion: '(Desactivado)' });
  });
});
