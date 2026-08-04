/**
 * STG (Ant) guarda en `icon_sec` nombres de ligature de Material Icons
 * (ej. "assessment", "people_alt", "monetization_on") — ver
 * stg-app-mis-r22/src/app/pages/full-pages/layout/services/navigation.service.ts.
 *
 * PrimeIcons no tiene un catálogo equivalente, así que no existe un mapeo 1:1.
 * Esta tabla cubre los nombres de Material Icons más usados en menús de
 * administración/back-office (los módulos de STG son de este tipo: comercial,
 * contable, cartera, incentivos, reportes, usabilidad) con el ícono de
 * PrimeIcons más parecido semánticamente. Los nombres no cubiertos caen al
 * fallback ('pi pi-th-large', el mismo genérico que ya usa el resto del
 * sidebar para remotes sin ícono propio).
 */
const MATERIAL_TO_PRIMEICONS: Record<string, string> = {
  // Navegación / generales
  dashboard: 'pi pi-th-large',
  dashboard_customize: 'pi pi-objects-column',
  home: 'pi pi-home',
  apps: 'pi pi-th-large',
  widgets: 'pi pi-th-large',
  grid_view: 'pi pi-th-large',
  view_module: 'pi pi-th-large',
  menu: 'pi pi-bars',
  more_vert: 'pi pi-ellipsis-v',
  more_horiz: 'pi pi-ellipsis-h',

  // Personas / usuarios
  person: 'pi pi-user',
  person_add: 'pi pi-user-plus',
  people: 'pi pi-users',
  people_alt: 'pi pi-users',
  group: 'pi pi-users',
  groups: 'pi pi-users',
  supervisor_account: 'pi pi-users',
  supervised_user_circle: 'pi pi-users',
  account_circle: 'pi pi-user',
  manage_accounts: 'pi pi-user-edit',
  admin_panel_settings: 'pi pi-shield',
  badge: 'pi pi-id-card',
  contact_page: 'pi pi-id-card',
  verified_user: 'pi pi-verified',
  policy: 'pi pi-shield',
  gavel: 'pi pi-hammer',

  // Reportes / analítica (comercial, cartera, incentivos)
  assessment: 'pi pi-chart-bar',
  bar_chart: 'pi pi-chart-bar',
  insert_chart: 'pi pi-chart-bar',
  show_chart: 'pi pi-chart-line',
  trending_up: 'pi pi-chart-line',
  pie_chart: 'pi pi-chart-pie',
  donut_large: 'pi pi-chart-pie',
  equalizer: 'pi pi-sliders-h',
  table_chart: 'pi pi-table',
  table_view: 'pi pi-table',
  leaderboard: 'pi pi-chart-bar',
  timeline: 'pi pi-history',
  history: 'pi pi-history',

  // Finanzas (contable, cartera, incentivos)
  monetization_on: 'pi pi-money-bill',
  attach_money: 'pi pi-dollar',
  payments: 'pi pi-wallet',
  account_balance: 'pi pi-building-columns',
  credit_card: 'pi pi-credit-card',
  savings: 'pi pi-wallet',
  point_of_sale: 'pi pi-shop',
  local_atm: 'pi pi-money-bill',
  request_quote: 'pi pi-receipt',
  receipt: 'pi pi-receipt',
  receipt_long: 'pi pi-receipt',

  // Documentos / archivos
  description: 'pi pi-file',
  article: 'pi pi-file',
  insert_drive_file: 'pi pi-file',
  folder: 'pi pi-folder',
  folder_open: 'pi pi-folder-open',
  picture_as_pdf: 'pi pi-file-pdf',
  assignment: 'pi pi-file-edit',
  assignment_turned_in: 'pi pi-file-check',
  fact_check: 'pi pi-file-check',
  list: 'pi pi-list',
  view_list: 'pi pi-list',

  // Comercio / operaciones
  business: 'pi pi-building',
  domain: 'pi pi-building',
  store: 'pi pi-shop',
  storefront: 'pi pi-shop',
  shopping_cart: 'pi pi-shopping-cart',
  inventory: 'pi pi-box',
  inventory_2: 'pi pi-box',
  warehouse: 'pi pi-warehouse',
  local_shipping: 'pi pi-truck',
  work: 'pi pi-briefcase',

  // Comunicación / soporte
  mail: 'pi pi-envelope',
  email: 'pi pi-envelope',
  chat: 'pi pi-comments',
  comment: 'pi pi-comment',
  notifications: 'pi pi-bell',
  notifications_active: 'pi pi-bell',
  help: 'pi pi-question-circle',
  help_outline: 'pi pi-question-circle',
  info: 'pi pi-info-circle',
  warning: 'pi pi-exclamation-triangle',
  error: 'pi pi-times-circle',
  check_circle: 'pi pi-check-circle',

  // Sistema / configuración
  settings: 'pi pi-cog',
  settings_applications: 'pi pi-cog',
  build: 'pi pi-wrench',
  security: 'pi pi-shield',
  lock: 'pi pi-lock',
  lock_open: 'pi pi-lock-open',
  storage: 'pi pi-database',
  computer: 'pi pi-desktop',
  smartphone: 'pi pi-mobile',
  phone: 'pi pi-phone',
  sync: 'pi pi-sync',
  refresh: 'pi pi-refresh',
  cloud: 'pi pi-cloud',
  cloud_download: 'pi pi-cloud-download',
  cloud_upload: 'pi pi-cloud-upload',
  download: 'pi pi-download',
  upload: 'pi pi-upload',

  // Fechas / calendario
  event: 'pi pi-calendar',
  calendar_today: 'pi pi-calendar',
  schedule: 'pi pi-clock',

  // Otros de uso frecuente en menús
  search: 'pi pi-search',
  filter_list: 'pi pi-filter',
  print: 'pi pi-print',
  star: 'pi pi-star',
  favorite: 'pi pi-heart',
  bookmark: 'pi pi-bookmark',
  flag: 'pi pi-flag',
  map: 'pi pi-map',
  location_on: 'pi pi-map-marker',
  visibility: 'pi pi-eye',
  edit: 'pi pi-pencil',
  delete: 'pi pi-trash',
  add: 'pi pi-plus',
  close: 'pi pi-times',
  done: 'pi pi-check',
  share: 'pi pi-share-alt',
  link: 'pi pi-link',

  // Confirmados en runtime desde STG (ver consola del navegador, `[sidebar] icon_sec`)
  summarize: 'pi pi-chart-bar',            // Reportes
  military_tech: 'pi pi-trophy',           // Ranking
  cloud_circle: 'pi pi-cloud',
  public: 'pi pi-globe',
  stars: 'pi pi-star',
  task: 'pi pi-list-check',                // Actividades
  donut_small: 'pi pi-chart-pie',          // Cuadro de mando
  pets: 'pi pi-heart',
  launch: 'pi pi-external-link',           // Jira SD / Helpdesk
  insights: 'pi pi-chart-line',            // Desempeño
  home_repair_service: 'pi pi-wrench',     // Herramientas
};

