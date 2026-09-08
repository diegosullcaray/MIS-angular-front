#!/usr/bin/env node
/**
 * Generador de módulos de negocio — MIS Host (Financiera Confianza).
 *
 * Genera la estructura de `governance/docs/development/module-guide.md` con la
 * forma que realmente tiene el repo, no con una idealizada:
 *
 *   src/app/pages/modules/<modulo>/
 *     ├── <modulo>.routes.ts
 *     ├── constantes/<modulo>.constantes.ts     ← sufijo canónico (no .constants.ts)
 *     ├── models/<modulo>.model.ts              ← singular (no .models.ts)
 *     ├── utils/<modulo>.util.ts                ← .util.ts (no .mappers.ts)
 *     ├── utils/<modulo>.util.spec.ts
 *     ├── services/<modulo>.service.ts
 *     ├── services/<modulo>.service.spec.ts
 *     ├── ui/<modulo>-resumen-card/…            ← presentacional, con su plantilla
 *     └── components/principal/…                ← contenedor, con su plantilla y spec
 *
 * Transporte (`--transporte`):
 *   ant   (por defecto) el módulo consume el backend Ant vía un servicio
 *         `Mod*Service` de `core/winder/instances/`, que es como habla el 100%
 *         de los módulos existentes. La versión anterior de este script
 *         generaba `http.get('/api/<modulo>')`, un endpoint REST que no existe
 *         en este sistema: el módulo compilaba y nunca traía un dato.
 *   http  HttpClient directo, solo para APIs Host que no pasan por Winder.
 *
 * Uso:
 *   node governance/scripts/crear-modulo.mjs <nombre> [opciones]
 *
 * Opciones:
 *   --title "<título>"    título legible de la pantalla
 *   --cod-rep <código>    código de reporte del backend (ej. RS_BASE_NEG_01)
 *   --transporte=ant|http fachada de datos a generar (por defecto: ant)
 *   --registrar-ruta      además, enlaza el módulo en src/app/app.routes.ts
 *   --dry-run             muestra qué se generaría, sin escribir
 *   --force               sobrescribe un módulo existente
 *   --help, -h
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { opciones, titulo, verde, rojo, amarillo, gris, negrita } from './lib/proyecto.mjs';

const { flags, posicionales } = opciones(process.argv.slice(2), ['title', 'cod-rep', 'transporte']);

if (flags['help'] || flags['h'] || posicionales.length === 0) {
  console.log(`
${negrita('Generador de módulos — MIS Host')}

  node governance/scripts/crear-modulo.mjs <nombre-modulo> [opciones]

${negrita('Argumentos')}
  <nombre-modulo>        kebab-case, ej. 'auditoria-riesgos'

${negrita('Opciones')}
  --title "<título>"     título legible de la pantalla
  --cod-rep <código>     código de reporte del backend Ant (ej. RS_BASE_NEG_01)
  --transporte=ant|http  fachada de datos (por defecto: ant, como el resto del repo)
  --registrar-ruta       enlaza el módulo en src/app/app.routes.ts
  --dry-run              simula sin escribir
  --force                sobrescribe si el módulo ya existe

${negrita('Ejemplos')}
  node governance/scripts/crear-modulo.mjs auditoria-riesgos --title "Auditoría de Riesgos" --cod-rep RS_AUD_01
  node governance/scripts/crear-modulo.mjs auditoria-riesgos --dry-run
`);
  process.exit(flags['help'] || flags['h'] ? 0 : 1);
}

/* ── Nombres ──────────────────────────────────────────────── */

const kebab = posicionales[0]
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (!kebab) {
  console.error(rojo('El nombre del módulo no puede quedar vacío tras normalizarlo a kebab-case.'));
  process.exit(1);
}

const pascal = kebab.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase()).replace(/-/g, '');
const constante = kebab.replace(/-/g, '_').toUpperCase();
const titulo_ =
  typeof flags['title'] === 'string'
    ? flags['title']
    : kebab
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');
const codRep = typeof flags['cod-rep'] === 'string' ? flags['cod-rep'] : `RS_${constante}_01`;
const transporte = flags['transporte'] === 'http' ? 'http' : 'ant';

