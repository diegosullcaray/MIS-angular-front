import {
  CFG_GRUPAL_SECTORISTA,
  CFG_GRUPAL_UNIDAD,
  CFG_INDIVIDUAL_CORREDOR,
  CFG_INDIVIDUAL_SECTORISTA,
  CFG_INDIVIDUAL_UNIDAD,
  INDICE_SUPER_PLUS,
  crearAvancesDefault,
  crearCalculadoraPlusDefault,
  crearCalculadoraVariablesDefault,
  crearPerfilSemDefault,
  crearSuperPlusDefault,
  resolverConfiguracionUsuario,
} from './incentivos-config.util';

describe('resolverConfiguracionUsuario()', () => {
  it('tip_cod=1 (Sectorista): individual usa CFG_INDIVIDUAL_SECTORISTA, grupal usa CFG_GRUPAL_SECTORISTA', () => {
    expect(resolverConfiguracionUsuario(1, 1)).toBe(CFG_INDIVIDUAL_SECTORISTA);
    expect(resolverConfiguracionUsuario(1, 2)).toBe(CFG_GRUPAL_SECTORISTA);
  });

  it('tip_cod=18 (Unidad): individual usa CFG_INDIVIDUAL_UNIDAD, grupal usa CFG_GRUPAL_UNIDAD', () => {
    expect(resolverConfiguracionUsuario(18, 1)).toBe(CFG_INDIVIDUAL_UNIDAD);
    expect(resolverConfiguracionUsuario(18, 2)).toBe(CFG_GRUPAL_UNIDAD);
  });

  it('cualquier otro tip_cod (Corredor/Territorio/FC): individual usa CFG_INDIVIDUAL_CORREDOR, grupal cae a CFG_GRUPAL_UNIDAD', () => {
    expect(resolverConfiguracionUsuario(19, 1)).toBe(CFG_INDIVIDUAL_CORREDOR);
    expect(resolverConfiguracionUsuario(7, 2)).toBe(CFG_GRUPAL_UNIDAD);
  });
});

describe('fábricas de configuración por defecto', () => {
  it('crearPerfilSemDefault() arma 9 ítems, todos ocultos y en cero', () => {
    const sem = crearPerfilSemDefault();
    expect(sem).toHaveLength(9);
    expect(sem.every((s) => s.show === false && s.val === 0)).toBe(true);
    expect(sem.map((s) => s.id)).toContain('gru');
  });

  it('crearAvancesDefault() arma un ítem por variable, todos ocultos/deshabilitados', () => {
    const avances = crearAvancesDefault();
    expect(avances.every((a) => !a.show && !a.enab && a.per === 0)).toBe(true);
  });

  it('crearSuperPlusDefault() asigna los parámetros de detalle correctos por id', () => {
    const superPlus = crearSuperPlusDefault();
    const prod = superPlus.find((s) => s.id === 'prod');
    const clib = superPlus.find((s) => s.id === 'clib');
    const rop = superPlus.find((s) => s.id === 'rop');

    expect(prod?.parametros).toEqual({ comp: 1, req: 'getProd', card: true, typ: 'sp' });
    expect(clib?.parametros).toEqual({ comp: 2, req: 'getCliBanc', card: false });
    // Ítems sin drill-down real en el legado (rop/clim/rot/sis/tgru/areu) caen al parámetro por defecto.
    expect(rop?.parametros).toEqual({ comp: 1, req: 'getProd', card: false });
  });

  it('crearCalculadoraVariablesDefault() marca formato "percent" para pagop/efec* y "number" para el resto', () => {
    const vars = crearCalculadoraVariablesDefault();
    expect(vars.find((v) => v.id === 'pagop')?.formato).toBe('percent');
    expect(vars.find((v) => v.id === 'efec1')?.formato).toBe('percent');
    expect(vars.find((v) => v.id === 'car')?.formato).toBe('number');
  });

  it('crearCalculadoraPlusDefault() marca "ret" con suma=false (no participa en el total) y formato percent para ret/tas', () => {
    const plus = crearCalculadoraPlusDefault();
    expect(plus.find((p) => p.id === 'ret')?.suma).toBe(false);
    expect(plus.find((p) => p.id === 'prod')?.suma).toBe(true);
    expect(plus.find((p) => p.id === 'tas')?.formato).toBe('percent');
  });
});

describe('INDICE_SUPER_PLUS', () => {
  it('numera los ítems 1-based en el mismo orden fijo que superPlusConfig.data del legado', () => {
    expect(INDICE_SUPER_PLUS).toEqual({
      prod: 1, rop: 2, clim: 3, clib: 4, ret: 5, tas: 6, rot: 7, sis: 8, tgru: 9, areu: 10,
    });
  });
});
