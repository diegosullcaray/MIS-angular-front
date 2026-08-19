import { Component, ChangeDetectorRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subject, skip, takeUntil } from 'rxjs';
import { TranslationService } from '../../../../../../core/services/translation.service';
import { MenuConfigService } from '../../../../../full-pages/layout/services/menu-config.service';
import { PrimeNgModule } from '../../../../../../prime-ng/prime-ng.module';
import { ItemTemasComponent } from './item-temas/item-temas.component';
import { ItemEstructuraComponent } from './item-estructura/item-estructura.component';
import { ItemPreferenciasComponent } from './item-preferencias/item-preferencias.component';
import { ItemIdiomasComponent } from './item-idiomas/item-idiomas.component';
import { ItemNotificacionesComponent } from './item-notificaciones/item-notificaciones.component';
import menuConfig from './menu-config.json';
import { ItemSesionesComponent } from './item-sesiones/item-sesiones.component';
import { ItemMfaComponent } from './item-mfa/item-mfa.component';

type SubMenuDef = { label: string; icon: string; key: string };

const MENU_MAIN_KEYS: Record<string, string> = {
  account: 'content.layout.dialogConfiguration.menu.main.account',
  general: 'content.layout.dialogConfiguration.menu.main.general',
  security: 'content.layout.dialogConfiguration.menu.main.security',
  contacts: 'content.layout.dialogConfiguration.menu.main.contacts'
};

const MENU_SUB_KEYS: Record<string, Record<string, string>> = {
  account: {
    profile: 'content.layout.dialogConfiguration.menu.sub.account.profile'
  },
  general: {
    language: 'content.layout.dialogConfiguration.menu.sub.general.language',
    appearance: 'content.layout.dialogConfiguration.menu.sub.general.appearance',
    structure: 'content.layout.dialogConfiguration.menu.sub.general.structure',
    notifications: 'content.layout.dialogConfiguration.menu.sub.general.notifications',
    preferences: 'content.layout.dialogConfiguration.menu.sub.general.preferences'
  },
  security: {
    activeSessions: 'content.layout.dialogConfiguration.menu.sub.security.activeSessions',
    mfa: 'content.layout.dialogConfiguration.menu.sub.security.mfa'
  },
  contacts: {
    'contact-list': 'content.layout.dialogConfiguration.menu.sub.contacts.contact-list',
    groups: 'content.layout.dialogConfiguration.menu.sub.contacts.groups'
  }
};

@Component({
  selector: 'app-dialog-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    ItemTemasComponent,
    ItemEstructuraComponent,
    ItemPreferenciasComponent,
    ItemIdiomasComponent,
    ItemNotificacionesComponent,
    ItemSesionesComponent,
    ItemMfaComponent
  ],
  templateUrl: './dialog-configuracion.component.html',
  styleUrl: './dialog-configuracion.component.css',
})
export class DialogConfiguracionComponent implements OnInit, OnDestroy, AfterViewInit {

  searchValue: string = '';

  selectedMainItemKey: string = 'account';
  selectedSubItemKey: string = 'profile';

  // responsive (local check)
  isMobile: boolean = false;
  private resizeListener?: () => void;

  mainMenuItems: MenuItem[] = [];
  currentSubMenuItems: MenuItem[] = [];

  // Submenús (se cargan desde menu-config.json)
  subMenus: Record<string, SubMenuDef[]> = {};
  private menuCfg: any = menuConfig;
  // móvil: cuando es true, mostramos el subcomponente en lugar del acordeón
  mobileViewActive: boolean = false;

  // control explícito del índice activo del acordeón en vista móvil
  activeAccordionIndex: number | number[] | null = null;