const BASE = resolve(process.cwd(), 'src/app/pages/modules', kebab);
const seco = Boolean(flags['dry-run']);

if (existsSync(BASE) && !flags['force'] && !seco) {
  console.error(rojo(`\n✗ El módulo '${kebab}' ya existe: ${BASE}`));
  console.error(gris('  Usá --force para sobrescribirlo o --dry-run para inspeccionar qué se generaría.\n'));
  process.exit(1);
}

/* ── Plantillas ───────────────────────────────────────────── */

const rutas = `import { Routes } from '@angular/router';

export const ${constante}_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
`;

const constantes = `/** Constantes del módulo ${titulo_}. */

/**
 * Código de reporte del backend Ant. Debe coincidir con el registrado por
 * backend: es la clave del contrato, no un identificador libre del frontend.
 */
export const COD_${constante} = '${codRep}';

/** Filas por página en la tabla principal. */
export const ${constante}_FILAS_POR_PAGINA = 20;
`;

const modelo = `/**
 * Contratos del módulo ${titulo_}.
 *
 * Se mantienen separados el payload crudo del backend y el modelo que consume
 * la pantalla: renombrar una columna en Ant no debe obligar a tocar la vista.
 */

/** Fila tal como la devuelve el backend Ant. Nombres del contrato, sin traducir. */
export interface ${pascal}FilaDto {
  readonly cod: string;
  readonly des: string;
  readonly mto: number | string | null;
  readonly est: string | null;
}

/** Cuerpo de la respuesta del strand. */
export interface ${pascal}ResponseBody {
  readonly resultado?: {
    readonly data?: ${pascal}FilaDto[];
  };
}

/** Fila ya normalizada para la vista. */
export interface ${pascal}Fila {
  readonly codigo: string;
  readonly descripcion: string;
  readonly monto: number;
  readonly montoFormateado: string;
  readonly estado: string;
  readonly activo: boolean;
}
`;

const util = `import type { ${pascal}Fila, ${pascal}FilaDto } from '../models/${kebab}.model';

/**
 * Mapeos puros del módulo ${titulo_}: sin HttpClient, sin inject(), sin señales.
 * Todo lo que decida qué ve el usuario a partir del payload vive acá, porque es
 * lo único que se puede probar sin levantar Angular.
 */

/** El backend manda montos como número o como cadena; y a veces como null. */
function aNumero(valor: number | string | null | undefined): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor !== 'string') return 0;
  const limpio = Number(valor.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(limpio) ? limpio : 0;
}

const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export function map${pascal}Fila(dto: ${pascal}FilaDto): ${pascal}Fila {
  const monto = aNumero(dto?.mto);
  const estado = (dto?.est ?? '').trim();

  return {
    codigo: dto?.cod ?? '',
    descripcion: dto?.des ?? '',
    monto,
    montoFormateado: SOLES.format(monto),
    estado,
    activo: estado.toUpperCase() === 'ACTIVO',
  };
}

/** Una respuesta sin filas es una respuesta válida vacía, no un error. */
export function map${pascal}Filas(dtos: readonly ${pascal}FilaDto[] | null | undefined): ${pascal}Fila[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(map${pascal}Fila);
}

export function total${pascal}(filas: readonly ${pascal}Fila[]): number {
  return filas.reduce((suma, fila) => suma + fila.monto, 0);
}
`;

