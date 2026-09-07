#!/usr/bin/env node
/**
 * Generador de módulos de negocio para MIS Host (Financiera Confianza).
 *
 * Crea la estructura canónica exigida por `governance/docs/development/module-guide.md`:
 *
 *   src/app/pages/modules/<modulo>/
 *     ├── <modulo>.routes.ts
 *     ├── constantes/<modulo>.constants.ts
 *     ├── models/<modulo>.models.ts
 *     ├── utils/<modulo>.mappers.ts
 *     ├── utils/<modulo>.mappers.spec.ts
 *     ├── services/<modulo>.service.ts
 *     ├── services/<modulo>.service.spec.ts
 *     ├── ui/<modulo>-resumen-card.component.ts
 *     └── components/
 *         └── principal/
 *             ├── principal.component.ts
 *             └── principal.component.html
 *
 * Uso:
 *   node governance/scripts/crear-modulo.mjs <nombre-del-modulo> [--title "Título Legible"]
 *   Ejemplo:
 *   node governance/scripts/crear-modulo.mjs cartera-morosa --title "Cartera Morosa"
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Uso:
  node governance/scripts/crear-modulo.mjs <nombre-modulo> [opciones]

Argumentos:
  <nombre-modulo>      Nombre del módulo en kebab-case (ej. 'auditoria-riesgos')

Opciones:
  --title "<titulo>"   Título legible para la vista (ej. "Auditoría de Riesgos")
  --dry-run            Simula la creación sin escribir archivos en disco
  --help, -h           Muestra esta ayuda
`);
  process.exit(0);
}

const rawName = args[0].replace(/^--.*$/, '');
if (!rawName) {
  console.error('Error: Debes proporcionar un nombre para el módulo.');
  process.exit(1);
}

// Transformaciones de nombres
function toKebabCase(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPascalCase(str) {
  return str
    .replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase())
    .replace(/[-_]/g, '');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toConstantCase(str) {
  return str.replace(/[-]/g, '_').toUpperCase();
}

function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const kebabName = toKebabCase(rawName);
const pascalName = toPascalCase(kebabName);
const camelName = toCamelCase(kebabName);
const upperSnakeName = toConstantCase(kebabName);

let title = toTitleCase(kebabName);
const titleIdx = args.indexOf('--title');
if (titleIdx !== -1 && args[titleIdx + 1]) {
  title = args[titleIdx + 1];
}

const dryRun = args.includes('--dry-run');

const BASE_PATH = resolve(process.cwd(), 'src/app/pages/modules', kebabName);

if (existsSync(BASE_PATH)) {
  console.error(`\n✗ Error: El módulo '${kebabName}' ya existe en: \n  ${BASE_PATH}\n`);
  process.exit(1);
}

// Plantillas de archivos

const routesFile = `import { Routes } from '@angular/router';

export const ${upperSnakeName}_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then(
        (m) => m.PrincipalComponent
      ),
  },
];
`;

const constantsFile = `/**
 * Constantes y configuración de endpoints para el módulo ${title}.
 */
export const ${upperSnakeName}_CONSTANTS = {
  ENDPOINT_BASE: '/api/${kebabName}',
  COD_REP: 'REP_${upperSnakeName}',
  DEFAULT_PAGE_SIZE: 20,
} as const;
`;

const modelsFile = `/**
 * Contratos y modelos de dominio para el módulo ${title}.
 */

/** DTO que entrega el backend */
export interface ${pascalName}ItemDto {
  id: string;
  codigo: string;
  descripcion: string;
  monto: number;
  estado: string;
  fechaCorte: string;
}

/** Entidad de dominio utilizada en el frontend */
export interface ${pascalName}Item {
  id: string;
  codigo: string;
  descripcion: string;
  monto: number;
  montoFormateado: string;
  estado: string;
  fechaCorte: string;
  esActivo: boolean;
}

/** Filtros disponibles en la interfaz */
export interface ${pascalName}Filtros {
  busqueda: string;
  estado?: string;
  fechaCorte?: string;
}

