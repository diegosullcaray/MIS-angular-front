#!/usr/bin/env node
/**
 * Verifica que la documentación de gobernanza siga describiendo este repo.
 *
 * `governance/docs/README.md` promete que "un documento que ya no describe el
 * código se borra". Esa promesa necesitaba a alguien releyendo 70 archivos a
 * mano. Este script hace la parte mecánica:
 *
 *   1. Enlaces internos rotos entre documentos.
 *   2. Rutas de código citadas en los `.md` que ya no existen en el repo
 *      (`src/app/...`, `e2e/...`, `governance/...`).
 *   3. Símbolos citados como código (`AlgoService`, `algoUtil()`) que no
 *      aparecen en ningún archivo de `src/` — solo se avisa, porque un
 *      documento puede nombrar a propósito algo que todavía no existe.
 *   4. Reglas del auditor que citan un documento de norma que ya no existe.
 *   5. Documentos huérfanos: ningún otro `.md` de gobernanza los enlaza.
 *
 * Uso:
 *   node governance/scripts/validar-documentacion.mjs
 *   node governance/scripts/validar-documentacion.mjs --check   falla en CI
 *   node governance/scripts/validar-documentacion.mjs --json
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { listarArchivos, opciones, titulo, verde, rojo, amarillo, gris, negrita, RAIZ, SRC, GOVERNANCE } from './lib/proyecto.mjs';

const { flags } = opciones();

const docs = listarArchivos(GOVERNANCE, ['.md']).map((absoluta) => ({
  absoluta,
  ruta: relative(RAIZ, absoluta).split(sep).join('/'),
  contenido: readFileSync(absoluta, 'utf8'),
}));

/** Índice de todo el código fuente, para resolver símbolos citados. */
const fuente = listarArchivos(SRC, ['.ts', '.html', '.css'])
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

/**
 * Una guía necesita poder nombrar lo que NO hay que escribir. Si la línea que
 * cita el símbolo lo está señalando como error, no se reporta: si no, corregir
 * un documento explicando el error volvería a marcarlo como error.
 */
const NEGACION =
  /\bno existe|no existen|nunca|incorrecto|antipatr|prohibid|en vez de|no se usa|no aporta|deja de|produce una pantalla sin|cero usos|0 usos|inexistent|no aparece|no hay componente/i;

function esContraejemplo(contenido, indice) {
  const inicio = contenido.lastIndexOf('\n', indice) + 1;
  const fin = contenido.indexOf('\n', indice);
  return NEGACION.test(contenido.slice(inicio, fin === -1 ? undefined : fin));
}

const enlacesRotos = [];
const rutasInexistentes = [];
const simbolosDesconocidos = [];
const enlazados = new Set();

