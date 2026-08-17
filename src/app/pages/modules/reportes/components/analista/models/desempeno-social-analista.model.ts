import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado de "Desempeño Social" de analista/sectorista (`DesempenoSocialAnalistaService.obtenerDesempenoSocial`) — único bloque del legado (`DESE_SOC_AS_01`). No confundir con "Desempeño Social" de administración (`desarrollo-sostenible`, `cod_rep: 'DESEMP_SOC_01'`), otro reporte del legado con otro `cod_rep`. */
export interface ReporteDesempenoSocialAnalista {
  tabla1: TablaReporteResultado;
}