/** Estado de la vista */
export interface ${pascalName}ViewState {
  items: ${pascalName}Item[];
  cargando: boolean;
  error: string | null;
  totalRegistros: number;
}
`;

const mappersFile = `import { ${pascalName}ItemDto, ${pascalName}Item } from '../models/${kebabName}.models';

/**
 * Convierte un DTO de backend en una entidad pura de dominio.
 * Función pura: sin efectos secundarios, altamente testeable.
 */
export function map${pascalName}DtoToItem(dto: ${pascalName}ItemDto): ${pascalName}Item {
  return {
    id: dto.id,
    codigo: dto.codigo,
    descripcion: dto.descripcion,
    monto: dto.monto,
    montoFormateado: new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(dto.monto),
    estado: dto.estado,
    fechaCorte: dto.fechaCorte,
    esActivo: dto.estado.toUpperCase() === 'ACTIVO',
  };
}

/**
 * Convierte una lista de DTOs en entidades de dominio.
 */
export function map${pascalName}DtoList(dtos: ${pascalName}ItemDto[]): ${pascalName}Item[] {
  if (!dtos || !Array.isArray(dtos)) return [];
  return dtos.map(map${pascalName}DtoToItem);
}
`;

const mappersSpecFile = `import { describe, it, expect } from 'vitest';
import { map${pascalName}DtoToItem, map${pascalName}DtoList } from './${kebabName}.mappers';
import { ${pascalName}ItemDto } from '../models/${kebabName}.models';

describe('${pascalName} Mappers', () => {
  const mockDto: ${pascalName}ItemDto = {
    id: '123',
    codigo: 'COD-01',
    descripcion: 'Operación de prueba',
    monto: 1500.5,
    estado: 'ACTIVO',
    fechaCorte: '2026-03-31',
  };

  it('debe mapear correctamente un DTO a entidad de dominio', () => {
    const item = map${pascalName}DtoToItem(mockDto);

    expect(item.id).toBe('123');
    expect(item.codigo).toBe('COD-01');
    expect(item.monto).toBe(1500.5);
    expect(item.esActivo).toBe(true);
    expect(item.montoFormateado).toContain('1.500');
  });

  it('debe manejar listas vacías de forma segura', () => {
    expect(map${pascalName}DtoList([])).toEqual([]);
    expect(map${pascalName}DtoList(null as unknown as ${pascalName}ItemDto[])).toEqual([]);
  });
});
`;

const serviceFile = `import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ${pascalName}Item, ${pascalName}ItemDto, ${pascalName}Filtros } from '../models/${kebabName}.models';
import { ${upperSnakeName}_CONSTANTS } from '../constantes/${kebabName}.constants';
import { map${pascalName}DtoList } from '../utils/${kebabName}.mappers';

@Injectable({
  providedIn: 'root',
})
export class ${pascalName}Service {
  private readonly http = inject(HttpClient);

  // Estado reactivo con Signals (Angular 22 Zoneless)
  private readonly _items = signal<${pascalName}Item[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly items = this._items.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  // Señales computadas
  readonly totalRegistros = computed(() => this._items().length);
  readonly totalMonto = computed(() =>
    this._items().reduce((acc, item) => acc + item.monto, 0)
  );

  /**
   * Consulta los registros desde el backend y actualiza las señales de estado.
   */
  cargarDatos(filtros?: ${pascalName}Filtros): Observable<${pascalName}Item[]> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<${pascalName}ItemDto[]>(${upperSnakeName}_CONSTANTS.ENDPOINT_BASE, {
        params: { ...filtros } as Record<string, string>,
      })
      .pipe(
        map(dtos => map${pascalName}DtoList(dtos)),
        tap(items => {
          this._items.set(items);
          this._cargando.set(false);
        }),
        catchError(err => {
          this._error.set('No se pudieron obtener los datos. Por favor, intente nuevamente.');
          this._cargando.set(false);
          return of([]);
        })
      );
  }