for (const doc of docs) {
  const carpeta = dirname(doc.absoluta);

  /* 1. Enlaces markdown internos. */
  for (const m of doc.contenido.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const destino = m[1];
    if (/^(https?:|mailto:|#)/.test(destino)) continue;

    const [ruta] = destino.split('#');
    if (!ruta) continue; // ancla pura

    const absoluto = resolve(carpeta, ruta);
    const rel = relative(RAIZ, absoluto).split(sep).join('/');
    enlazados.add(rel.replace(/\/$/, ''));

    if (!existsSync(absoluto)) {
      enlacesRotos.push({ doc: doc.ruta, destino, resuelto: rel });
    }
  }

  /* 2. Rutas de repo citadas entre backticks. */
  for (const m of doc.contenido.matchAll(/`((?:src|e2e|governance|public)\/[A-Za-z0-9_./<>-]+)`/g)) {
    const citada = m[1];
    // Las plantillas con placeholder (`<modulo>`) describen una forma, no un archivo.
    if (citada.includes('<') || citada.endsWith('/')) continue;
    if (!existsSync(resolve(RAIZ, citada))) {
      rutasInexistentes.push({ doc: doc.ruta, citada });
    }
  }

  /* 3. Símbolos citados: clases TS, selectores de componente… */
  for (const m of doc.contenido.matchAll(/`(([A-Z][A-Za-z0-9]*(?:Service|Component|Guard|Interceptor))|(app-[a-z][a-z0-9-]+))`/g)) {
    const simbolo = m[1];
    if (!fuente.includes(simbolo) && !esContraejemplo(doc.contenido, m.index)) {
      simbolosDesconocidos.push({ doc: doc.ruta, simbolo });
    }
  }

  /* …y tokens de diseño y utilidades citadas en las guías de estilo. Esta es
     la comprobación que faltaba: la skill de estilos documentaba una paleta de
     clases (`bg-surface-card`, `text-text-primary`) que no existe en el repo,
     y cualquiera que la copiara obtenía una pantalla sin estilos. */
  for (const m of doc.contenido.matchAll(/`(--mis-[a-z0-9-]+)`/g)) {
    if (!fuente.includes(m[1]) && !esContraejemplo(doc.contenido, m.index)) {
      simbolosDesconocidos.push({ doc: doc.ruta, simbolo: m[1] });
    }
  }
  for (const m of doc.contenido.matchAll(/`((?:bg|text|border)-[a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)) {
    const clase = m[1];
    if (/^(?:bg|text|border)-(?:\[|var)/.test(clase)) continue; // sintaxis arbitraria, ya validada por --mis-*
    if (!fuente.includes(clase) && !esContraejemplo(doc.contenido, m.index)) {
      simbolosDesconocidos.push({ doc: doc.ruta, simbolo: clase });
    }
  }
}

/* 3.bis. Las reglas del auditor citan la norma que las justifica. Si ese
   documento se mueve o se borra, el hallazgo queda apuntando al vacío y deja de
   poder discutirse contra algo escrito. */
const normasHuerfanas = [];
try {
  const auditor = readFileSync(resolve(GOVERNANCE, 'scripts/validar-gobernanza.mjs'), 'utf8');
  for (const m of auditor.matchAll(/^\s*id: '([^']+)',[\s\S]{0,300}?doc: '([^']+)',/gm)) {
    const [, regla, docRegla] = m;
    if (!existsSync(resolve(GOVERNANCE, docRegla))) normasHuerfanas.push({ regla, doc: docRegla });
  }
} catch {
  /* sin auditor no hay nada que verificar */
}

/* 4. Documentos que nadie enlaza. Los README son índices: se los da por alcanzables. */
const huerfanos = docs
  .map((d) => d.ruta)
  .filter((ruta) => !/\/(README|readme)\.md$/.test(ruta))
  .filter((ruta) => !enlazados.has(ruta));

const unicos = (lista, clave) => [...new Map(lista.map((x) => [clave(x), x])).values()];
const simbolos = unicos(simbolosDesconocidos, (x) => `${x.doc}|${x.simbolo}`);
const rutas = unicos(rutasInexistentes, (x) => `${x.doc}|${x.citada}`);

if (flags['json']) {
  console.log(JSON.stringify({ documentos: docs.length, enlacesRotos, rutasInexistentes: rutas, simbolosDesconocidos: simbolos, normasHuerfanas, huerfanos }, null, 2));
  process.exit(enlacesRotos.length + rutas.length + normasHuerfanas.length > 0 && flags['check'] ? 1 : 0);
}

titulo('Validación de documentación de gobernanza', `${docs.length} documentos revisados`);

function seccion(etiqueta, pintar, lista, render) {
  if (lista.length === 0) return;
  console.log(`\n${pintar(etiqueta)} ${gris(`(${lista.length})`)}`);
  for (const x of lista.slice(0, 20)) console.log(`  ${render(x)}`);
  if (lista.length > 20) console.log(gris(`  … y ${lista.length - 20} más`));
}

seccion('ENLACES ROTOS', rojo, enlacesRotos, (x) => `${x.doc} → ${negrita(x.destino)} ${gris(`(${x.resuelto})`)}`);
seccion('RUTAS DE CÓDIGO INEXISTENTES', rojo, rutas, (x) => `${x.doc} → ${negrita(x.citada)}`);
seccion('SÍMBOLOS NO ENCONTRADOS EN src/', amarillo, simbolos, (x) => `${x.doc} → ${negrita(x.simbolo)}`);
seccion('REGLAS QUE CITAN UNA NORMA INEXISTENTE', rojo, normasHuerfanas, (x) => `regla ${negrita(x.regla)} → governance/${x.doc}`);
seccion('DOCUMENTOS NO ENLAZADOS', amarillo, huerfanos, (x) => x);

const criticos = enlacesRotos.length + rutas.length + normasHuerfanas.length;
console.log('');
if (criticos === 0 && simbolos.length === 0 && huerfanos.length === 0) {
  console.log(verde('✓ La documentación resuelve todos sus enlaces y referencias.\n'));
  process.exit(0);
}

console.log(
  `${criticos ? rojo(`${criticos} referencia(s) rota(s)`) : verde('0 referencias rotas')} · ${amarillo(`${simbolos.length} símbolo(s) dudoso(s)`)} · ${amarillo(`${huerfanos.length} huérfano(s)`)}\n`
);

process.exit(flags['check'] && criticos > 0 ? 1 : 0);