  // render diferido del acordeón para evitar parpadeos durante la animación del diálogo
  accordionReady: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private menuConfigService: MenuConfigService,
    private dialogConfig: DynamicDialogConfig
  ) { }

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  getTranslationKeyForSubItem(mainKey: string, subKey: string): string {
    return MENU_SUB_KEYS[mainKey]?.[subKey] || '';
  }

  ngOnInit(): void {
    // local initial check and resize listener (mobile when width < 1400px)
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 1400;

      // Si es móvil, forzar sidebar a 'static'
      if (this.isMobile) {
        this.menuConfigService.setMenuType('static');
      }

      this.cdr.detectChanges();
      this.resizeListener = () => {
        const prev = this.isMobile;
        this.isMobile = window.innerWidth < 1400;
        if (prev !== this.isMobile) {
          // Si cambió a móvil, forzar sidebar a 'static'
          if (this.isMobile) {
            this.menuConfigService.setMenuType('static');
            // Si estaba en "structure", cambiar al primer item disponible
            if (this.selectedSubItemKey === 'structure') {
              const firstAvailable = this.subMenus[this.selectedMainItemKey]?.[0]?.key;
              if (firstAvailable) {
                this.selectedSubItemKey = firstAvailable;
              }
            }
          }
          // Recargar submenús para mostrar/ocultar el item "estructura"
          this.loadSubMenus();
          this.buildSubMenu();
          this.applySubMenuStyles();
          this.currentSubMenuItems = [...this.currentSubMenuItems];
          this.cdr.detectChanges();
        }
      };
      window.addEventListener('resize', this.resizeListener);
    }
    // cargar configuración desde JSON y filtrar "structure" si es móvil
    this.loadSubMenus();
    this.buildMainMenu();
    this.buildSubMenu(); // usa selectedMainItemKey
    this.applyMainMenuStyles();
    this.applySubMenuStyles();

    // refresco suave
    this.mainMenuItems = [...this.mainMenuItems];
    this.currentSubMenuItems = [...this.currentSubMenuItems];
    this.cdr.detectChanges();

    // Reconstruir menús cuando cambie el idioma (skip(1) evita doble build al abrir)
    this.translationService.translations$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSubMenus();
        this.buildMainMenu();
        this.buildSubMenu();
        this.applyMainMenuStyles();
        this.applySubMenuStyles();
        this.mainMenuItems = [...this.mainMenuItems];
        this.currentSubMenuItems = [...this.currentSubMenuItems];
        this.cdr.detectChanges();
      });
    // Navegar automáticamente a sección/subsección si viene data (ej: desde notificaciones)
    const navData = this.dialogConfig?.data as { seccion?: string; subSeccion?: string } | null;
    if (navData?.seccion) {
      this.selectMainItem(navData.seccion);
    }
    if (navData?.subSeccion) {
      this.selectSubItem(navData.subSeccion);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  ngAfterViewInit(): void {
    // Defer rendering to next tick to avoid accordion flash during dialog open animation
    setTimeout(() => {
      // asegurar índice cerrado
      this.activeAccordionIndex = null;
      this.accordionReady = true;
      this.cdr.detectChanges();
    }, 0);
  }

  // ==================== BUILD MENUS ====================

  private loadSubMenus(): void {
    const rawSubMenus = this.menuCfg?.subMenus || {};
    this.subMenus = {};

    // Cargar y filtrar submenús según el tipo de pantalla
    Object.keys(rawSubMenus).forEach(mainKey => {
      let items = rawSubMenus[mainKey] || [];

      // Si es móvil, excluir "structure" de todos los submenús
      if (this.isMobile) {
        items = items.filter((item: SubMenuDef) => item.key !== 'structure');
      }

      this.subMenus[mainKey] = items;
    });
  }

  private buildMainMenu(): void {
    const src = this.menuCfg?.mainMenu || [];
    this.mainMenuItems = (src as SubMenuDef[]).map((m: SubMenuDef) => {
      const tKey = MENU_MAIN_KEYS[m.key];
      const label = tKey ? this.t(tKey, m.label) : m.label;
      return {
        label,
        icon: m.icon,
        data: { key: m.key },
        command: () => this.selectMainItem(m.key),
        styleClass: ''
      };
    });
  }

  private buildSubMenu(): void {
    // Usar los submenús ya filtrados
    const items: SubMenuDef[] = this.subMenus[this.selectedMainItemKey] || [];
    const subKeys = MENU_SUB_KEYS[this.selectedMainItemKey];
    this.currentSubMenuItems = items.map((item: SubMenuDef) => {
      const tKey = subKeys?.[item.key];
      const label = tKey ? this.t(tKey, item.label) : item.label;
      return {
        label,
        icon: item.icon,
        data: { key: item.key },
        command: () => this.selectSubItem(item.key),
        styleClass: ''
      };
    });
  }

  // ==================== STYLES ====================

  private applyMainMenuStyles(): void {
    this.mainMenuItems.forEach(item => {
      const k = (item as any)['data']?.key as string | undefined;
      item.styleClass = (k === this.selectedMainItemKey) ? 'menu-item-selected' : '';
    });
  }

  private applySubMenuStyles(): void {
    this.currentSubMenuItems.forEach(item => {
      const k = (item as any)['data']?.key as string | undefined;
      item.styleClass = (k === this.selectedSubItemKey) ? 'menu-item-selected' : '';
    });
  }

  // ==================== GETTERS ====================

  get selectedMainItem(): MenuItem | null {
    return this.mainMenuItems.find(i => (i as any)['data']?.key === this.selectedMainItemKey) || null;
  }

  get selectedSubItem(): MenuItem | null {
    return this.currentSubMenuItems.find(i => (i as any)['data']?.key === this.selectedSubItemKey) || null;
  }

  // ==================== ACTIONS ====================

  selectMainItem(key: string): void {
    this.selectedMainItemKey = key;

    // default subitem = primero del grupo filtrado, si existe
    const firstSub = this.subMenus[key]?.[0]?.key ?? null;
    this.selectedSubItemKey = firstSub ?? '';

    this.buildSubMenu();
    this.applyMainMenuStyles();
    this.applySubMenuStyles();

    // refresco suave
    this.mainMenuItems = [...this.mainMenuItems];
    this.currentSubMenuItems = [...this.currentSubMenuItems];
    this.cdr.detectChanges();
  }

  selectSubItem(key: string): void {
    this.selectedSubItemKey = key;

    // Importante: NO tocar selectedMainItemKey
    // Solo recalcular estilos
    this.applyMainMenuStyles();
    this.applySubMenuStyles();

    // Si estamos en móvil, abrir la vista del subcomponente
    if (this.isMobile) {
      this.mobileViewActive = true;
    }

    this.currentSubMenuItems = [...this.currentSubMenuItems];
    this.mainMenuItems = [...this.mainMenuItems];
    this.cdr.detectChanges();
  }

  // cerrar la vista móvil y volver al acordeón
  closeMobileView(): void {
    this.mobileViewActive = false;
    this.cdr.detectChanges();
  }

  onSearch(event: any): void {
    this.searchValue = event.target.value;
    // si luego quieres filtrar, aquí lo haces sin reconstruir menús de forma destructiva
  }
}
