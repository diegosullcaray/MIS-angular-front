import { TODO } from './filtros.model';

/** Filtros que comparten los detalles de efectividades diaria y mensual. */
export interface FiltrosDetalleComunes {
  asesor: string;
  fechaCompromiso: Date | null;
  ultimaGestion: string;
  pagina: number;
}

export const FILTROS_DETALLE_INICIALES: FiltrosDetalleComunes = {
  asesor: '',
  fechaCompromiso: null,
  ultimaGestion: TODO,
  pagina: 1,
};
