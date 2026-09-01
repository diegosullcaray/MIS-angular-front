import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** Forma cruda del bloque: `result.body[0]` con `categories` y `series` serializados. */
interface BloqueGraficoSerializado {
  categories?: string;
  series?: string;
}

/**
 * Traduce un bloque `GRAFSEGPAS_*` al contrato de `<app-grafico-mixto>`.
 *
 * Estos bloques no devuelven la forma normal de `graphicData`: traen
 * `categories` y `series` como texto dentro de `result.body[0]`. El legado los
 * resuelve con `eval()`; acá se parsean como JSON.
 *
 * Devuelve `null` si el payload no se puede parsear, para que el componente
 * simplemente no pinte ese gráfico. OJO: si el backend emitiera literales de
 * JavaScript (claves sin comillas, comillas simples) `JSON.parse` falla y el
 * gráfico queda vacío en vez de mostrar datos equivocados — hay que capturar un
 * payload real y ajustar el parseo, no adivinar el formato.
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
