#!/usr/bin/env node
/**
 * Auditor de gobernanza y arquitectura — MIS Host (Financiera Confianza).
 *
 * Motor de reglas sobre `src/app`. Cada regla declara id, nivel, qué verifica y
 * a qué documento de `governance/docs/` responde, así un hallazgo siempre se
 * puede discutir contra una norma escrita y no contra el gusto de quien revisa.
 *
 * Niveles:
 *   error  rompe una invariante de arquitectura o seguridad → falla en CI.
 *   aviso  deuda o desvío de convención → visible, no bloquea salvo `--estricto`.
 *
 * Uso:
 *   node governance/scripts/validar-gobernanza.mjs                 informe local
 *   node governance/scripts/validar-gobernanza.mjs --check         falla si hay errores (CI)
 *   node governance/scripts/validar-gobernanza.mjs --estricto      falla también con avisos
 *   node governance/scripts/validar-gobernanza.mjs --json          salida legible por máquina
 *   node governance/scripts/validar-gobernanza.mjs --regla=core-aislado,sin-secretos
 *   node governance/scripts/validar-gobernanza.mjs --listar        lista el catálogo de reglas
 *   node governance/scripts/validar-gobernanza.mjs --guardar-linea-base
 *   node governance/scripts/validar-gobernanza.mjs --linea-base    solo reporta hallazgos NUEVOS
 *
 * La línea base (`governance/gobernanza.linea-base.json`) congela la deuda que
 * ya existía: permite exigir "cero hallazgos nuevos" sin tener que arreglar de
 * golpe los 58 specs que faltan. Se regenera a propósito, nunca en automático.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  indexarApp,
  coincidencias,
  opciones,
  titulo,
  rojo,
  verde,
  amarillo,
  gris,
  negrita,
  RAIZ,
} from './lib/proyecto.mjs';

const { flags } = opciones();
const LINEA_BASE = resolve(RAIZ, 'governance/gobernanza.linea-base.json');

/* ── Catálogo de reglas ───────────────────────────────────── */

/**
 * Cada regla recibe el índice completo y devuelve hallazgos
 * `{ ruta, linea?, detalle }`. No leen disco: el índice ya está en memoria.
 */
