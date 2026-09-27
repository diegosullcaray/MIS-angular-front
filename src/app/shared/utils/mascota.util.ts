/** Skins de temporada de Pachi: cada una es una subcarpeta de `tours/skins/` con las mismas poses. */
export type SkinPachi = 'halloween';

const CARPETA = '/assets/images/fc/tours/';

/** Skin que toca en la fecha dada, o `null` fuera de temporada. Halloween: todo octubre. */
export function skinDeTemporada(fecha = new Date()): SkinPachi | null {
  return fecha.getMonth() === 9 ? 'halloween' : null;
}

/** Ruta de una pose de Pachi, con la skin de temporada si corresponde. */
export function rutaMascota(pose: string, fecha = new Date()): string {
  const skin = skinDeTemporada(fecha);
  return `${CARPETA}${skin ? `skins/${skin}/` : ''}mascota-${pose}.png`;
}
