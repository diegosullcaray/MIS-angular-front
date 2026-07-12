import type {
  CatalogoItem,
  CatalogoMeta,
} from '../../pages/modules/catalogos/models/catalogo.model';
import type {
  Rol,
  Usuario,
} from '../../pages/modules/accesos/models/acceso.model';
import type {
  PermisoRolSistema,
  Seccion,
  Sistema,
} from '../../pages/modules/sistemas/models/sistema.model';

/**
 * Base de datos en memoria de la Fake API.
 *
 * Simula la persistencia del backend real descrito en 04_BACKEND_SCHEMA.md.
 * Los datos viven mientras la aplicación esté cargada (se reinician al refrescar).
 * Cuando el backend real esté disponible, basta con quitar el `fakeApiInterceptor`
 * de `app.config.ts` — los servicios ya consumen los endpoints reales.
 */

// ─── Credenciales demo (solo Fake API — nunca enviar al cliente) ──────────────

export interface CredencialDemo {
  email: string;
  password: string;
  usuarioId: string;
}

export const FAKE_CREDENCIALES: CredencialDemo[] = [
  { email: 'admin@confianza.pe',      password: 'admin123',      usuarioId: 'usr-001' },
  { email: 'general@confianza.pe',    password: 'general123',    usuarioId: 'usr-002' },
  { email: 'supervisor@confianza.pe', password: 'supervisor123', usuarioId: 'usr-003' },
];

// ─── Seeds ─────────────────────────────────────────────────────────────────────

const SEED_ROLES: Rol[] = [
  {
    id: 'rol-001',
    nombre: 'Administrador del Sistema',
    slug: 'admin-sistema',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh', 'subsistema-ventas', 'subsistema-logistica'],
  },
  {
    id: 'rol-002',
    nombre: 'Administrador General',
    slug: 'admin-general',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
  },
  {
    id: 'rol-003',
    nombre: 'Supervisor de Área',
    slug: 'supervisor-area',
    subsistemas: ['subsistema-rrhh'],
  },
];

const SEED_USUARIOS: Usuario[] = [
  {
    id: 'usr-001',
    nombre: 'Diego Sullcaray',
    email: 'admin@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh', 'subsistema-ventas'],
    activo: true,
    creadoEn: '2026-01-15T00:00:00Z',
  },
  {
    id: 'usr-002',
    nombre: 'Ana García',
    email: 'general@confianza.pe',
    rol: 'admin-general',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
    activo: true,
    creadoEn: '2026-02-20T00:00:00Z',
  },
  {
    id: 'usr-003',
    nombre: 'Carlos Mendoza',
    email: 'supervisor@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: ['subsistema-rrhh'],
    activo: true,
    creadoEn: '2026-03-10T00:00:00Z',
  },
  {
    id: 'usr-004',
    nombre: 'Laura Torres',
    email: 'laura.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: ['subsistema-contabilidad'],
    activo: false,
    creadoEn: '2026-04-05T00:00:00Z',
  },
];

const SEED_CATALOGOS: CatalogoMeta[] = [
  { id: 'cat-001', tipo: 'bancos',        nombre: 'Catálogo de Bancos',        totalRegistros: 0, activo: true,  ultimaActualizacion: '2026-07-08T14:30:00Z' },
  { id: 'cat-002', tipo: 'monedas',       nombre: 'Catálogo de Monedas',       totalRegistros: 0, activo: true,  ultimaActualizacion: '2026-07-01T10:00:00Z' },
  { id: 'cat-003', tipo: 'departamentos', nombre: 'Catálogo de Departamentos', totalRegistros: 0, activo: true,  ultimaActualizacion: '2026-06-15T08:00:00Z' },
  { id: 'cat-004', tipo: 'tipos-doc',     nombre: 'Tipos de Documento',        totalRegistros: 0, activo: true,  ultimaActualizacion: '2026-06-20T09:00:00Z' },
  { id: 'cat-005', tipo: 'estados',       nombre: 'Estados de Operación',      totalRegistros: 0, activo: false, ultimaActualizacion: '2026-05-30T11:00:00Z' },
];

