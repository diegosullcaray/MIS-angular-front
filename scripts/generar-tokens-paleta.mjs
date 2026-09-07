#!/usr/bin/env node
/**
 * Genera `src/app/theme/tokens.paleta.ts` a partir de `src/app/theme/tokens.css`.
 *
 * Los tests de contraste y de daltonismo necesitan los tokens como valores de
 * TypeScript, pero la fuente de verdad es el CSS: duplicarlos a mano garantiza
 * que se desincronicen. Este script los extrae, y con `--check` falla si el
 * archivo generado quedó viejo — así el desfase se ve en CI y no en producción.
 *
 *   node scripts/generar-tokens-paleta.mjs           regenera el archivo
 *   node scripts/generar-tokens-paleta.mjs --check   solo verifica
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEN = 'src/app/theme/tokens.css';
const DESTINO = 'src/app/theme/tokens.paleta.ts';

/**
 * Un valor es color si es hex, `rgb()`/`rgba()` o la palabra `transparent`. Se
 * descartan tamaños, sombras y filtros. `transparent` entra porque hay tokens
 * que en un tema son transparentes y en el otro un color: si se descartara, los
 * dos temas no declararían el mismo juego de tokens.
 */
const ES_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|transparent)$/i;

/** Toma el contenido de un bloque `selector { ... }`. */
function bloque(css, selector) {
  const inicio = css.indexOf(selector);
  if (inicio === -1) throw new Error(`No se encontró el selector ${selector} en ${ORIGEN}`);
  const abre = css.indexOf('{', inicio);
  let profundidad = 0;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') profundidad++;
    else if (css[i] === '}') {
      profundidad--;
      if (profundidad === 0) return css.slice(abre + 1, i);
    }
  }
  throw new Error(`Bloque ${selector} sin cerrar`);
}

/** `--mis-x: valor;` → { 'mis-x': 'valor' }, solo para los valores de color. */
function tokensDe(texto) {
  const tokens = {};
  for (const [, nombre, valor] of texto.matchAll(/--(mis-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const limpio = valor.trim();
    if (ES_COLOR.test(limpio)) tokens[nombre] = limpio;
  }
  return tokens;
}

function entradas(tokens) {
  return Object.entries(tokens)
    .map(([nombre, valor]) => `  '${nombre}': '${valor}',`)
    .join('\n');
}

const css = readFileSync(ORIGEN, 'utf8');
const claro = tokensDe(bloque(css, ':root'));
// El bloque `.dark` solo redefine lo que cambia: el tema oscuro real es el claro
// con esas sobrescrituras encima, igual que en la cascada del navegador.
const oscuro = { ...claro, ...tokensDe(bloque(css, '\n.dark')) };

const contenido = `// GENERADO por scripts/generar-tokens-paleta.mjs — no editar a mano.
// La fuente de verdad es src/app/theme/tokens.css. Para regenerar:
//   node scripts/generar-tokens-paleta.mjs

/** Nombre de un token de color del sistema. */
export type TokenColor = keyof typeof TOKENS_CLARO;

/** Tokens de color del tema claro (bloque \`:root\` de \`tokens.css\`). */
export const TOKENS_CLARO = {
${entradas(claro)}
} as const;

/** Tokens de color del tema oscuro: los de \`:root\` con las sobrescrituras de \`.dark\`. */
export const TOKENS_OSCURO: Record<TokenColor, string> = {
${entradas(oscuro)}
};

/** Los dos temas, para recorrerlos en los tests. */
export const TEMAS = [
  { nombre: 'claro', tokens: TOKENS_CLARO as Record<TokenColor, string> },
  { nombre: 'oscuro', tokens: TOKENS_OSCURO },
] as const;
`;

if (process.argv.includes('--check')) {
  let actual = '';
  try {
    actual = readFileSync(DESTINO, 'utf8');
  } catch {
    actual = '';
  }
  if (actual !== contenido) {
    console.error(`✘ ${DESTINO} está desactualizado respecto de ${ORIGEN}.`);
    console.error('  Corré: node scripts/generar-tokens-paleta.mjs');
    process.exit(1);
  }
  console.log(`✔ ${DESTINO} coincide con ${ORIGEN} (${Object.keys(claro).length} tokens).`);
} else {
  writeFileSync(DESTINO, contenido);
  console.log(`✔ ${DESTINO}: ${Object.keys(claro).length} tokens claros, ${Object.keys(oscuro).length} oscuros.`);
}
