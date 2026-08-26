import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

const entero = { type: 'integer' } as const;

/** Color de fondo por grupo del legado (`carterizacion.util.ts` → `tblHeaders`). */
const FONDO_AHORROS = { background: '#79098F' };
const FONDO_DIGITAL = { background: '#CCC918' };

/**
 * Columnas de "Gestión Pasivo Comercial" (`RS_CARTEPAS_01`).
 *
 * Puerto de los `tblHeaders` del legado (`carterizacion.util.ts`): ese reporte
 * no toma las cabeceras del payload, las trae fijas del cliente, con el mismo
 * color plano por grupo que usa el legado.
 */
export const COLUMNAS_GESTION_PASIVO_COMERCIAL: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  {
    key: 'cartera-credito',
    label: 'Cartera Crédito',
    subs: [
      { key: 'CAP_4', label: 'Saldo Cartera', format: entero },
      { key: 'var_cap_anual', label: 'Variación Anual', format: entero },
      { key: 'var_cap_mes', label: 'Variación Mes', format: entero },
      { key: 'var_cap_dia', label: 'Variación Día', format: entero },
      { key: 'des_mes', label: 'Desembolsos Mes', format: entero },
      { key: 'des_dia', label: 'Desembolsos Día', format: entero },
    ],
  },
  {
    key: 'pasivos-ahorros',
    label: 'Pasivos - Ahorros',
    style: FONDO_AHORROS,
    subs: [
      { key: 'saldo_ahorro_hoy', label: 'Saldo', format: entero, style: FONDO_AHORROS },
      { key: 'Var_Ahorro_Anual', label: 'Variación Anual', format: entero, style: FONDO_AHORROS },
      { key: 'Var_Ahorro_Mes', label: 'Variación Mes', format: entero, style: FONDO_AHORROS },
      { key: 'Var_Ahorro_Dia', label: 'Variación Día', format: entero, style: FONDO_AHORROS },
      { key: 'hsaldmedio', label: 'Saldo Medio', format: entero, style: FONDO_AHORROS },
      { key: 'Var_Saldo_Medio_Mes', label: 'Var. Saldo Medio', format: entero, style: FONDO_AHORROS },
      { key: 'sahorrodesemb', label: 'Saldo Ahorro Cuentas Desembolsadas', format: entero, style: FONDO_AHORROS },
    ],
  },
  {
    key: 'ecosistema-digital',
    label: 'Ecosistema Digital',
    style: FONDO_DIGITAL,
    subs: [
      { key: 'num_cli', label: 'N° Clientes Créditos', format: entero, style: FONDO_DIGITAL },
      { key: 'HTIPNUMDOC', label: 'N° Enrolados', format: entero, style: FONDO_DIGITAL },
      { key: 'N_Enrolados_Activos', label: 'N° Enrolados Activos', format: entero, style: FONDO_DIGITAL },
      { key: 'N_Pago_Creditos_App', label: 'N° Pago Créditos App', format: entero, style: FONDO_DIGITAL },
      { key: 'N_Operaciones_QR', label: 'N° Operaciones QR', format: entero, style: FONDO_DIGITAL },
      { key: 'N_Operaciones_Plin_Contacto', label: 'N° Operaciones (Plin + Envío a Contactos)', format: entero, style: FONDO_DIGITAL },
    ],
  },
];
