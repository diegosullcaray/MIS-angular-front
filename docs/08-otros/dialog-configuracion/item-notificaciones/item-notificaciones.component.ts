import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { takeUntil, Subject } from 'rxjs';
import { NotificationPreferencesService } from '../../../../../../full-pages/layout/services/notification-preferences.service';
import { TranslationService } from '../../../../../../../core/services/translation.service';

// Componente de preferencias de notificaciones integrado en la configuración
@Component({
  selector: 'app-item-notificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, ToggleSwitchModule, DividerModule, InputTextModule],
  templateUrl: './item-notificaciones.component.html',
  styleUrl: './item-notificaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNotificacionesComponent implements OnInit, OnDestroy {
  private readonly preferencesService = inject(NotificationPreferencesService);
  private readonly messageService = inject(MessageService);
  private readonly translationService = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  preferencesForm!: FormGroup;
  readonly loading$ = this.preferencesService.loading$;
  readonly preferences$ = this.preferencesService.preferences$;

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToPreferences();
  }

  // Inicializar formulario reactivo
  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      enabled: [true],
      soundEnabled: [true],
      emailEnabled: [false],
      quietHours: this.fb.group({
        enabled: [false],
        start: ['22:00'],
        end: ['08:00'],
      }),
    });
  }

  // Suscribirse a cambios de preferencias
  private subscribeToPreferences(): void {
    this.preferences$.pipe(takeUntil(this.destroy$)).subscribe((preferences) => {
      this.preferencesForm.patchValue(preferences, { emitEvent: false });
    });
  }

  // Traducir clave de i18n
  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  // Obtener grupo de horas silenciosas
  get quietHoursGroup(): FormGroup {
    return this.preferencesForm.get('quietHours') as FormGroup;
  }

  // Guardar cambios de preferencias
  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, revisa los datos ingresados',
      });
      return;
    }

    this.preferencesService
      .updatePreferences(this.preferencesForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => console.error('Error al guardar preferencias:', error),
      });
  }

  // Resetear a valores por defecto
  resetToDefaults(): void {
    this.preferencesService
      .resetToDefaults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () =>
          this.messageService.add({
            severity: 'info',
            summary: 'Reseteo',
            detail: 'Preferencias restauradas a valores por defecto',
          }),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