// Sin `import … from 'vitest'`: el proyecto corre con globales
// (`types: ["vitest/globals"]` en tsconfig.spec.json) y ningún spec del repo
// los importa. Un scaffold que sí lo hiciera introduciría dos estilos.
const utilSpec = `import { map${pascal}Fila, map${pascal}Filas, total${pascal} } from './${kebab}.util';
import type { ${pascal}FilaDto } from '../models/${kebab}.model';

describe('${kebab}.util', () => {
  const dto: ${pascal}FilaDto = { cod: 'C-01', des: 'Operación de prueba', mto: 1500.5, est: 'ACTIVO' };

  it('normaliza una fila del backend', () => {
    const fila = map${pascal}Fila(dto);

    expect(fila.codigo).toBe('C-01');
    expect(fila.monto).toBe(1500.5);
    expect(fila.activo).toBe(true);
    expect(fila.montoFormateado).toContain('1');
  });

  it('acepta montos en cadena, que es como los manda parte del backend', () => {
    expect(map${pascal}Fila({ ...dto, mto: '2 300,00' as unknown as string }).monto).toBeGreaterThan(0);
    expect(map${pascal}Fila({ ...dto, mto: 'S/ 1,250.75' }).monto).toBe(1250.75);
  });

  it('trata null, undefined y campos faltantes como vacío y no como excepción', () => {
    expect(map${pascal}Filas(null)).toEqual([]);
    expect(map${pascal}Filas(undefined)).toEqual([]);
    expect(map${pascal}Filas([])).toEqual([]);

    const vacia = map${pascal}Fila({} as ${pascal}FilaDto);
    expect(vacia.monto).toBe(0);
    expect(vacia.activo).toBe(false);
  });

  it('suma los montos de las filas', () => {
    expect(total${pascal}(map${pascal}Filas([dto, { ...dto, mto: 500 }]))).toBe(2000.5);
  });
});
`;

const servicioAnt = `import { Injectable, computed, inject, signal } from '@angular/core';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_${constante} } from '../constantes/${kebab}.constantes';
import type { ${pascal}Fila, ${pascal}ResponseBody } from '../models/${kebab}.model';
import { map${pascal}Filas, total${pascal} } from '../utils/${kebab}.util';

/**
 * Fachada de datos de ${titulo_}.
 *
 * Habla con el backend Ant a través de \`ModReportesService\` (transporte
 * Winder), no con un endpoint REST: es el borde que el resto del sistema usa.
 * Si este módulo consumiera una API Host directa, habría que inyectar
 * HttpClient — y documentar a qué frontera pertenece, según
 * governance/docs/architecture/data-flow.md.
 */
@Injectable({ providedIn: 'root' })
export class ${pascal}Service {
  private readonly ant = inject(ModReportesService);

  private readonly _filas = signal<${pascal}Fila[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filas = this._filas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalRegistros = computed(() => this._filas().length);
  readonly totalMonto = computed(() => total${pascal}(this._filas()));
  /** Vacío verdadero: respondió bien y no hay filas. Distinto de un error. */
  readonly vacio = computed(() => !this._cargando() && !this._error() && this._filas().length === 0);

  consultar(parametros: Record<string, unknown> = {}): void {
    this._cargando.set(true);
    this._error.set(null);

    this.ant.getRegularTableResult(COD_${constante}, parametros).subscribe({
      next: (respuesta) => {
        const cuerpo = respuesta.body as ${pascal}ResponseBody | null;
        this._filas.set(map${pascal}Filas(cuerpo?.resultado?.data));
        this._cargando.set(false);
      },
      // El error NO se convierte en tabla vacía: confundirlos es el bug que
      // degradó al sistema legado (ver reports/performance/legacy-comparison).
      error: () => {
        this._filas.set([]);
        this._error.set('No se pudo obtener la información. Reintentá en unos segundos.');
        this._cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this._filas.set([]);
    this._cargando.set(false);
    this._error.set(null);
  }
}
`;

