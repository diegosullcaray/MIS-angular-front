/**
 * Códigos de reporte (`cod_rep`) de Seguros.
 *
 * Los cuatro reportes usan motores distintos, y el comentario de cada clave
 * dice cuál: es lo que decide cómo se arma la petición.
 */
export const COD_SEGUROS = {
  /**
   * `cam-seguros` (host `cra-v1p6`, `regularData`). Sus ids no son
   * correlativos: el mapa declara `_01`, `_02`, `_04` y `_05` — el `_03` está
   * comentado en el legado.
   */
  reporteSeguros: ['GRSCMIS_01', 'GRSCMIS_02', 'GRSCMIS_04', 'GRSCMIS_05'],
  /**
   * `repositorio/seguros-pasivos` (`table.regular`). En el orden en que el
   * legado los PINTA, que no es el orden en que los pide: el `_03` es el
   * resumen y va primero.
   */
  segurosPasivos: ['RS_SEG_PAS_03', 'RS_SEG_PAS_01', 'RS_SEG_PAS_02', 'RS_SEG_PAS_04'],
  /** `repositorio/seguro-com` (`table.regular`). */
  segurosOptativos: 'GRSCMISREP_01',
  /** Selector de periodo de Seguros Optativos — usa `RS_FECH`, no el `RS_FECH02` de Gestión Comercial. */
  periodosSegurosOptativos: 'RS_FECH',
  /**
   * `repositorio/seguro-pasivos-graf` (`regularData`, pero con bloques de
   * gráfico serializados dentro de `result.body[0]`).
   */
  evolutivoPasivos: ['GRAFSEGPAS_01', 'GRAFSEGPAS_02'],
} as const;

/** Título y eje de cada gráfico de Evolutivo Pasivos, en el orden de sus bloques. */
export const GRAFICOS_EVOLUTIVO_PASIVOS = [
  { titulo: 'Microseguro Oncológico', tituloEjeY: 'Nro. Pólizas' },
  { titulo: 'Evolutivo de Seguros Pasivos', tituloEjeY: 'Nro. Pólizas' },
] as const;
