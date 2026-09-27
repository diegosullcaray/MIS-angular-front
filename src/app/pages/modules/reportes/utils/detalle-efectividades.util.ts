import { TODO } from '../models/filtros.model';
import type { FiltrosDetalleComunes } from '../models/detalle-efectividades.model';

/** Conserva `nom`, `resp`, `fcompro` y `pagen` del contrato Ant. */
export function paramsDetalleComunes(f: FiltrosDetalleComunes): Record<string, unknown> {
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  const fecha = f.fechaCompromiso;
  return {
    pagen: f.pagina,
    nom: `%${f.asesor}%`,
    resp: f.ultimaGestion,
    fcompro: fecha
      ? `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
      : TODO,
  };
}