const servicioHttp = `import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ${pascal}Fila, ${pascal}FilaDto } from '../models/${kebab}.model';
import { map${pascal}Filas, total${pascal} } from '../utils/${kebab}.util';

/**
 * Fachada de datos de ${titulo_} contra una API Host (no Winder).
 *
 * Las peticiones Host reciben \`Authorization\` y \`X-User-Role\` del
 * interceptor. Documentá el endpoint como contrato antes de usarlo en
 * producción: governance/docs/architecture/api-contracts/README.md.
 */
@Injectable({ providedIn: 'root' })
export class ${pascal}Service {
  private readonly http = inject(HttpClient);

  private readonly _filas = signal<${pascal}Fila[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filas = this._filas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalRegistros = computed(() => this._filas().length);
  readonly totalMonto = computed(() => total${pascal}(this._filas()));
  readonly vacio = computed(() => !this._cargando() && !this._error() && this._filas().length === 0);

  consultar(parametros: Record<string, string> = {}): void {
    this._cargando.set(true);
    this._error.set(null);

    this.http.get<${pascal}FilaDto[]>('/api/${kebab}', { params: parametros }).subscribe({
      next: (dtos) => {
        this._filas.set(map${pascal}Filas(dtos));
        this._cargando.set(false);
      },
      error: () => {
        this._filas.set([]);
        this._error.set('No se pudo obtener la información. Reintentá en unos segundos.');
        this._cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this._filas.set([]);
    this._cargando.set(false);
    this._error.set(null);
  }
}
`;

const servicioSpecAnt = `import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ${pascal}Service } from './${kebab}.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_${constante} } from '../constantes/${kebab}.constantes';

/**
 * El servicio usa \`inject()\` en un campo, así que necesita contexto de
 * inyección: se arma con TestBed y se dobla el borde Ant. Es el mismo patrón
 * que el resto de los specs de servicio del repo.
 */
function crear(respuesta: unknown, falla = false) {
  const getRegularTableResult = vi.fn(() =>
    falla ? throwError(() => new Error('backend caído')) : of(respuesta)
  );

  TestBed.configureTestingModule({
    providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }],
  });

  return { service: TestBed.inject(${pascal}Service), getRegularTableResult };
}

describe('${pascal}Service', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const filaOk = { cod: 'C-01', des: 'Prueba', mto: 100, est: 'ACTIVO' };

  it('arranca sin datos, sin carga y sin error', () => {
    const { service } = crear({ body: null });

    expect(service.filas()).toEqual([]);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('publica las filas y apaga la carga cuando el backend responde', () => {
    const { service } = crear({ body: { resultado: { data: [filaOk] } } });

    service.consultar();

    expect(service.filas()).toHaveLength(1);
    expect(service.totalMonto()).toBe(100);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('distingue respuesta vacía de error', () => {
    const { service } = crear({ body: { resultado: { data: [] } } });

    service.consultar();

    expect(service.vacio()).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('publica el error sin disfrazarlo de tabla vacía', () => {
    const { service } = crear(null, true);

    service.consultar();

    expect(service.error()).toBeTruthy();
    expect(service.vacio()).toBe(false);
    expect(service.cargando()).toBe(false);
  });

  it('consulta el cod_rep declarado en constantes', () => {
    const { service, getRegularTableResult } = crear({ body: { resultado: { data: [] } } });

    service.consultar({ nom: 'x' });

    expect(getRegularTableResult).toHaveBeenCalledWith(COD_${constante}, { nom: 'x' });
  });
});
`;

const cardTs = `import { Component, input } from '@angular/core';

/** Tarjeta métrica del módulo ${titulo_}. Presentacional: no inyecta servicios. */
@Component({
  selector: 'app-${kebab}-resumen-card',
  standalone: true,
  templateUrl: './${kebab}-resumen-card.component.html',
})
export class ${pascal}ResumenCardComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>();
}
`;

const cardHtml = `<div
  class="rounded-xl border p-4"
  style="background: var(--mis-surface); border-color: var(--mis-border)"
>
  <p class="m-0 text-[13px]" style="color: var(--mis-text-secondary)">{{ titulo() }}</p>
  <p class="m-0 mt-1 text-[22px] font-semibold" style="color: var(--mis-text-primary)">{{ valor() }}</p>
  @if (detalle()) {
    <p class="m-0 mt-1 text-[12px]" style="color: var(--mis-text-tertiary)">{{ detalle() }}</p>
  }
</div>
`;