const SEED_ITEMS: Record<string, CatalogoItem[]> = {
  bancos: [
    { id: 'ban-001', codigo: 'BCP',  descripcion: 'Banco de Crédito del Perú', activo: true },
    { id: 'ban-002', codigo: 'BBVA', descripcion: 'BBVA Perú',                 activo: true },
    { id: 'ban-003', codigo: 'IBK',  descripcion: 'Interbank',                 activo: true },
    { id: 'ban-004', codigo: 'SCO',  descripcion: 'Scotiabank Perú',           activo: true },
    { id: 'ban-005', codigo: 'BAN',  descripcion: 'BANBIF',                    activo: false },
  ],
  monedas: [
    { id: 'mon-001', codigo: 'PEN', descripcion: 'Sol Peruano',     activo: true },
    { id: 'mon-002', codigo: 'USD', descripcion: 'Dólar Americano', activo: true },
    { id: 'mon-003', codigo: 'EUR', descripcion: 'Euro',            activo: true },
  ],
  departamentos: [
    { id: 'dep-001', codigo: 'LIM', descripcion: 'Lima',        activo: true },
    { id: 'dep-002', codigo: 'ARE', descripcion: 'Arequipa',    activo: true },
    { id: 'dep-003', codigo: 'TRU', descripcion: 'La Libertad', activo: true },
    { id: 'dep-004', codigo: 'CUS', descripcion: 'Cusco',       activo: true },
    { id: 'dep-005', codigo: 'PIU', descripcion: 'Piura',       activo: true },
  ],
  'tipos-doc': [
    { id: 'doc-001', codigo: 'DNI', descripcion: 'Documento Nacional de Identidad', activo: true },
    { id: 'doc-002', codigo: 'CE',  descripcion: 'Carné de Extranjería',            activo: true },
    { id: 'doc-003', codigo: 'RUC', descripcion: 'Registro Único de Contribuyente', activo: true },
    { id: 'doc-004', codigo: 'PAS', descripcion: 'Pasaporte',                       activo: true },
  ],
  estados: [
    { id: 'est-001', codigo: 'PEN', descripcion: 'Pendiente', activo: true },
    { id: 'est-002', codigo: 'APR', descripcion: 'Aprobado',  activo: true },
    { id: 'est-003', codigo: 'REC', descripcion: 'Rechazado', activo: true },
    { id: 'est-004', codigo: 'ANU', descripcion: 'Anulado',   activo: false },
  ],
};

// ─── Sistemas registrados (Remotes) con su estructura jerárquica ──────────────
// Sistema → Secciones → Subsecciones → Módulos

const estructuraContabilidad: Seccion[] = [
  {
    id: 'sec-cont-01', nombre: 'Contabilidad General', slug: 'contabilidad-general',
    subsecciones: [
      {
        id: 'sub-cont-01', nombre: 'Libros Contables', slug: 'libros-contables',
        modulos: [
          { id: 'mod-cont-001', nombre: 'Libro Diario',            slug: 'libro-diario',            activo: true },
          { id: 'mod-cont-002', nombre: 'Libro Mayor',             slug: 'libro-mayor',             activo: true },
          { id: 'mod-cont-003', nombre: 'Balance de Comprobación', slug: 'balance-comprobacion',    activo: true },
        ],
      },
      {
        id: 'sub-cont-02', nombre: 'Plan de Cuentas', slug: 'plan-de-cuentas',
        modulos: [
          { id: 'mod-cont-004', nombre: 'Cuentas Contables',  slug: 'cuentas-contables', activo: true },
          { id: 'mod-cont-005', nombre: 'Centros de Costo',   slug: 'centros-de-costo',  activo: true },
        ],
      },
    ],
  },
  {
    id: 'sec-cont-02', nombre: 'Tesorería', slug: 'tesoreria',
    subsecciones: [
      {
        id: 'sub-cont-03', nombre: 'Pagos', slug: 'pagos',
        modulos: [
          { id: 'mod-cont-006', nombre: 'Órdenes de Pago',        slug: 'ordenes-de-pago',       activo: true },
          { id: 'mod-cont-007', nombre: 'Conciliación Bancaria',  slug: 'conciliacion-bancaria', activo: true },
        ],
      },
    ],
  },
  {
    id: 'sec-cont-03', nombre: 'Reportes', slug: 'reportes',
    subsecciones: [
      {
        id: 'sub-cont-04', nombre: 'Financieros', slug: 'financieros',
        modulos: [
          { id: 'mod-cont-008', nombre: 'Estados Financieros',  slug: 'estados-financieros', activo: true },
          { id: 'mod-cont-009', nombre: 'Análisis de Gestión',  slug: 'analisis-gestion',    activo: false },
        ],
      },
    ],
  },
];

