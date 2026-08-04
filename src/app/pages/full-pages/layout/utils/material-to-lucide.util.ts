import { MIS_ICON_FALLBACK } from '../../../../shared/constants/mis-icons.constants';

/**
 * STG (Ant) guarda en `icon_sec` nombres de ligature de Material Icons
 * (ej. "assessment", "people_alt", "monetization_on") — ver
 * stg-app-mis-r22/src/app/pages/full-pages/layout/services/navigation.service.ts.
 *
 * El Host ya no usa PrimeIcons (sin licencia) — los íconos del sidebar se
 * renderizan con `@ng-icons/lucide` (ver `MIS_ICON_PROVIDERS`). Esta tabla
 * traduce cada nombre de Material Icons al nombre de ícono Lucide más
 * parecido semánticamente; los nombres no cubiertos caen al fallback
 * genérico ({@link MIS_ICON_FALLBACK}).
 */
const MATERIAL_TO_LUCIDE: Record<string, string> = {
  // Navegación / generales
  dashboard: 'lucideLayoutGrid',
  dashboard_customize: 'lucideLayoutDashboard',
  home: 'lucideHome',
  apps: 'lucideLayoutGrid',
  widgets: 'lucideLayoutGrid',
  grid_view: 'lucideLayoutGrid',
  view_module: 'lucideLayoutGrid',
  menu: 'lucideMenu',
  more_vert: 'lucideEllipsisVertical',
  more_horiz: 'lucideEllipsis',

  // Personas / usuarios
  person: 'lucideUser',
  person_add: 'lucideUserPlus',
  people: 'lucideUsers',
  people_alt: 'lucideUsers',
  group: 'lucideUsers',
  groups: 'lucideUsers',
  supervisor_account: 'lucideUsers',
  supervised_user_circle: 'lucideUsers',
  account_circle: 'lucideUser',
  manage_accounts: 'lucideUserCog',
  admin_panel_settings: 'lucideShield',
  badge: 'lucideIdCard',
  contact_page: 'lucideIdCard',
  verified_user: 'lucideShieldCheck',
  policy: 'lucideShield',
  gavel: 'lucideHammer',

  // Reportes / analítica (comercial, cartera, incentivos)
  assessment: 'lucideChartBar',
  bar_chart: 'lucideChartBar',
  insert_chart: 'lucideChartBar',
  show_chart: 'lucideChartLine',
  trending_up: 'lucideChartLine',
  pie_chart: 'lucidePieChart',
  donut_large: 'lucidePieChart',
  equalizer: 'lucideSlidersHorizontal',
  table_chart: 'lucideTable',
  table_view: 'lucideTable',
  leaderboard: 'lucideChartBar',
  timeline: 'lucideHistory',
  history: 'lucideHistory',

  // Finanzas (contable, cartera, incentivos)
  monetization_on: 'lucideBanknote',
  attach_money: 'lucideDollarSign',
  payments: 'lucideWallet',
  account_balance: 'lucideLandmark',
  credit_card: 'lucideCreditCard',
  savings: 'lucideWallet',
  point_of_sale: 'lucideStore',
  local_atm: 'lucideBanknote',
  request_quote: 'lucideReceipt',
  receipt: 'lucideReceipt',
  receipt_long: 'lucideReceipt',

  // Documentos / archivos
  description: 'lucideFileText',
  article: 'lucideFileText',
  insert_drive_file: 'lucideFile',
  folder: 'lucideFolder',
  folder_open: 'lucideFolderOpen',
  picture_as_pdf: 'lucideFileText',
  assignment: 'lucideFilePenLine',
  assignment_turned_in: 'lucideFileCheck',
  fact_check: 'lucideFileCheck',
  list: 'lucideList',
  view_list: 'lucideList',

  // Comercio / operaciones
  business: 'lucideBuilding',
  domain: 'lucideBuilding',
  store: 'lucideStore',
  storefront: 'lucideStore',
  shopping_cart: 'lucideShoppingCart',
  inventory: 'lucideBox',
  inventory_2: 'lucideBox',
  warehouse: 'lucideWarehouse',
  local_shipping: 'lucideTruck',
  work: 'lucideBriefcase',

  // Comunicación / soporte
  mail: 'lucideMail',
  email: 'lucideMail',
  chat: 'lucideMessageCircle',
  comment: 'lucideMessageSquare',
  notifications: 'lucideBell',
  notifications_active: 'lucideBell',
  help: 'lucideHelpCircle',
  help_outline: 'lucideHelpCircle',
  info: 'lucideInfo',
  warning: 'lucideAlertTriangle',
  error: 'lucideCircleAlert',
  check_circle: 'lucideCheckCircle2',

  // Sistema / configuración
  settings: 'lucideSettings',
  settings_applications: 'lucideSettings',
  build: 'lucideWrench',
  security: 'lucideShield',
  lock: 'lucideLock',
  lock_open: 'lucideLockOpen',
  storage: 'lucideDatabase',
  computer: 'lucideMonitor',
  smartphone: 'lucideSmartphone',
  phone: 'lucidePhone',
  sync: 'lucideRefreshCw',
  refresh: 'lucideRefreshCw',
  cloud: 'lucideCloud',
  cloud_download: 'lucideCloudDownload',
  cloud_upload: 'lucideCloudUpload',
  download: 'lucideDownload',
  upload: 'lucideUpload',

  // Fechas / calendario
  event: 'lucideCalendar',
  calendar_today: 'lucideCalendar',
  schedule: 'lucideClock',

  // Otros de uso frecuente en menús
  search: 'lucideSearch',
  filter_list: 'lucideFilter',
  print: 'lucidePrinter',
  star: 'lucideStar',
  favorite: 'lucideHeart',
  bookmark: 'lucideBookmark',
  flag: 'lucideFlag',
  map: 'lucideMap',
  location_on: 'lucideMapPin',
  visibility: 'lucideEye',
  edit: 'lucidePencil',
  delete: 'lucideTrash2',
  add: 'lucidePlus',
  close: 'lucideX',
  done: 'lucideCheck',
  share: 'lucideShare2',
  link: 'lucideLink',

  // Confirmados en runtime desde STG (ver consola del navegador, `[sidebar] icon_sec`)
  summarize: 'lucideChartBar',            // Reportes
  military_tech: 'lucideTrophy',          // Ranking
  cloud_circle: 'lucideCloud',
  public: 'lucideGlobe',
  stars: 'lucideStar',
  task: 'lucideListChecks',               // Actividades
  donut_small: 'lucidePieChart',          // Cuadro de mando
  pets: 'lucideHeart',
  launch: 'lucideExternalLink',           // Jira SD / Helpdesk
  insights: 'lucideChartLine',            // Desempeño
  home_repair_service: 'lucideWrench',    // Herramientas
};

