#!/usr/bin/env node
/**
 * Verifica que cada paso de los recorridos guiados apunte a algo que existe.
 *
 * Un tour de driver.js localiza su elemento por selector CSS **en tiempo de
 * ejecución**: si alguien renombra una clase, quita un `id` o cambia un
 * `aria-label`, el paso no falla ni rompe la compilación — simplemente
 * `skipMissingElement` lo saltea y el usuario ve un recorrido con agujeros.
 * Nada en la suite lo detecta, porque no hay nada que compilar.
 *
 * Pasó de verdad: la luz amarilla del semáforo se renombró de
 * `mis-window-light--minimizar` a `mis-window-light--volver` y el diálogo que
 * seguía usando el nombre viejo quedó con un botón gris y sin glifo
 * (INC-2026-09-09-01). Este script compara los selectores de los pasos contra
 * las plantillas y las hojas de estilo reales.
 *
 *   node governance/scripts/verificar-anclas-tour.mjs            informe
 *   node governance/scripts/verificar-anclas-tour.mjs --check    falla si hay anclas rotas
 *   node governance/scripts/verificar-anclas-tour.mjs --json     salida para herramientas
 */
import { indexarApp, titulo, rojo, verde, amarillo, gris, negrita, opciones } from './lib/proyecto.mjs';

/**
 * Prefijos de clase que produce una librería, no nuestras plantillas: PrimeNG
 * (`p-`) y el propio driver.js. No se pueden verificar contra `src/`, así que
 * se informan aparte en vez de darlos por rotos.
 */
const PREFIJOS_EXTERNOS = ['p-', 'driver-', 'pi-'];

/** Un archivo declara pasos de tour si nombra `element:` y viene del motor de tours. */
function esCatalogoDeTour(archivo) {
  if (!archivo.ruta.endsWith('.ts') || archivo.esSpec) return false;
  return archivo.contenido.includes('element:') && /DriveStep|DriverTourService|driver\.js/.test(archivo.contenido);
}

/**
 * Selectores de los pasos. Contempla las dos formas que usa el repo: el literal
 * (`element: '#tour-x'`) y la constante compartida (`element: ANCLA.rail`, con
 * `rail: '#tour-sidebar-icons'` declarado arriba en el mismo archivo).
 */
function selectoresDe(contenido) {
  const encontrados = [];

  for (const m of contenido.matchAll(/element:\s*'([^']+)'/g)) {
    encontrados.push({ selector: m[1], via: 'literal', indice: m.index ?? 0 });
  }

  for (const m of contenido.matchAll(/element:\s*([A-Z_][A-Za-z0-9_]*)\.([A-Za-z0-9_]+)/g)) {
    const clave = m[2];
    const declaracion = contenido.match(new RegExp(`\\b${clave}\\s*:\\s*'([^']+)'`));
    if (declaracion) {
      encontrados.push({ selector: declaracion[1], via: `${m[1]}.${clave}`, indice: m.index ?? 0 });
    } else {
      encontrados.push({ selector: null, via: `${m[1]}.${clave}`, indice: m.index ?? 0, sinResolver: true });
    }
  }

  return encontrados;
}

/**
 * Parte un selector compuesto en sus piezas simples (`header button[x]` → 2).
 *
 * El corte respeta corchetes y comillas: un `[aria-label="Comunicados del
 * sistema"]` tiene espacios adentro, y partirlo por espacios producía piezas
 * como `del` y `sistema"]`, que después se reportaban como etiquetas
 * inexistentes.
 */
function piezasDe(selector) {
  const piezas = [];
  let actual = '';
  let enCorchete = false;
  let comilla = null;

  for (const caracter of selector) {
    if (comilla) {
      actual += caracter;
      if (caracter === comilla) comilla = null;
      continue;
    }
    if (caracter === '"' || caracter === "'") {
      comilla = caracter;
      actual += caracter;
      continue;
    }
    if (caracter === '[') enCorchete = true;
    if (caracter === ']') enCorchete = false;

    if (!enCorchete && /[\s>+~]/.test(caracter)) {
      if (actual.trim()) piezas.push(actual.trim());
      actual = '';
      continue;
    }
    actual += caracter;
  }

  if (actual.trim()) piezas.push(actual.trim());
  return piezas;
}

