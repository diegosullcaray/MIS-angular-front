import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** Forma cruda del bloque: `result.body[0]` con `categories` y `series` serializados. */
interface BloqueGraficoSerializado {
  categories?: string;
  series?: string;
}

/**
 * Traduce un bloque `GRAFSEGPAS_*` a `<app-grafico-mixto>`. No usan la forma
 * normal de `graphicData`: traen `categories` y `series` como TEXTO en
 * `result.body[0]`, que el legado resolvía con `eval()` y acá se parsea.
 *
 * `null` si no se puede parsear, para no pintar el gráfico. Si el backend
 * emitiera literales de JavaScript (claves sin comillas) `JSON.parse` falla:
 * capturar un payload real antes de tocar el parseo, no adivinar.
 */
export function graficoEvolutivoPasivos(
  r: IWinderResponse,
  titulo: string,
  tituloEjeY: string,
): BloqueGrafico | null {
  const cuerpo = (r.body as { result?: { body?: BloqueGraficoSerializado[] } } | null)?.result?.body?.[0];
  if (!cuerpo?.categories || !cuerpo.series) return null;

  try {
    const categorias = JSON.parse(cuerpo.categories) as string[];
    const series = JSON.parse(cuerpo.series) as { name?: string; data?: (number | null)[]; color?: string }[];
    return {
      titulo,
      tituloEjeY,
      categorias: categorias.map(String),
      series: series.map((s) => ({ nombre: s.name ?? '', datos: s.data ?? [], color: s.color })),
    };
  } catch {
    return null;
  }
}