/** Ícono genérico para nombres de Material Icons sin equivalente conocido en Lucide. */
export const LUCIDE_ICON_FALLBACK = MIS_ICON_FALLBACK;

/** Índice normalizado (minúsculas, `-`/espacio → `_`) para no depender del casing/formato exacto que mande STG. */
const NORMALIZED_INDEX: Record<string, string> = Object.fromEntries(
  Object.entries(MATERIAL_TO_LUCIDE).map(([key, value]) => [normalizar(key), value]),
);

function normalizar(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** `icon_sec` sin mapeo conocido, vistos en runtime (para extender la tabla con datos reales de STG). */
const sinMapear = new Set<string>();

/**
 * Traduce un nombre de ligature de Material Icons (`icon_sec` de STG) al
 * nombre de ícono Lucide más parecido (uno de `MIS_ICON_PROVIDERS`). Si no
 * hay un mapeo conocido, devuelve {@link LUCIDE_ICON_FALLBACK} y registra el
 * nombre (una vez) en consola para poder añadirlo a `MATERIAL_TO_LUCIDE`.
 */
export function mapMaterialIconToLucide(materialIconName: string | undefined | null): string {
  if (!materialIconName) return LUCIDE_ICON_FALLBACK;

  const clave = normalizar(materialIconName);
  const icono = NORMALIZED_INDEX[clave];
  if (icono) return icono;

  if (!sinMapear.has(clave)) {
    sinMapear.add(clave);
    console.warn(`[sidebar] icon_sec "${materialIconName}" sin mapeo a Lucide — usando ícono genérico. Añádelo a material-to-lucide.util.ts.`);
  }
  return LUCIDE_ICON_FALLBACK;
}
