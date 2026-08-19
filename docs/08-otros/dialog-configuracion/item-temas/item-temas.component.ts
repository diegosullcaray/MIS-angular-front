import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, PrimePreset } from '../../../../../../../shared/services/theme.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import { TranslationService } from '../../../../../../../core/services/translation.service';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import temasData from './item-temas.data.json';

@Component({
  selector: 'app-item-temas',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './item-temas.component.html',
  styleUrl: './item-temas.component.css'
})
export class ItemTemasComponent implements OnInit {
  selectedDarkMode: 'light' | 'dark' | 'mint' | 'system' = 'system';
  selectedImage: number | null = null;
  selectedColor: number = -1;
  selectedPreset: PrimePreset = 'Aura';

  backgroundImages: string[] = temasData.backgroundImages;
  presets: PrimePreset[] = ['Aura', 'Lara', 'Nora'];

  // Track loading state per image (true = loading)
  imageLoading: boolean[] = [];

  themeColors: string[] = temasData.themeColors;

  private storageKey = 'theme-appearance-config';

  constructor(
    private themeService: ThemeService,
    private messageService: MessageService,
    private translationService: TranslationService,
    @Optional() private dialogRef: DynamicDialogRef
  ) { }

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  ngOnInit(): void {
    this.loadSavedConfiguration();
    // Inicializar estados de carga para cada imagen
    this.imageLoading = this.backgroundImages.map(() => true);
  }

  onImageLoad(index: number) {
    this.imageLoading[index] = false;
  }

  onImageError(index: number) {
    // dejar de mostrar spinner y opcionalmente marcar como no disponible
    this.imageLoading[index] = false;
  }

  selectDarkMode(mode: 'light' | 'dark' | 'mint' | 'system') {
    this.selectedDarkMode = mode;
  }

  selectPreset(preset: PrimePreset) {
    this.selectedPreset = preset;
  }

  selectImage(index: number | null) {
    if (index === null) {
      this.selectedImage = null;
      return;
    }

    this.selectedImage = this.selectedImage === index ? null : index;
  }

  selectColor(index: number) {
    // Selección explícita de "ninguno"
    if (index === -1) {
      this.selectedColor = -1;
      this.themeService.clearCustomColor();
      return;
    }

    // Si se selecciona el mismo color, deseleccionar (marcando -1)
    if (this.selectedColor === index) {
      this.selectedColor = -1; // -1 indica que no hay color seleccionado
      this.themeService.clearCustomColor();
    } else {
      this.selectedColor = index;
    }
  }

  save() {
    let themeClass: string;
    if (this.selectedDarkMode === 'system') {
      themeClass = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'my-app-dark'
        : 'my-app-light';
    } else if (this.selectedDarkMode === 'mint') {
      themeClass = 'my-app-mint';
    } else if (this.selectedDarkMode === 'dark') {
      themeClass = 'my-app-dark';
    } else {
      themeClass = 'my-app-light';
    }

    // Aplicar color personalizado PRIMERO (si existe y no está deseleccionado)
    if (this.selectedColor !== null && this.selectedColor >= 0 && this.themeColors[this.selectedColor]) {
      this.themeService.setCustomColor(this.themeColors[this.selectedColor]);
    } else if (this.selectedColor === -1) {
      // Si está deseleccionado, limpiar el color personalizado
      this.themeService.clearCustomColor();
    }

    // Luego aplicar el tema (no sobrescribirá los colores personalizados si existen)
    this.themeService.setThemeClass(themeClass);

    // Aplicar preset de PrimeNG
    this.themeService.setPreset(this.selectedPreset);

    // Aplicar imagen de fondo
    if (this.selectedImage !== null && this.backgroundImages[this.selectedImage]) {
      this.themeService.setBackgroundImage(this.backgroundImages[this.selectedImage]);
    } else {
      this.themeService.setBackgroundImage(null);
    }

    const config = {
      darkMode: this.selectedDarkMode,
      image: this.selectedImage,
      color: this.selectedColor,
      preset: this.selectedPreset
    };
    localStorage.setItem(this.storageKey, JSON.stringify(config));

    // Mostrar mensaje de éxito
    this.messageService.success(
      this.t('content.layout.dialogConfiguration.item.itemTemas.messages.saveSuccess', 'Configuración de apariencia guardada correctamente')
    );

    this.dialogRef?.close();
  }

  discard() {
    this.loadSavedConfiguration();
    this.dialogRef?.close();
  }

  private loadSavedConfiguration() {
    const saved = localStorage.getItem(this.storageKey);

    // Cargar preset desde themeService
    this.selectedPreset = this.themeService.getStoredPreset();

    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.selectedDarkMode = config.darkMode || 'system';
        this.selectedImage = config.image !== undefined ? config.image : null;
        this.selectedColor = config.color !== undefined ? config.color : -1;
        if (config.preset && this.presets.includes(config.preset)) {
          this.selectedPreset = config.preset;
        }

        // Aplicar configuración guardada
        if (this.selectedImage !== null && this.backgroundImages[this.selectedImage]) {
          this.themeService.setBackgroundImage(this.backgroundImages[this.selectedImage]);
        }

        // Solo aplicar color personalizado si no está deseleccionado (-1)
        if (this.selectedColor >= 0 && this.themeColors[this.selectedColor]) {
          this.themeService.setCustomColor(this.themeColors[this.selectedColor]);
        }
      } catch (e) {
        // Error al parsear, usar valores por defecto
      }
    } else {
      const currentTheme = this.themeService.getStoredClass();
      if (currentTheme === 'my-app-dark') {
        this.selectedDarkMode = 'dark';
      } else if (currentTheme === 'my-app-light') {
        this.selectedDarkMode = 'light';
      } else if (currentTheme === 'my-app-mint') {
        this.selectedDarkMode = 'mint';
      } else {
        this.selectedDarkMode = 'system';
      }
    }
  }
}
