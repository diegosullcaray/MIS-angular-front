import {
  lucideLayoutGrid, lucideLayoutDashboard, lucideHome, lucideMenu, lucideEllipsisVertical, lucideEllipsis,
  lucideUser, lucideUserPlus, lucideUsers, lucideUserCog, lucideShield, lucideShieldCheck, lucideIdCard, lucideHammer,
  lucideChartBar, lucideChartLine, lucidePieChart, lucideSlidersHorizontal, lucideTable, lucideHistory,
  lucideBanknote, lucideDollarSign, lucideWallet, lucideLandmark, lucideCreditCard, lucideStore, lucideReceipt,
  lucideFileText, lucideFolder, lucideFolderOpen, lucideFile, lucideFileCheck, lucideFilePenLine, lucideList,
  lucideBuilding, lucideBuilding2, lucideShoppingCart, lucideBox, lucideBoxes, lucideWarehouse, lucideTruck, lucideBriefcase,
  lucideMail, lucideMessageCircle, lucideMessageSquare, lucideBell, lucideHelpCircle, lucideInfo, lucideAlertTriangle,
  lucideCircleAlert, lucideCheckCircle2, lucideSettings, lucideWrench, lucideShieldAlert, lucideLock, lucideLockOpen,
  lucideDatabase, lucideMonitor, lucideSmartphone, lucidePhone, lucideRefreshCw, lucideCloud, lucideCloudDownload,
  lucideCloudUpload, lucideDownload, lucideUpload, lucideCalendar, lucideClock, lucideSearch, lucideFilter, lucidePrinter,
  lucideStar, lucideHeart, lucideBookmark, lucideFlag, lucideMap, lucideMapPin, lucideEye, lucidePencil, lucideTrash2,
  lucidePlus, lucideX, lucideCheck, lucideShare2, lucideLink, lucideTrophy, lucideGlobe, lucideListChecks,
  lucideExternalLink, lucideFileOutput, lucideActivity, lucideLifeBuoy, lucideServer, lucideServerCrash,
  lucideChevronDown, lucideArrowLeft, lucideCompass, lucideTimer, lucideLogIn, lucideWifiOff, lucideLogOut,
} from '@ng-icons/lucide';

/**
 * Registro único de íconos Lucide del Host (reemplaza a PrimeIcons — el
 * proyecto ya no usa PrimeNG). Se provee una sola vez con `provideIcons()`
 * en cualquier componente que necesite renderizar un ícono cuyo nombre
 * viene de datos en runtime (sidebar, Gestión de Sistemas), en vez de
 * declarar `viewProviders` distintos por componente.
 *
 * El valor de cada entrada es el nombre exacto que se usa en la plantilla:
 * `<ng-icon [name]="'lucideChartBar'" />`.
 */
export const MIS_ICON_PROVIDERS = {
  lucideLayoutGrid, lucideLayoutDashboard, lucideHome, lucideMenu, lucideEllipsisVertical, lucideEllipsis,
  lucideUser, lucideUserPlus, lucideUsers, lucideUserCog, lucideShield, lucideShieldCheck, lucideIdCard, lucideHammer,
  lucideChartBar, lucideChartLine, lucidePieChart, lucideSlidersHorizontal, lucideTable, lucideHistory,
  lucideBanknote, lucideDollarSign, lucideWallet, lucideLandmark, lucideCreditCard, lucideStore, lucideReceipt,
  lucideFileText, lucideFolder, lucideFolderOpen, lucideFile, lucideFileCheck, lucideFilePenLine, lucideList,
  lucideBuilding, lucideBuilding2, lucideShoppingCart, lucideBox, lucideBoxes, lucideWarehouse, lucideTruck, lucideBriefcase,
  lucideMail, lucideMessageCircle, lucideMessageSquare, lucideBell, lucideHelpCircle, lucideInfo, lucideAlertTriangle,
  lucideCircleAlert, lucideCheckCircle2, lucideSettings, lucideWrench, lucideShieldAlert, lucideLock, lucideLockOpen,
  lucideDatabase, lucideMonitor, lucideSmartphone, lucidePhone, lucideRefreshCw, lucideCloud, lucideCloudDownload,
  lucideCloudUpload, lucideDownload, lucideUpload, lucideCalendar, lucideClock, lucideSearch, lucideFilter, lucidePrinter,
  lucideStar, lucideHeart, lucideBookmark, lucideFlag, lucideMap, lucideMapPin, lucideEye, lucidePencil, lucideTrash2,
  lucidePlus, lucideX, lucideCheck, lucideShare2, lucideLink, lucideTrophy, lucideGlobe, lucideListChecks,
  lucideExternalLink, lucideFileOutput, lucideActivity, lucideLifeBuoy, lucideServer, lucideServerCrash,
  lucideChevronDown, lucideArrowLeft, lucideCompass, lucideTimer, lucideLogIn, lucideWifiOff, lucideLogOut,
} as const;

/** Ícono genérico para sistemas/módulos sin ícono propio asignado. */
export const MIS_ICON_FALLBACK = 'lucideBoxes';

/** Picklist curado para el selector de ícono de Gestión de Sistemas (`sistema-form`). */
export const MIS_ICON_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'lucideBoxes', label: 'Genérico' },
  { value: 'lucideLayoutGrid', label: 'Tablero' },
  { value: 'lucideChartBar', label: 'Reportes (barras)' },
  { value: 'lucideChartLine', label: 'Reportes (línea)' },
  { value: 'lucidePieChart', label: 'Reportes (torta)' },
  { value: 'lucideUsers', label: 'Personas' },
  { value: 'lucideBuilding', label: 'Empresa' },
  { value: 'lucideBuilding2', label: 'Sucursal' },
  { value: 'lucideWallet', label: 'Finanzas' },
  { value: 'lucideCreditCard', label: 'Pagos' },
  { value: 'lucideReceipt', label: 'Comprobantes' },
  { value: 'lucideBriefcase', label: 'Cartera' },
  { value: 'lucideTruck', label: 'Logística' },
  { value: 'lucideWarehouse', label: 'Almacén' },
  { value: 'lucideShoppingCart', label: 'Ventas' },
  { value: 'lucideFileText', label: 'Documentos' },
  { value: 'lucideDatabase', label: 'Datos' },
  { value: 'lucideGlobe', label: 'Web / externo' },
  { value: 'lucideShield', label: 'Seguridad' },
  { value: 'lucideSettings', label: 'Configuración' },
];