const estructuraRrhh: Seccion[] = [
  {
    id: 'sec-rrhh-01', nombre: 'Personal', slug: 'personal',
    subsecciones: [
      {
        id: 'sub-rrhh-01', nombre: 'Legajos', slug: 'legajos',
        modulos: [
          { id: 'mod-rrhh-001', nombre: 'Empleados', slug: 'empleados', activo: true },
          { id: 'mod-rrhh-002', nombre: 'Contratos', slug: 'contratos', activo: true },
        ],
      },
      {
        id: 'sub-rrhh-02', nombre: 'Asistencia', slug: 'asistencia',
        modulos: [
          { id: 'mod-rrhh-003', nombre: 'Marcaciones', slug: 'marcaciones', activo: true },
          { id: 'mod-rrhh-004', nombre: 'Vacaciones',  slug: 'vacaciones',  activo: true },
        ],
      },
    ],
  },
  {
    id: 'sec-rrhh-02', nombre: 'Planillas', slug: 'planillas',
    subsecciones: [
      {
        id: 'sub-rrhh-03', nombre: 'Remuneraciones', slug: 'remuneraciones',
        modulos: [
          { id: 'mod-rrhh-005', nombre: 'Cálculo de Planilla', slug: 'calculo-planilla', activo: true },
          { id: 'mod-rrhh-006', nombre: 'Boletas de Pago',     slug: 'boletas-pago',     activo: true },
        ],
      },
      {
        id: 'sub-rrhh-04', nombre: 'Beneficios', slug: 'beneficios',
        modulos: [
          { id: 'mod-rrhh-007', nombre: 'CTS',            slug: 'cts',            activo: true },
          { id: 'mod-rrhh-008', nombre: 'Gratificaciones', slug: 'gratificaciones', activo: true },
        ],
      },
    ],
  },
];

const estructuraVentas: Seccion[] = [
  {
    id: 'sec-vent-01', nombre: 'Comercial', slug: 'comercial',
    subsecciones: [
      {
        id: 'sub-vent-01', nombre: 'Clientes', slug: 'clientes',
        modulos: [
          { id: 'mod-vent-001', nombre: 'Cartera de Clientes', slug: 'cartera-clientes', activo: true },
          { id: 'mod-vent-002', nombre: 'Prospectos',          slug: 'prospectos',       activo: true },
        ],
      },
      {
        id: 'sub-vent-02', nombre: 'Operaciones de Venta', slug: 'operaciones-venta',
        modulos: [
          { id: 'mod-vent-003', nombre: 'Cotizaciones', slug: 'cotizaciones', activo: true },
          { id: 'mod-vent-004', nombre: 'Pedidos',      slug: 'pedidos',      activo: true },
          { id: 'mod-vent-005', nombre: 'Facturación',  slug: 'facturacion',  activo: true },
        ],
      },
    ],
  },
];

const estructuraLogistica: Seccion[] = [
  {
    id: 'sec-logi-01', nombre: 'Almacén', slug: 'almacen',
    subsecciones: [
      {
        id: 'sub-logi-01', nombre: 'Inventario', slug: 'inventario',
        modulos: [
          { id: 'mod-logi-001', nombre: 'Stock',  slug: 'stock',  activo: true },
          { id: 'mod-logi-002', nombre: 'Kardex', slug: 'kardex', activo: true },
        ],
      },
    ],
  },
  {
    id: 'sec-logi-02', nombre: 'Compras', slug: 'compras',
    subsecciones: [
      {
        id: 'sub-logi-02', nombre: 'Adquisiciones', slug: 'adquisiciones',
        modulos: [
          { id: 'mod-logi-003', nombre: 'Órdenes de Compra', slug: 'ordenes-compra', activo: true },
          { id: 'mod-logi-004', nombre: 'Proveedores',       slug: 'proveedores',    activo: true },
        ],
      },
    ],
  },
];