/** Ícono genérico para nombres de Material Icons sin equivalente conocido en PrimeIcons. */
export const PRIMEICONS_FALLBACK = 'pi pi-th-large';

/** Índice normalizado (minúsculas, `-`/espacio → `_`) para no depender del casing/formato exacto que mande STG. */
const NORMALIZED_INDEX: Record<string, string> = Object.fromEntries(
  Object.entries(MATERIAL_TO_PRIMEICONS).map(([key, value]) => [normalizar(key), value]),
);

function normalizar(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** `icon_sec` sin mapeo conocido, vistos en runtime (para extender la tabla con datos reales de STG). */
const sinMapear = new Set<string>();

/**
 * Traduce un nombre de ligature de Material Icons (`icon_sec` de STG) a la
 * clase CSS de PrimeIcons más parecida. Si no hay un mapeo conocido, devuelve
 * {@link PRIMEICONS_FALLBACK} y registra el nombre (una vez) en consola para
 * poder añadirlo a `MATERIAL_TO_PRIMEICONS`.
 */
export function mapMaterialIconToPrimeIcons(materialIconName: string | undefined | null): string {
  if (!materialIconName) return PRIMEICONS_FALLBACK;

  const clave = normalizar(materialIconName);
  const icono = NORMALIZED_INDEX[clave];
  if (icono) return icono;

  if (!sinMapear.has(clave)) {
    sinMapear.add(clave);
    console.warn(`[sidebar] icon_sec "${materialIconName}" sin mapeo a PrimeIcons — usando ícono genérico. Añádelo a material-to-primeicons.util.ts.`);
  }
  return PRIMEICONS_FALLBACK;
}