const REGLAS = [
  {
    id: 'core-aislado',
    nivel: 'error',
    titulo: 'core no depende de pages',
    doc: 'docs/development/conventions.md',
    porque: 'core es infraestructura: si conoce una pantalla, deja de ser reutilizable y el grafo de dependencias se vuelve cíclico.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.capa === 'core' && !a.esSpec && a.ruta.endsWith('.ts'))
        .flatMap((a) =>
          coincidencias(a.contenido, /from\s+['"][^'"]*pages\/[^'"]*['"]/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `import prohibido: ${c.texto}`,
          }))
        ),
  },
  {
    id: 'shared-aislado',
    nivel: 'error',
    titulo: 'shared no depende de módulos de negocio',
    doc: 'docs/components/component-catalog.md',
    porque: 'la librería compartida debe ser agnóstica del dominio; si importa un módulo, deja de poder reusarse en otro.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.capa === 'shared' && !a.esSpec && a.ruta.endsWith('.ts'))
        .flatMap((a) =>
          coincidencias(a.contenido, /from\s+['"][^'"]*pages\/modules\/[^'"]*['"]/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `import prohibido: ${c.texto}`,
          }))
        ),
  },
  {
    id: 'modulos-desacoplados',
    nivel: 'error',
    titulo: 'un módulo no importa las tripas de otro',
    doc: 'docs/development/module-guide.md',
    porque: 'hoy el acoplamiento entre módulos es cero. Lo compartido sube a shared/ o a core/, no se importa de vecino a vecino.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.modulo && !a.esSpec && a.ruta.endsWith('.ts'))
        .flatMap((a) =>
          coincidencias(a.contenido, /from\s+['"][^'"]*pages\/modules\/([^/'"]+)\/[^'"]*['"]/g)
            .filter((c) => !c.texto.includes(`modules/${a.modulo}/`))
            .map((c) => ({
              ruta: a.ruta,
              linea: c.linea,
              detalle: `el módulo '${a.modulo}' importa de otro módulo: ${c.texto}`,
            }))
        ),
  },
  {
    id: 'sin-secretos',
    nivel: 'error',
    titulo: 'sin identidades ni hosts de desarrollo en código productivo',
    doc: 'docs/security/README.md',
    porque: 'lo que entra al bundle es público. Un correo institucional o un localhost delatan entorno y personas reales.',
    evaluar: (archivos) =>
      archivos
        .filter(
          (a) =>
            !a.esSpec &&
            !/mock|fixture|environment/i.test(a.ruta) &&
            (a.ruta.endsWith('.ts') || a.esPlantilla)
        )
        .flatMap((a) =>
          [
            ...coincidencias(a.contenido, /[a-z]+\.[a-z]+@confianza\.pe/gi),
            ...coincidencias(a.contenido, /https?:\/\/localhost:\d{2,5}/gi),
          ].map((c) => ({ ruta: a.ruta, linea: c.linea, detalle: `dato de entorno embebido: ${c.texto}` }))
        ),
  },
  {
    id: 'control-flujo-moderno',
    nivel: 'error',
    titulo: 'plantillas con @if/@for, no con *ngIf/*ngFor',
    doc: 'skills/angular-mis-zoneless/SKILL.md',
    porque: 'el bloque nativo no arrastra CommonModule y es el único control de flujo que el resto del repo usa.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.esPlantilla)
        .flatMap((a) =>
          coincidencias(a.contenido, /\*ng(If|For|Switch)\b/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `directiva estructural legada: ${c.texto}`,
          }))
        ),
  },
  {
    id: 'entrada-salida-señal',
    nivel: 'aviso',
    titulo: 'input()/output()/viewChild() en vez de decoradores',
    doc: 'skills/angular-mis-zoneless/SKILL.md',
    porque: 'un decorador no es una señal: no se puede componer con computed() ni leer desde un effect().',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.ruta.endsWith('.ts') && !a.esSpec)
        .flatMap((a) =>
          coincidencias(a.contenido, /^\s*@(Input|Output|ViewChild|ContentChild)\s*\(/gm).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `decorador legado ${c.texto.trim()} — migrar a la función equivalente`,
          }))
        ),
  },
  {
    id: 'nombres-canonicos',
    nivel: 'aviso',
    titulo: 'sufijos de archivo por carpeta',
    doc: 'docs/development/naming-conventions.md',
    porque: 'constantes/ → *.constantes.ts, models/ → *.model.ts, utils/ → *.util.ts. Es lo que hace predecible un import a ciegas.',
    evaluar: (archivos) => {
      const esperado = [
        { carpeta: '/constantes/', sufijo: '.constantes.ts' },
        { carpeta: '/models/', sufijo: '.model.ts' },
        { carpeta: '/utils/', sufijo: '.util.ts' },
      ];
      return archivos
        .filter((a) => a.ruta.endsWith('.ts') && !a.ruta.endsWith('/index.ts') && !a.esSpec)
        .flatMap((a) => {
          const regla = esperado.find((e) => a.ruta.includes(e.carpeta));
          if (!regla || a.ruta.endsWith(regla.sufijo)) return [];
          return [{ ruta: a.ruta, detalle: `en ${regla.carpeta} se espera el sufijo ${regla.sufijo}` }];
        });
    },
  },
  {
    id: 'tokens-de-color',
    nivel: 'aviso',
    titulo: 'color por token, no hexadecimal suelto',
    doc: 'docs/components/design-system.md',
    porque: 'un hex fijo no cambia con el tema oscuro ni con el acento elegido por el usuario; el token sí.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => (a.esPlantilla || a.esEstilo) && !a.ruta.startsWith('src/app/theme/'))
        .flatMap((a) =>
          coincidencias(a.contenido, /#[0-9a-fA-F]{3,8}\b/g)
            .slice(0, 3)
            .map((c) => ({
              ruta: a.ruta,
              linea: c.linea,
              detalle: `color fijo ${c.texto} — usar var(--mis-*) o una utilidad text-[var(--mis-*)]`,
            }))
        ),
  },
  {
    id: 'entorno-fuera-de-core',
    nivel: 'aviso',
    titulo: 'environment se lee desde core',
    doc: 'docs/architecture/runtime-configuration.md',
    porque: 'cada import directo es un punto más que tocar el día que la configuración deje de compilarse en el bundle.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.ruta.endsWith('.ts') && !a.esSpec && a.capa !== 'core')
        .flatMap((a) =>
          coincidencias(a.contenido, /from\s+['"][^'"]*environments\/environment[^'"]*['"]/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `lectura directa de environment fuera de core (${a.capa})`,
          }))
        ),
  },
  {
    id: 'prueba-vecina',
    nivel: 'aviso',
    titulo: 'servicios y utilidades con spec al lado',
    doc: 'docs/data/quality.md',
    porque: 'el mapeo puro y la fachada de datos son donde un error silencioso cambia una cifra financiera sin romper nada visible.',
    evaluar: (archivos) => {
      const conocidos = new Set(archivos.map((a) => a.ruta));
      return archivos
        .filter((a) => /\.(service|util)\.ts$/.test(a.ruta) && !a.esSpec)
        .filter((a) => !conocidos.has(a.ruta.replace(/\.ts$/, '.spec.ts')))
        .map((a) => ({ ruta: a.ruta, detalle: 'sin archivo .spec.ts hermano' }));
    },
  },
  {
    id: 'estados-de-datos',
    nivel: 'aviso',
    titulo: 'una vista que carga también contempla error',
    doc: 'docs/development/state-model.md',
    porque: 'un spinner que nunca cede el paso a un error deja al usuario esperando una tabla que jamás va a llegar.',
    evaluar: (archivos) =>
      archivos
        // Solo contenedores: los de `ui/` son presentacionales y reciben
        // `cargando` como input(), así que el error lo decide quien los usa.
        .filter((a) => a.esPlantilla && /\/(components|items)\//.test(a.ruta) && !/\/ui\//.test(a.ruta))
        .filter((a) => /\bcargando\(\)/.test(a.contenido))
        // …y solo si la pantalla dibuja el estado ella misma. Delegar en
        // `app-reporte-simple` o en una tabla compartida es la forma correcta:
        // esos componentes ya resuelven vacío y error por contrato.
        .filter((a) => !/app-(reporte-simple|tabla-reporte|tabla-dinamica|data-table|list-skeleton)/.test(a.contenido))
        .filter((a) => !/\berror\(\)|app-inline-error|app-empty-state|reintentar/.test(a.contenido))
        .map((a) => ({ ruta: a.ruta, detalle: 'la plantilla modela carga pero no error ni vacío' })),
  },
  {
    id: 'error-no-silenciado',
    nivel: 'aviso',
    titulo: 'un error de red no se convierte en tabla vacía',
    doc: 'docs/evidence/performance/legacy-comparison.md',
    porque: 'confundir un 500 con "no hay filas" es exactamente el bug que degradó al sistema legado.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.ruta.endsWith('.ts') && !a.esSpec && /\/services\//.test(a.ruta))
        .flatMap((a) =>
          coincidencias(a.contenido, /catchError\(\s*\(\s*\)\s*=>\s*of\(/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: 'catchError descarta el error sin distinguir bloque vacío conocido de fallo real',
          }))
        ),
  },
  {
    id: 'sin-console',
    nivel: 'aviso',
    titulo: 'sin console.* en código productivo',
    doc: 'docs/data/classification.md',
    porque: 'la consola del navegador es un canal de exfiltración involuntario cuando lo que se loguea es un payload financiero.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.ruta.endsWith('.ts') && !a.esSpec)
        .flatMap((a) =>
          coincidencias(a.contenido, /\bconsole\.(log|debug|info|table)\s*\(/g).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `traza en producción: ${c.texto.trim()}`,
          }))
        ),
  },
  {
    id: 'rutas-lazy',
    nivel: 'aviso',
    titulo: 'rutas de módulo con carga diferida',
    doc: 'docs/architecture/module-inventory.md',
    porque: 'una ruta con `component:` arrastra la pantalla al bundle inicial, que ya tiene presupuesto de 2 MB.',
    evaluar: (archivos) =>
      archivos
        .filter((a) => a.ruta.endsWith('.routes.ts') && a.modulo)
        .flatMap((a) =>
          coincidencias(a.contenido, /^\s*component:\s*\w+/gm).map((c) => ({
            ruta: a.ruta,
            linea: c.linea,
            detalle: `ruta ansiosa (${c.texto.trim()}) — usar loadComponent/loadChildren`,
          }))
        ),
  },
];

