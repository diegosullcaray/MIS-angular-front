import type { BloqueGrafico } from '../../../models/grafico-reporte.model';

/** Resultado de "Inversión y Stock de Mora" (`InversionStockMoraService.obtenerGraficos`) — único bloque del legado (`rda/sectorista/brecha/brecha_inversion_sec_01`), que puede devolver varios gráficos en un mismo array (`result`). */
export interface ReporteInversionStockMora {
  graficos: BloqueGrafico[];
}