const principalTs = `import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { ${pascal}ResumenCardComponent } from '../../ui/${kebab}-resumen-card/${kebab}-resumen-card.component';
import { ${pascal}Service } from '../../services/${kebab}.service';
import { ${constante}_FILAS_POR_PAGINA } from '../../constantes/${kebab}.constantes';

/** Pantalla principal de ${titulo_}. Contenedor: orquesta el servicio y los estados. */
@Component({
  selector: 'app-${kebab}-principal',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    EmptyStateComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    ${pascal}ResumenCardComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly service = inject(${pascal}Service);

  protected readonly filas = this.service.filas;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;
  protected readonly vacio = this.service.vacio;
  protected readonly totalRegistros = this.service.totalRegistros;
  protected readonly totalMonto = this.service.totalMonto;
  protected readonly filasPorPagina = ${constante}_FILAS_POR_PAGINA;

  ngOnInit(): void {
    this.consultar();
  }

  ngOnDestroy(): void {
    this.service.limpiar();
  }

  protected consultar(): void {
    this.service.consultar();
  }
}
`;

const principalHtml = `<div class="flex flex-col gap-6 p-6">
  <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="m-0 text-[22px] font-semibold" style="color: var(--mis-text-primary)">${titulo_}</h1>
      <p class="m-0 mt-1 text-[13px]" style="color: var(--mis-text-secondary)">
        Consulta del módulo ${titulo_}.
      </p>
    </div>
    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [loading]="cargando()" (onClick)="consultar()" />
  </header>

  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <app-${kebab}-resumen-card titulo="Registros" [valor]="totalRegistros()" />
    <app-${kebab}-resumen-card titulo="Monto acumulado" [valor]="totalMonto()" detalle="Suma de las filas visibles" />
  </section>

  <!--
    Los cuatro estados, excluyentes entre sí y en este orden: el error gana
    sobre el vacío, porque una consulta fallida no es "no hay datos".
  -->
  @if (error()) {
    <app-inline-error [detalle]="error()!" (reintentar)="consultar()" />
  } @else if (cargando()) {
    <app-list-skeleton />
  } @else if (vacio()) {
    <app-empty-state
      titulo="Sin resultados"
      descripcion="No hay información para la fecha de corte y los filtros actuales."
    />
  } @else {
    <div class="overflow-hidden rounded-xl border" style="border-color: var(--mis-border)">
      <p-table [value]="filas()" [paginator]="true" [rows]="filasPorPagina" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th class="text-right">Monto</th>
            <th class="text-center">Estado</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-fila>
          <tr>
            <td class="font-mono text-xs">{{ fila.codigo }}</td>
            <td>{{ fila.descripcion }}</td>
            <td class="text-right tabular-nums">{{ fila.montoFormateado }}</td>
            <td class="text-center">
              <p-tag [value]="fila.estado" [severity]="fila.activo ? 'success' : 'secondary'" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  }
</div>
`;

const principalSpec = `import { TestBed } from '@angular/core/testing';
import { PrincipalComponent } from './principal.component';
import { ${pascal}Service } from '../../services/${kebab}.service';

describe('PrincipalComponent (${titulo_})', () => {
  function montar(estado: Partial<Record<'cargando' | 'error' | 'vacio', unknown>> = {}) {
    const consultar = vi.fn();
    const limpiar = vi.fn();
    const doble = {
      consultar,
      limpiar,
      filas: () => [],
      cargando: () => estado.cargando ?? false,
      error: () => estado.error ?? null,
      vacio: () => estado.vacio ?? true,
      totalRegistros: () => 0,
      totalMonto: () => 0,
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [{ provide: ${pascal}Service, useValue: doble }],
    });

    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return { fixture, consultar, limpiar };
  }

  it('consulta al iniciar', () => {
    const { consultar } = montar();
    expect(consultar).toHaveBeenCalledOnce();
  });

  it('muestra el error con acción de reintento y no el estado vacío', () => {
    const { fixture } = montar({ error: 'Backend caído', vacio: false });
    const html = fixture.nativeElement.textContent as string;

    expect(html).toContain('Backend caído');
    expect(html).not.toContain('Sin resultados');
  });

  it('limpia el estado del servicio al destruirse', () => {
    const { fixture, limpiar } = montar();
    fixture.destroy();
    expect(limpiar).toHaveBeenCalledOnce();
  });
});
`;

