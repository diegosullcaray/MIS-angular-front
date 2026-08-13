export interface OpcionTipoMonRep {
  id: 1 | 2;
  desc: string;
}

export const OPCIONES_TIPO_MON_REP: OpcionTipoMonRep[] = [
  { id: 1, desc: 'Operaciones' },
  { id: 2, desc: 'Saldo' },
];