/* ── Ejecución ────────────────────────────────────────────── */

if (flags['listar']) {
  titulo('Catálogo de reglas de gobernanza');
  for (const r of REGLAS) {
    const etiqueta = r.nivel === 'error' ? rojo('error') : amarillo('aviso');
    console.log(`\n${negrita(r.id)}  ${etiqueta}`);
    console.log(`  ${r.titulo}`);
    console.log(gris(`  por qué: ${r.porque}`));
    console.log(gris(`  norma:   governance/${r.doc}`));
  }
  console.log('');
  process.exit(0);
}

const filtro = typeof flags['regla'] === 'string' ? new Set(flags['regla'].split(',')) : null;
const activas = filtro ? REGLAS.filter((r) => filtro.has(r.id)) : REGLAS;

if (activas.length === 0) {
  console.error(`No hay reglas que coincidan con --regla=${flags['regla']}. Probá --listar.`);
  process.exit(2);
}

const archivos = indexarApp();
const hallazgos = [];

for (const regla of activas) {
  for (const h of regla.evaluar(archivos)) {
    hallazgos.push({
      regla: regla.id,
      nivel: regla.nivel,
      titulo: regla.titulo,
      doc: regla.doc,
      ...h,
      clave: `${regla.id}|${h.ruta}|${h.detalle}`,
    });
  }
}