  /**
   * Limpia el estado del servicio.
   */
  limpiar(): void {
    this._items.set([]);
    this._error.set(null);
    this._cargando.set(false);
  }
}
`;

const serviceSpecFile = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${pascalName}Service } from './${kebabName}.service';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

describe('${pascalName}Service', () => {
  let service: ${pascalName}Service;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: () => of([]),
    };

    // Instanciación directa para pruebas unitarias limpias sin sobrecarga de TestBed
    service = new (${pascalName}Service as any)();
    (service as any).http = httpClientMock;
  });

  it('debe inicializarse con estado vacío y sin errores', () => {
    expect(service.items()).toEqual([]);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.totalRegistros()).toBe(0);
  });

  it('debe actualizar el estado cuando la llamada HTTP tiene éxito', () => {
    const mockData = [
      { id: '1', codigo: 'C1', descripcion: 'D1', monto: 100, estado: 'ACTIVO', fechaCorte: '2026-03-31' },
    ];
    httpClientMock.get = () => of(mockData);

    service.cargarDatos().subscribe(items => {
      expect(items.length).toBe(1);
      expect(service.items().length).toBe(1);
      expect(service.cargando()).toBe(false);
      expect(service.totalMonto()).toBe(100);
    });
  });

  it('debe capturar errores HTTP y reflejarlos en la señal de error', () => {
    httpClientMock.get = () => throwError(() => new Error('Error de red'));

    service.cargarDatos().subscribe(() => {
      expect(service.cargando()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.items()).toEqual([]);
    });
  });
});
`;

const uiComponentFile = `import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-${kebabName}-resumen-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: \`
    <div class="rounded-xl border border-border bg-surface-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-text-muted">{{ titulo() }}</p>
          <p class="mt-1 text-2xl font-bold text-text-primary">{{ valor() }}</p>
        </div>
        @if (icono()) {
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <i [class]="icono()" class="text-xl"></i>
          </div>
        }
      </div>
    </div>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${pascalName}ResumenCardComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly icono = input<string>();
}
`;

const principalComponentTsFile = `import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ${pascalName}Service } from '../../services/${kebabName}.service';
import { ${pascalName}ResumenCardComponent } from '../../ui/${kebabName}-resumen-card.component';

@Component({
  selector: 'app-${kebabName}-principal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    ${pascalName}ResumenCardComponent,
  ],
  templateUrl: './principal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrincipalComponent implements OnInit {
  protected readonly service = inject(${pascalName}Service);

  // Señales expuestas a la plantilla
  protected readonly items = this.service.items;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;
  protected readonly totalRegistros = this.service.totalRegistros;
  protected readonly totalMonto = this.service.totalMonto;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.cargarDatos().subscribe();
  }
}
`;

