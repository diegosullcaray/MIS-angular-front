import { TABLERO_DEMO } from '../constantes/actividad-comercial-demo.constantes';
import {
  aclarar,
  avanceVariacion,
  datosColumnasCartera,
  formatearAvance,
  formatearDelta,
  formatearEntero,
  faltanteMeta,
  formatearValor,
  porcentaje,
} from './actividad-comercial.util';

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
      expect(formatearValor(7, 'operaciones')).toBe('7 ops');
      expect(formatearValor(3, 'asesores')).toBe('3 ases.');
    });

    it('usa el signo menos tipográfico en las variaciones y deja el cero sin signo', () => {
      expect(formatearDelta(2)).toBe('+2');
      expect(formatearDelta(-4485)).toBe('−4,485');
      expect(formatearDelta(0)).toBe('0');
    });
  });

  describe('datosColumnasCartera', () => {
    it('apila los tramos de hoy y pone el cierre anterior en la serie propia', () => {
      const d = datosColumnasCartera(TABLERO_DEMO.cartera.saldo, '#0A4681');

      expect(d.categorias).toEqual(['Hoy', 'Cierre Anterior']);
      expect(d.series.map((s) => s.nombre)).toEqual(['Trasladada', 'Propia', 'Heredada']);
      expect(d.series.find((s) => s.nombre === 'Propia')?.valores).toEqual([2115583, 3528967]);
      expect(d.series.find((s) => s.nombre === 'Heredada')?.valores).toEqual([1139160, null]);
      expect(d.meta).toEqual({ valor: 4100000, etiqueta: 'Meta 4,100,000' });
      expect(d.faltan).toEqual({ desde: 2441057, etiqueta: 'Faltan 1,658,943' });
      expect(d.totales).toEqual(['2,441,057', '3,528,967']);
    });

    it('aclarar mezcla con blanco sin salirse del rango', () => {
      expect(aclarar('#000000', 0)).toBe('#000000');
      expect(aclarar('#000000', 1)).toBe('#FFFFFF');
      expect(aclarar('#0A4681', 0.5)).toBe('#85A3C0');
    });

    it('sin meta no inventa la línea y cada tramo es un tono del color base', () => {
      const d = datosColumnasCartera(TABLERO_DEMO.cartera.operaciones, '#C0326E');

      expect(d.meta).toBeUndefined();
      expect(d.series.find((s) => s.nombre === 'Propia')?.color).toBe('#C0326E');
      expect(d.series.find((s) => s.nombre === 'Heredada')?.color).toBe(aclarar('#C0326E', 0.62));
    });
  });

  describe('faltanteMeta', () => {
    it('devuelve lo que falta, nunca negativo, y null sin meta', () => {
      expect(faltanteMeta(TABLERO_DEMO.cartera.saldo)).toBe(1658943);
      expect(faltanteMeta({ ...TABLERO_DEMO.cartera.saldo, totalHoy: 9_000_000 })).toBe(0);
      expect(faltanteMeta(TABLERO_DEMO.cartera.operaciones)).toBeNull();
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