/** De una pieza simple saca qué hay que buscar: tag, ids, clases y atributos. */
function partesDe(pieza) {
  const ids = [...pieza.matchAll(/#([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
  const clases = [...pieza.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
  const atributos = [...pieza.matchAll(/\[([A-Za-z0-9_-]+)(?:([~^|$*]?=)"([^"]*)")?\]/g)].map((m) => ({
    nombre: m[1],
    operador: m[2] ?? null,
    valor: m[3] ?? null,
  }));
  const tag = pieza.match(/^([a-z][a-z0-9-]*)/)?.[1] ?? null;
  return { tag, ids, clases, atributos };
}

/** Índice de búsqueda: plantillas por un lado, estilos por el otro. */
function corpusDe(archivos) {
  const plantillas = archivos.filter((a) => a.esPlantilla).map((a) => a.contenido).join('\n');
  const estilos = archivos.filter((a) => a.esEstilo).map((a) => a.contenido).join('\n');
  const componentes = archivos.filter((a) => a.ruta.endsWith('.ts') && !a.esSpec).map((a) => a.contenido).join('\n');
  return { plantillas, estilos, componentes };
}

/** Motivo por el que una pieza no se pudo resolver, o `null` si está bien. */
function revisarPieza(pieza, corpus) {
  const { tag, ids, clases, atributos } = partesDe(pieza);

  for (const id of ids) {
    if (!corpus.plantillas.includes(`id="${id}"`) && !corpus.plantillas.includes(`id='${id}'`)) {
      return `ningún elemento declara id="${id}"`;
    }
  }

  for (const clase of clases) {
    if (PREFIJOS_EXTERNOS.some((p) => clase.startsWith(p))) continue;
    const enPlantilla = new RegExp(`[\\s"'\\[.]${clase}[\\s"'\\]]`).test(corpus.plantillas);
    const enEstilo = corpus.estilos.includes(`.${clase}`);
    if (!enPlantilla && !enEstilo) return `la clase .${clase} no existe en plantillas ni en estilos`;
  }

  for (const attr of atributos) {
    const declarado =
      corpus.plantillas.includes(`${attr.nombre}=`) ||
      corpus.plantillas.includes(`[${attr.nombre}]=`) ||
      corpus.plantillas.includes(`[attr.${attr.nombre}]=`);
    if (!declarado) return `ninguna plantilla declara el atributo ${attr.nombre}`;

    // Con valor exacto se exige el valor; con ^= o *= alcanza el fragmento,
    // porque el resto suele venir de una interpolación.
    if (attr.valor) {
      const literal = attr.operador === '=' ? `${attr.nombre}="${attr.valor}"` : attr.valor;
      if (!corpus.plantillas.includes(literal) && !corpus.componentes.includes(attr.valor)) {
        return `${attr.nombre} nunca toma el valor "${attr.valor}"`;
      }
    }
  }

  if (tag && !ids.length && !clases.length && !atributos.length) {
    if (!corpus.plantillas.includes(`<${tag}`)) return `ninguna plantilla usa <${tag}>`;
  }

  return null;
}

/** Anclas `id="tour-*"` que quedaron en las plantillas sin ningún paso que las use. */
function anclasHuerfanas(archivos, usados) {
  const huerfanas = [];
  for (const archivo of archivos.filter((a) => a.esPlantilla)) {
    for (const m of archivo.contenido.matchAll(/id="(tour-[A-Za-z0-9_-]+)"/g)) {
      if (!usados.has(m[1])) huerfanas.push({ ruta: archivo.ruta, id: m[1] });
    }
  }
  return huerfanas;
}

const { flags } = opciones();
const archivos = indexarApp(['.ts', '.html', '.css']);
const corpus = corpusDe(archivos);

const catalogos = archivos.filter(esCatalogoDeTour);
const rotas = [];
const externas = [];
const idsUsados = new Set();
let pasos = 0;

for (const catalogo of catalogos) {
  for (const { selector, via, sinResolver } of selectoresDe(catalogo.contenido)) {
    pasos++;
    if (sinResolver || !selector) {
      rotas.push({ ruta: catalogo.ruta, selector: via, motivo: 'la constante del ancla no se pudo resolver en el archivo' });
      continue;
    }

    for (const m of selector.matchAll(/#([A-Za-z0-9_-]+)/g)) idsUsados.add(m[1]);

    const piezas = piezasDe(selector);
    if (piezas.every((p) => PREFIJOS_EXTERNOS.some((pre) => p.replace(/^[.#]/, '').startsWith(pre)))) {
      externas.push({ ruta: catalogo.ruta, selector });
      continue;
    }

    for (const pieza of piezas) {
      const motivo = revisarPieza(pieza, corpus);
      if (motivo) {
        rotas.push({ ruta: catalogo.ruta, selector, via, motivo });
        break;
      }
    }
  }
}

const huerfanas = anclasHuerfanas(archivos, idsUsados);

if (flags['json']) {
  console.log(JSON.stringify({ catalogos: catalogos.map((c) => c.ruta), pasos, rotas, huerfanas, externas }, null, 2));
  process.exit(flags['check'] && rotas.length ? 1 : 0);
}

titulo('Anclas de los recorridos guiados', `${catalogos.length} catálogo(s) · ${pasos} paso(s)`);

if (rotas.length) {
  for (const rota of rotas) {
    console.log(`${rojo('ROTA')} ${negrita(rota.selector)}`);
    console.log(gris(`  ${rota.ruta}${rota.via && rota.via !== rota.selector ? ` (${rota.via})` : ''}`));
    console.log(gris(`  → ${rota.motivo}`));
  }
  console.log('');
}

if (huerfanas.length) {
  console.log(`${amarillo('AVISO')} anclas sin ningún paso que las use ${gris(`(${huerfanas.length})`)}`);
  for (const h of huerfanas) console.log(gris(`  ${h.ruta} → id="${h.id}"`));
  console.log('');
}

if (externas.length) {
  console.log(gris(`${externas.length} ancla(s) apuntan a marcado de librería (PrimeNG/driver.js): no se verifican.`));
}

console.log(
  rotas.length
    ? `${rojo(`${rotas.length} ancla(s) rota(s)`)} · ${amarillo(`${huerfanas.length} huérfana(s)`)}`
    : `${verde('Todas las anclas resuelven')} · ${amarillo(`${huerfanas.length} huérfana(s)`)}`
);

if (flags['check'] && rotas.length) process.exit(1);
