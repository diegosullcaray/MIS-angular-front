import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuConfigService } from '../../../../../../full-pages/layout/services/menu-config.service';
import { MENU_TYPE_OPTIONS, MenuType, MenuTypeOption } from '../../../../../../full-pages/layout/interfaces/menu-type.interface';
import { MessageService } from '../../../../../../../core/services/message.service';
import { TranslationService } from '../../../../../../../core/services/translation.service';
import { PrimeNgModule } from '../../../../../../../prime-ng/prime-ng.module';

@Component({
  selector: 'app-item-estructura',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './item-estructura.component.html',
  styleUrl: './item-estructura.component.css'
})
export class ItemEstructuraComponent implements OnInit {

  menuTypeOptions: MenuTypeOption[] = MENU_TYPE_OPTIONS;
  /** Indica si estamos en pantalla móvil (ancho <= 576px) */
  isMobile: boolean = false;

  /** Valor aplicado actualmente (guardado en el servicio) */
  savedMenuType: MenuType = 'static';
  /** Valor seleccionado en la UI (pendiente de guardar) */
  selectedMenuType: MenuType = 'static';

  constructor(
    private menuConfigService: MenuConfigService,
    private messageService: MessageService,
    private translationService: TranslationService
  ) {}

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  ngOnInit(): void {
    const config = this.menuConfigService.getCurrentConfig();
    this.savedMenuType = config.type;
    this.selectedMenuType = config.type;

    // Detectar móvil y, por defecto, deshabilitar todas las opciones
    // excepto `overlay`. La selección visual queda en `overlay`.
    this.isMobile = window.matchMedia('(max-width: 576px)').matches;
    if (this.isMobile) {
      this.menuTypeOptions = MENU_TYPE_OPTIONS.map(o => ({ ...o, disabled: o.value !== 'overlay' }));
      this.selectedMenuType = 'overlay';
    }
  }

  /** Solo actualiza la selección en pantalla; no aplica hasta Guardar */
  selectMenuType(type: MenuType): void {
    // Evitar seleccionar si la opción está deshabilitada
    const opt = this.menuTypeOptions.find(o => o.value === type);
    if (opt && opt.disabled) return;
    this.selectedMenuType = type;
  }

  /** Hay cambios pendientes */
  get hasChanges(): boolean {
    return this.selectedMenuType !== this.savedMenuType;
  }

  /** Aplica los cambios y guarda */
  save(): void {
    this.menuConfigService.setMenuType(this.selectedMenuType);
    this.savedMenuType = this.selectedMenuType;
    this.messageService.success(
      this.t('content.layout.dialogConfiguration.item.itemEstructura.messages.saveSuccess', 'Configuración del menú guardada correctamente')
    );
  }

  /** Descarta cambios y vuelve al valor guardado */
  cancel(): void {
    this.selectedMenuType = this.savedMenuType;
    this.messageService.info(
      this.t('content.layout.dialogConfiguration.item.itemEstructura.messages.cancelChanges', 'Cambios descartados')
    );
  }

  /** Restaura la opción por defecto (pendiente de guardar) */
  resetToDefault(): void {
    this.selectedMenuType = 'static';
  }

  getIconForType(type: MenuType): string {
    const icons: Record<MenuType, string> = {
      static: 'pi pi-th-large',
      slim: 'pi pi-align-justify',
      reveal: 'pi pi-eye',
      overlay: 'pi pi-window-maximize',
      'slim-plus': 'pi pi-plus',
      drawer: 'pi pi-bars',
      horizontal: 'pi pi-ellipsis-h'
    };
    return icons[type] || 'pi pi-bars';
  }
}
