/** Constantes del módulo Incentivos (Cuadro de Mando). */

/** `cod_jer` de la jerarquía organizativa — el mismo que usan Presupuesto y Kaypacha para `base_hier`. */
export const COD_JERARQUIA_ORGANIZATIVA = 9;

/** Modelo de campaña vigente. La 2025 ya cerró. */
export const MODELO_CAMPANIA = '2026';

/**
 * Prefijos y sufijos con los que el backend nombra cada dato dentro del mismo
 * `resultado`. `asignarValores()` compone `<prefijo><id><sufijo>` para leerlos,
 * así que estas cadenas son parte del contrato con el SP, no detalle interno.
 */
export const CLAVES_INCENTIVOS = {
  /** Bono base por variable. */
  bonoBase: 'bob_',
  /** Bono plus por variable. */
  bonoPlus: 'bop_',
  /** Bono súper plus por variable. */
  bonoSuperPlus: 'bos_',
  /** Banderas de estado del semáforo. */
  flag: 'flag_',
  /** Bandera de asesor activo. */
  flagActivo: 'flag_act',
  /** Valor real de una variable. */
  sufijoReal: '_real',
  /** Meta de una variable. */
  sufijoMeta: '_met',
  /** Avance en valor absoluto. */
  sufijoAvance: '_avan_fix',
  /** Avance en porcentaje. */
  sufijoAvancePorcentaje: '_avan_floor',
} as const;

/** Tarjeta de cabecera cuando se consulta el consolidado de la financiera. */
export const CABECERA_FINANCIERA_CONFIANZA = {
  nombre: 'FINANCIERA CONFIANZA',
  nivel: 'TOTAL',
  descripcionNivel: 'FC',
  imagenUrl: 'assets/images/fc/avatars/mis_wait.png',
} as const;