const principalComponentHtmlFile = `<div class="p-6 space-y-6">
  <!-- Encabezado -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-text-primary tracking-tight">${title}</h1>
      <p class="text-sm text-text-muted mt-1">Gestión y reportes del módulo de ${title}.</p>
    </div>
    <div class="flex items-center gap-2">
      <p-button
        label="Recargar"
        icon="pi pi-refresh"
        [loading]="cargando()"
        (onClick)="cargar()"
        severity="secondary"
      />
    </div>
  </div>

  <!-- Métricas / Tarjetas Resumen -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <app-${kebabName}-resumen-card
      titulo="Total Registros"
      [valor]="totalRegistros()"
      icono="pi pi-list"
    />
    <app-${kebabName}-resumen-card
      titulo="Monto Acumulado"
      [valor]="'S/ ' + (totalMonto() | number:'1.2-2')"
      icono="pi pi-wallet"
    />
  </div>

  <!-- Manejo de Estados: Error, Carga, Vacío y Tabla -->
  @if (error()) {
    <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-xl"></i>
        <span>{{ error() }}</span>
      </div>
      <p-button label="Reintentar" icon="pi pi-replay" size="small" severity="danger" (onClick)="cargar()" />
    </div>
  }

  @if (cargando()) {
    <div class="flex justify-center items-center py-16">
      <p-progressSpinner strokeWidth="4" />
    </div>
  } @else if (items().length === 0 && !error()) {
    <div class="rounded-xl border border-dashed border-border bg-surface-ground p-12 text-center">
      <i class="pi pi-inbox text-4xl text-text-muted mb-3"></i>
      <h3 class="text-base font-semibold text-text-primary">No se encontraron registros</h3>
      <p class="text-sm text-text-muted mt-1">No hay información disponible para mostrar con los filtros actuales.</p>
    </div>
  } @else {
    <div class="rounded-xl border border-border bg-surface-card overflow-hidden shadow-sm">
      <p-table
        [value]="items()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 25, 50]"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th class="text-right">Monto</th>
            <th>Fecha Corte</th>
            <th class="text-center">Estado</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td class="font-mono text-xs font-semibold">{{ item.codigo }}</td>
            <td>{{ item.descripcion }}</td>
            <td class="text-right font-medium">{{ item.montoFormateado }}</td>
            <td>{{ item.fechaCorte }}</td>
            <td class="text-center">
              <p-tag
                [value]="item.estado"
                [severity]="item.esActivo ? 'success' : 'secondary'"
              />
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  }
</div>
`;

// Lista de archivos a crear
const filesToCreate = [
  { path: join(BASE_PATH, `${kebabName}.routes.ts`), content: routesFile },
  { path: join(BASE_PATH, 'constantes', `${kebabName}.constants.ts`), content: constantsFile },
  { path: join(BASE_PATH, 'models', `${kebabName}.models.ts`), content: modelsFile },
  { path: join(BASE_PATH, 'utils', `${kebabName}.mappers.ts`), content: mappersFile },
  { path: join(BASE_PATH, 'utils', `${kebabName}.mappers.spec.ts`), content: mappersSpecFile },
  { path: join(BASE_PATH, 'services', `${kebabName}.service.ts`), content: serviceFile },
  { path: join(BASE_PATH, 'services', `${kebabName}.service.spec.ts`), content: serviceSpecFile },
  { path: join(BASE_PATH, 'ui', `${kebabName}-resumen-card.component.ts`), content: uiComponentFile },
  { path: join(BASE_PATH, 'components', 'principal', 'principal.component.ts'), content: principalComponentTsFile },
  { path: join(BASE_PATH, 'components', 'principal', 'principal.component.html'), content: principalComponentHtmlFile },
];

console.log(`\n======================================================`);
console.log(` Scaffold de Módulo: ${title} (${kebabName})`);
console.log(` Arquitectura Canónica: Angular 22 Zoneless (MIS Host)`);
console.log(`======================================================\n`);

if (dryRun) {
  console.log('[MODO DRY-RUN] Se generarían los siguientes archivos:\n');
  filesToCreate.forEach(f => console.log(`  + ${f.path}`));
  console.log('\nOperación completada sin cambios.');
  process.exit(0);
}

// Crear directorios y escribir archivos
filesToCreate.forEach(({ path, content }) => {
  const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content, 'utf8');
  console.log(`  ✓ Creado: ${path.replace(process.cwd(), '')}`);
});

console.log(`\n✓ ¡Módulo '${kebabName}' creado exitosamente!\n`);
console.log(`Pasos siguientes:`);
console.log(`1. Registra las rutas del módulo en 'src/app/app.routes.ts':`);
console.log(`   {`);
console.log(`     path: '${kebabName}',`);
console.log(`     loadChildren: () => import('./pages/modules/${kebabName}/${kebabName}.routes').then(m => m.${upperSnakeName}_ROUTES),`);
console.log(`   }`);
console.log(`2. Ejecuta las pruebas del nuevo módulo:`);
console.log(`   node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/${kebabName}/utils/${kebabName}.mappers.spec.ts`);
console.log(``);