/* ── Escritura ────────────────────────────────────────────── */

const archivos = [
  [`${kebab}.routes.ts`, rutas],
  [`constantes/${kebab}.constantes.ts`, constantes],
  [`models/${kebab}.model.ts`, modelo],
  [`utils/${kebab}.util.ts`, util],
  [`utils/${kebab}.util.spec.ts`, utilSpec],
  [`services/${kebab}.service.ts`, transporte === 'ant' ? servicioAnt : servicioHttp],
  [`services/${kebab}.service.spec.ts`, servicioSpecAnt],
  [`ui/${kebab}-resumen-card/${kebab}-resumen-card.component.ts`, cardTs],
  [`ui/${kebab}-resumen-card/${kebab}-resumen-card.component.html`, cardHtml],
  ['components/principal/principal.component.ts', principalTs],
  ['components/principal/principal.component.html', principalHtml],
  ['components/principal/principal.component.spec.ts', principalSpec],
];

titulo(`Módulo ${titulo_} (${kebab})`, `transporte: ${transporte} · cod_rep: ${codRep}${seco ? ' · DRY-RUN' : ''}`);

for (const [relativa] of archivos) {
  console.log(`  ${seco ? gris('+') : verde('✓')} src/app/pages/modules/${kebab}/${relativa}`);
  if (seco) continue;
  const destino = join(BASE, relativa);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, archivos.find(([r]) => r === relativa)[1], 'utf8');
}

/* Registro de la ruta en app.routes.ts. */
const rutaApp = resolve(process.cwd(), 'src/app/app.routes.ts');
const bloqueRuta = `      {
        path: '${kebab}',
        loadChildren: () =>
          import('./pages/modules/${kebab}/${kebab}.routes').then((m) => m.${constante}_ROUTES)
      },`;

if (flags['registrar-ruta'] && !seco) {
  const fuente = readFileSync(rutaApp, 'utf8');
  if (fuente.includes(`modules/${kebab}/${kebab}.routes`)) {
    console.log(amarillo(`\n  ! La ruta '${kebab}' ya estaba registrada en app.routes.ts — no se tocó.`));
  } else {
    // Se inserta antes del comodín de ruta desconocida, para no quedar detrás de él.
    const marca = fuente.match(/^\s*\{\s*\n\s*path: '\*\*'/m);
    if (marca) {
      const corte = fuente.indexOf(marca[0]);
      writeFileSync(rutaApp, `${fuente.slice(0, corte)}${bloqueRuta}\n${fuente.slice(corte)}`, 'utf8');
      console.log(verde(`\n  ✓ Ruta '/app/${kebab}' registrada en src/app/app.routes.ts`));
    } else {
      console.log(amarillo('\n  ! No se encontró la ruta comodín en app.routes.ts; registrala a mano.'));
    }
  }
}

/* ── Siguientes pasos ─────────────────────────────────────── */

console.log('');
if (seco) {
  console.log(gris('Dry-run: no se escribió nada.\n'));
  process.exit(0);
}

console.log(negrita('Siguientes pasos'));
if (!flags['registrar-ruta']) {
  console.log(`
  1. Registrá la ruta en src/app/app.routes.ts (o volvé a correr con --registrar-ruta):

${gris(bloqueRuta)}
`);
}
console.log(`  ${flags['registrar-ruta'] ? '1' : '2'}. Confirmá el contrato del backend: COD_${constante} = '${codRep}'`);
console.log(`     y ajustá ${pascal}FilaDto a las columnas reales del strand.`);
console.log(`  ${flags['registrar-ruta'] ? '2' : '3'}. Probá el módulo:`);
console.log(gris(`     npm run test:runner unit src/app/pages/modules/${kebab}`));
console.log(`  ${flags['registrar-ruta'] ? '3' : '4'}. Auditá arquitectura y documentación:`);
console.log(gris('     npm run verify'));
console.log(`  ${flags['registrar-ruta'] ? '4' : '5'}. Completá la ficha de reporte si aplica:`);
console.log(gris('     governance/docs/features/report-spec-template.md\n'));