/* Línea base: congela la deuda conocida para poder exigir "cero nuevos". */
if (flags['guardar-linea-base']) {
  // La clave omite la línea a propósito: mover código no debe convertir un
  // hallazgo congelado en uno "nuevo". El costo es que varias ocurrencias
  // idénticas dentro del mismo archivo colapsan en una sola clave.
  const claves = [...new Set(hallazgos.map((h) => h.clave))].sort();
  const contenido = {
    generado: new Date().toISOString().slice(0, 10),
    nota: 'Deuda conocida al momento de congelar. Regenerar a propósito, nunca en automático. Ver ADR-0003.',
    claves,
  };
  writeFileSync(LINEA_BASE, `${JSON.stringify(contenido, null, 2)}\n`);
  console.log(
    verde(`✓ Línea base escrita: ${claves.length} claves (${hallazgos.length} hallazgos) en governance/gobernanza.linea-base.json`)
  );
  process.exit(0);
}

let base = new Set();
const usaLineaBase = Boolean(flags['linea-base']);
if (usaLineaBase) {
  if (!existsSync(LINEA_BASE)) {
    console.error(rojo('No existe la línea base. Generala con --guardar-linea-base.'));
    process.exit(2);
  }
  base = new Set(JSON.parse(readFileSync(LINEA_BASE, 'utf8')).claves);
}

const visibles = usaLineaBase ? hallazgos.filter((h) => !base.has(h.clave)) : hallazgos;
const errores = visibles.filter((h) => h.nivel === 'error');
const avisos = visibles.filter((h) => h.nivel === 'aviso');

if (flags['json']) {
  console.log(
    JSON.stringify(
      {
        archivosAuditados: archivos.length,
        reglasEvaluadas: activas.map((r) => r.id),
        lineaBase: usaLineaBase,
        conteo: { errores: errores.length, avisos: avisos.length, congelados: hallazgos.length - visibles.length },
        hallazgos: visibles.map(({ clave, ...resto }) => resto),
      },
      null,
      2
    )
  );
  process.exit(errores.length > 0 && (flags['check'] || flags['estricto']) ? 1 : 0);
}

titulo(
  'Auditoría de gobernanza — MIS Host',
  `${archivos.length} archivos · ${activas.length} reglas${usaLineaBase ? ` · ${hallazgos.length - visibles.length} congelados en línea base` : ''}`
);

function imprimir(grupo, pintar, etiqueta) {
  const porRegla = new Map();
  for (const h of grupo) {
    if (!porRegla.has(h.regla)) porRegla.set(h.regla, []);
    porRegla.get(h.regla).push(h);
  }
  for (const [regla, lista] of porRegla) {
    const { titulo: t, doc } = lista[0];
    console.log(`\n${pintar(etiqueta)} ${negrita(regla)} — ${t} ${gris(`(${lista.length})`)}`);
    console.log(gris(`  norma: governance/${doc}`));
    for (const h of lista.slice(0, 10)) {
      console.log(`  ${h.ruta}${h.linea ? `:${h.linea}` : ''}`);
      console.log(gris(`    → ${h.detalle}`));
    }
    if (lista.length > 10) console.log(gris(`  … y ${lista.length - 10} más (usá --json para el listado completo)`));
  }
}

if (errores.length) imprimir(errores, rojo, 'ERROR');
if (avisos.length) imprimir(avisos, amarillo, 'AVISO');

console.log('');
if (errores.length === 0 && avisos.length === 0) {
  console.log(verde(`✓ Sin hallazgos${usaLineaBase ? ' nuevos' : ''}.`));
} else {
  console.log(`${errores.length ? rojo(`${errores.length} error(es)`) : verde('0 errores')} · ${avisos.length ? amarillo(`${avisos.length} aviso(s)`) : '0 avisos'}`);
}

if (errores.length > 0 && !flags['check'] && !flags['estricto']) {
  console.log(gris('\nPara que esto falle en CI: node governance/scripts/validar-gobernanza.mjs --check'));
}
console.log('');

const debeFallar =
  (errores.length > 0 && (flags['check'] || flags['estricto'] || flags['strict'])) ||
  (avisos.length > 0 && (flags['estricto'] || flags['strict']));

process.exit(debeFallar ? 1 : 0);
