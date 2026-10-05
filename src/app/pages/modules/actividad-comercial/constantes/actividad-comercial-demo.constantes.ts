import type { TableroAsesor } from '../models/actividad-comercial.model';

/** Datos de EJEMPLO del tablero. Se reemplazan por la consulta real cuando el backend esté definido. */
export const TABLERO_DEMO: TableroAsesor = {
  asesor: 'Yactayo Luque Magali Mariet',
  periodo: 'Setiembre 2026',
  corte: '29/09/2026',
  desempeno: {
    iniciales: 'MY',
    nombre: 'Magali Mariet Yactayo Luque',
    cargo: 'Asesora de negocios',
    score: 77,
    calificacion: 'B+',
    ejes: [
      { etiqueta: 'Comercial', asesor: 85, promedio: 70 },
      { etiqueta: 'Misional', asesor: 70, promedio: 75 },
      { etiqueta: 'Digital', asesor: 92, promedio: 65 },
      { etiqueta: 'Riesgo SF', asesor: 60, promedio: 72 },
      { etiqueta: 'Calidad', asesor: 78, promedio: 68 },
    ],
  },
  desembolsos: {
    operaciones: { etiqueta: 'Operaciones', valor: 8, meta: 15, formato: 'entero', etiquetaValor: '8 ops' },
    monto: { etiqueta: 'Monto', valor: 95620, meta: 225000, formato: 'entero' },
    avanceEsperado: 80,
    etiquetaAvanceEsperado: 'Días hábiles (80%)',
    kpis: [
      { etiqueta: 'Ticket Promedio', valor: 11950, formato: 'entero' },
      { etiqueta: 'TAPP Mes', valor: 48.63, formato: 'porcentaje' },
      { etiqueta: 'TAPP Mínima', valor: 55.76, formato: 'porcentaje' },
    ],
  },
  mora: {
    recuperaciones: [
      { titulo: 'Monto recuperado', recuperado: 184650, total: 240000, formato: 'entero' },
      { titulo: 'Operaciones recuperadas', recuperado: 28, total: 40, formato: 'entero' },
    ],
    efectividades: [
      { etiqueta: 'Efectividad −30 a 0 días', valor: 95.94, meta: 95, formato: 'porcentaje' },
      { etiqueta: 'Efectividad 1 a 30 días', valor: 62.5, meta: 75, formato: 'porcentaje' },
    ],
    kpis: [
      { etiqueta: 'Clientes en mora', valor: 5, formato: 'entero', delta: '+4', tono: 'negativo' },
      { etiqueta: 'Saldo en mora', valor: 166696, formato: 'entero', delta: '+23,698', tono: 'negativo' },
      { etiqueta: 'Ingresos a mora', valor: 7, formato: 'operaciones', apoyo: '48,320' },
    ],
  },
  seguros: {
    ingresos: { etiqueta: 'Ingresos (PEN)', valor: 12450, meta: 15000, formato: 'entero' },
    polizas: { etiqueta: 'Pólizas Totales', valor: 42, meta: 50, formato: 'entero' },
    tipos: [
      { nombre: 'Multiriesgo', polizas: 16, color: 'var(--mis-primary)' },
      { nombre: 'Prot. Cuota', polizas: 10, color: 'var(--mis-success)' },
      { nombre: 'Vida Segura', polizas: 8, color: 'var(--mis-warning)' },
      { nombre: 'Oncológico', polizas: 4, color: 'var(--mis-brand-magenta)' },
      { nombre: 'Agropecuario', polizas: 3, color: 'var(--mis-brand-sky)' },
      { nombre: 'Prot. Total', polizas: 1, color: 'var(--mis-danger)' },
    ],
    kpis: [
      { etiqueta: 'Penetración', valor: 87.5, formato: 'porcentaje' },
      { etiqueta: 'Sin Venta', valor: 3, formato: 'asesores', alerta: true },
      { etiqueta: 'Ticket Prima', valor: 173, formato: 'entero' },
    ],
  },
  cartera: {
    saldo: {
      titulo: 'Saldo vigente',
      formato: 'entero',
      paleta: 'saldo',
      hoy: [
        { clave: 'trasladada', etiqueta: 'Trasladada', valor: 325474 },
        { clave: 'propia', etiqueta: 'Propia', valor: 2115583 },
        { clave: 'heredada', etiqueta: 'Heredada', valor: 1139160 },
      ],
      totalHoy: 2441057,
      cierreAnterior: 3528967,
      meta: 4100000,
    },
    operaciones: {
      titulo: 'Operaciones',
      formato: 'entero',
      paleta: 'operaciones',
      hoy: [
        { clave: 'trasladada', etiqueta: 'Trasladada', valor: 16 },
        { clave: 'propia', etiqueta: 'Propia', valor: 108 },
        { clave: 'heredada', etiqueta: 'Heredada', valor: 46 },
      ],
      totalHoy: 124,
      cierreAnterior: 146,
    },
    kpis: [
      { etiqueta: 'Saldo promedio', valor: 19686, formato: 'entero', delta: '−4,485', tono: 'negativo' },
      { etiqueta: 'TAPP stock', valor: 23.32, formato: 'porcentaje', delta: '+23 pbs', tono: 'positivo' },
      { etiqueta: 'Concentración', valor: 28.4, formato: 'porcentaje', apoyo: 'Top 10' },
    ],
  },
  clientes: {
    hoy: 143,
    cierreAnterior: 142,
    movimientos: [
      { etiqueta: 'Altas', valor: 2 },
      { etiqueta: 'Bajas', valor: -1 },
      { etiqueta: 'Heredados', valor: -1 },
      { etiqueta: 'Trasladados', valor: 1 },
    ],
    crecimientoNeto: 1,
    metaVariacion: 18,
    kpis: [
      { etiqueta: 'Nuevos', valor: 2, formato: 'entero', apoyo: '0' },
      { etiqueta: 'Bancarizados', valor: 13, formato: 'entero', delta: '+4', tono: 'positivo' },
      { etiqueta: 'Retención', valor: 99.3, formato: 'porcentaje', delta: '−0.7 pp', tono: 'negativo' },
    ],
  },
};
