import type { ColumnasCartera } from '../models/actividad-comercial.model';
import {
  aclarar,
  avanceVariacion,
  datosColumnasCartera,
  faltanteMeta,
  formatearAvance,
  formatearDelta,
  formatearEntero,
  formatearValor,
  formatearVariacion,
  porcentaje,
} from './actividad-comercial.util';

const SALDO: ColumnasCartera = {
  titulo: 'Saldo vigente',
  formato: 'entero',
  paleta: 'saldo',
  hoy: [
    { clave: 'trasladada', etiqueta: 'Trasladada', valor: 1139160 },
    { clave: 'propia', etiqueta: 'Propia', valor: 2115583 },
    { clave: 'heredada', etiqueta: 'Heredada', valor: 325474 },
  ],
  totalHoy: 2441057,
  cierreAnterior: 3528967,
  meta: 4100000,
};

const OPERACIONES: ColumnasCartera = { ...SALDO, titulo: 'Operaciones', paleta: 'operaciones', meta: undefined };

describe('actividad-comercial.util', () => {
  describe('porcentaje', () => {
    it('acota a 0–100 y tolera totales no válidos', () => {
      expect(porcentaje(8, 15)).toBeCloseTo(53.33, 2);
      expect(porcentaje(30, 15)).toBe(100);
      expect(porcentaje(-5, 15)).toBe(0);
      expect(porcentaje(5, 0)).toBe(0);
      expect(porcentaje(Number.NaN, 10)).toBe(0);
    });
  });

  describe('formato', () => {
    it('separa miles y respeta cada formato', () => {
      expect(formatearEntero(184650)).toBe('184,650');
      expect(formatearValor(76.944, 'porcentaje')).toBe('76.94%');
      expect(formatearValor(1.74, 'decimal')).toBe('1.7');
      expect(formatearValor(7, 'operaciones')).toBe('7 ops');
      expect(formatearValor(3, 'asesores')).toBe('3 ases.');
    });

    it('un dato inexistente se muestra como — y nunca como 0', () => {
      expect(formatearValor(null, 'entero')).toBe('—');
      expect(formatearValor(null, 'porcentaje')).toBe('—');
      expect(formatearValor(0, 'entero')).toBe('0');
    });

    it('usa el signo menos tipográfico en las variaciones y deja el cero sin signo', () => {
      expect(formatearDelta(2)).toBe('+2');
      expect(formatearDelta(-4485)).toBe('−4,485');
      expect(formatearDelta(0)).toBe('0');
      expect(formatearVariacion(3.186, 'pp')).toBe('+3.19 pp');
      expect(formatearVariacion(-0.7, 'pp')).toBe('−0.70 pp');
      expect(formatearVariacion(0, 'pp')).toBe('0.00 pp');
    });
  });

  describe('datosColumnasCartera', () => {
    it('apila los tramos de hoy y pone el cierre anterior en la serie propia', () => {
      const d = datosColumnasCartera(SALDO, '#0A4681');

      expect(d.categorias).toEqual(['Hoy', 'Cierre Anterior']);
      expect(d.series.map((s) => s.nombre)).toEqual(['Trasladada', 'Propia', 'Heredada']);
      expect(d.series.find((s) => s.nombre === 'Propia')?.valores).toEqual([2115583, 3528967]);
      expect(d.series.find((s) => s.nombre === 'Heredada')?.valores).toEqual([325474, null]);
      expect(d.meta).toEqual({ valor: 4100000, etiqueta: 'Meta 4,100,000' });
      expect(d.faltan).toEqual({ desde: 2441057, etiqueta: 'Faltan 1,658,943' });
      expect(d.totales).toEqual(['2,441,057', '3,528,967']);
    });

    it('sin cierre anterior no dibuja la columna ni inventa su total', () => {
      const d = datosColumnasCartera({ ...SALDO, cierreAnterior: null }, '#0A4681');

      expect(d.series.find((s) => s.nombre === 'Propia')?.valores).toEqual([2115583, null]);
      expect(d.totales).toEqual(['2,441,057', '—']);
    });

    it('aclarar mezcla con blanco sin salirse del rango', () => {
      expect(aclarar('#000000', 0)).toBe('#000000');
      expect(aclarar('#000000', 1)).toBe('#FFFFFF');
      expect(aclarar('#0A4681', 0.5)).toBe('#85A3C0');
    });

    it('sin meta no inventa la línea y cada tramo es un tono del color base', () => {
      const d = datosColumnasCartera(OPERACIONES, '#C0326E');

      expect(d.meta).toBeUndefined();
      expect(d.series.find((s) => s.nombre === 'Propia')?.color).toBe('#C0326E');
      expect(d.series.find((s) => s.nombre === 'Heredada')?.color).toBe(aclarar('#C0326E', 0.62));
    });
  });

  describe('faltanteMeta', () => {
    it('devuelve lo que falta, nunca negativo, y null sin meta', () => {
      expect(faltanteMeta(SALDO)).toBe(1658943);
      expect(faltanteMeta({ ...SALDO, totalHoy: 9_000_000 })).toBe(0);
      expect(faltanteMeta(OPERACIONES)).toBeNull();
    });
  });

  describe('avanceVariacion', () => {
    it('devuelve avance y faltante, sin faltante negativo', () => {
      expect(avanceVariacion(1, 18).faltan).toBe(17);
      expect(formatearAvance(avanceVariacion(1, 18).avancePct)).toBe('5.6%');
      expect(avanceVariacion(30, 18).faltan).toBe(0);
      expect(avanceVariacion(-3, 18).avancePct).toBe(0);
    });
  });
});
