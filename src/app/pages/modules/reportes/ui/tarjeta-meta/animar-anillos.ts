import type { WritableSignal } from '@angular/core';
import type { TarjetaCmgCartera } from '../../models/cmg-cartera.model';

export function animarAnillos(
  tarjetas: readonly TarjetaCmgCartera[],
  progresoAnillos: WritableSignal<Record<string, number>>,
): () => void {
  let activo = true;
  progresoAnillos.set({});
  const duracionMs = 900;
  for (const tarjeta of tarjetas) {
    if (tarjeta.cumplimiento === undefined) continue;
    const objetivo = tarjeta.cumplimiento;
    const etiqueta = tarjeta.etiqueta;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      if (!activo) return;
      const progreso = Math.min((ahora - inicio) / duracionMs, 1);
      progresoAnillos.update((valores) => ({
        ...valores,
        [etiqueta]: Math.round(objetivo * progreso * 10) / 10,
      }));
      if (progreso < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  return () => {
    activo = false;
  };
}