const SEED_SISTEMAS: Sistema[] = [
  {
    id: 'sis-001', nombre: 'Contabilidad', slug: 'subsistema-contabilidad',
    descripcion: 'Gestión contable, tesorería y reportes financieros de la organización.',
    icono: 'pi pi-chart-bar', url: 'http://localhost:4201/remoteEntry.json',
    version: '1.4.2', estado: 'activo', secciones: estructuraContabilidad,
    creadoEn: '2026-02-01T00:00:00Z', actualizadoEn: '2026-07-01T00:00:00Z',
  },
  {
    id: 'sis-002', nombre: 'RRHH', slug: 'subsistema-rrhh',
    descripcion: 'Administración de personal, asistencia, planillas y beneficios.',
    icono: 'pi pi-users', url: 'http://localhost:4202/remoteEntry.json',
    version: '2.1.0', estado: 'activo', secciones: estructuraRrhh,
    creadoEn: '2026-02-15T00:00:00Z', actualizadoEn: '2026-06-20T00:00:00Z',
  },
  {
    id: 'sis-003', nombre: 'Ventas', slug: 'subsistema-ventas',
    descripcion: 'Gestión comercial: clientes, cotizaciones, pedidos y facturación.',
    icono: 'pi pi-chart-line', url: 'http://localhost:4203/remoteEntry.json',
    version: '1.0.5', estado: 'mantenimiento', secciones: estructuraVentas,
    creadoEn: '2026-04-10T00:00:00Z', actualizadoEn: '2026-07-05T00:00:00Z',
  },
  {
    id: 'sis-004', nombre: 'Logística', slug: 'subsistema-logistica',
    descripcion: 'Control de almacenes, inventarios y compras.',
    icono: 'pi pi-truck', url: 'http://localhost:4204/remoteEntry.json',
    version: '0.9.0', estado: 'inactivo', secciones: estructuraLogistica,
    creadoEn: '2026-05-20T00:00:00Z', actualizadoEn: '2026-06-01T00:00:00Z',
  },
];

/** Todos los IDs de módulos de un sistema (para seeds de permisos). */
const modulosDe = (s: Sistema): string[] =>
  s.secciones.flatMap(sec => sec.subsecciones.flatMap(sub => sub.modulos.map(m => m.id)));

const SEED_PERMISOS: PermisoRolSistema[] = [
  // admin-sistema: acceso total a todos los sistemas
  ...SEED_SISTEMAS.map(s => ({ rolId: 'rol-001', sistemaId: s.id, modulos: modulosDe(s) })),
  // admin-general: todo Contabilidad y RRHH
  { rolId: 'rol-002', sistemaId: 'sis-001', modulos: modulosDe(SEED_SISTEMAS[0]) },
  { rolId: 'rol-002', sistemaId: 'sis-002', modulos: modulosDe(SEED_SISTEMAS[1]) },
  // supervisor-area: solo módulos operativos de RRHH
  { rolId: 'rol-003', sistemaId: 'sis-002', modulos: ['mod-rrhh-001', 'mod-rrhh-003', 'mod-rrhh-004'] },
];

// ─── Estado mutable de la "base de datos" ──────────────────────────────────────

/** Clonado profundo simple para que los seeds no se muten por referencia. */
const clone = <T>(v: T): T => structuredClone(v);

export class FakeDb {
  readonly roles: Rol[] = clone(SEED_ROLES);
  readonly usuarios: Usuario[] = clone(SEED_USUARIOS);
  readonly catalogos: CatalogoMeta[] = clone(SEED_CATALOGOS);
  readonly items: Record<string, CatalogoItem[]> = clone(SEED_ITEMS);
  readonly sistemas: Sistema[] = clone(SEED_SISTEMAS);
  readonly permisos: PermisoRolSistema[] = clone(SEED_PERMISOS);

  private secuencia = 100;

  constructor() {
    // totalRegistros siempre derivado de los ítems reales
    this.sincronizarTotales();
  }

  nextId(prefijo: string): string {
    return `${prefijo}-${++this.secuencia}`;
  }

  sincronizarTotales(): void {
    for (const meta of this.catalogos) {
      meta.totalRegistros = (this.items[meta.tipo] ?? []).length;
    }
  }

  tocarCatalogo(tipo: string): void {
    const meta = this.catalogos.find(c => c.tipo === tipo);
    if (meta) {
      meta.ultimaActualizacion = new Date().toISOString();
      meta.totalRegistros = (this.items[tipo] ?? []).length;
    }
  }
}

/** Instancia única de la BD en memoria para toda la sesión del navegador. */
export const fakeDb = new FakeDb();
