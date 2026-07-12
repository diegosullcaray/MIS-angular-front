import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required, pattern, disabled } from '@angular/forms/signals';
import { AccesosService } from '../../../services/accesos.service';
import { SistemasService } from '../../../../sistemas/services/sistemas.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck, lucideX } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rol-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    CardModule,
    InputTextModule,
    ButtonModule,
    NgIconComponent
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideCheck, lucideX })],
  templateUrl: './rol-form.component.html',
  styleUrl: './rol-form.component.css',
})
export class RolFormComponent implements OnInit {
  protected readonly service = inject(AccesosService);
  private readonly sistemasService = inject(SistemasService);
  private readonly router    = inject(Router);

  // Input bound from route parameter :id
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  // ─── Signal Form (TRD §6.1) ──────────────────────────────────────────────

  protected readonly rolModel = signal({ nombre: '', slug: '' });

  protected readonly rolForm = form(this.rolModel, (schema) => {
    required(schema.nombre, { message: 'El nombre es requerido.' });
    required(schema.slug,   { message: 'El slug es requerido.' });
    pattern(schema.slug, /^[a-z0-9-]+$/, {
      message: 'El slug debe ser en minúsculas, sin espacios (solo letras, números y guiones).',
    });
    // El slug es la clave del rol: no se edita en modo edición
    disabled(schema.slug, () => !!this.id());
  });

  // Opciones dinámicas: sistemas registrados en el módulo Sistemas
  protected readonly remotesOptions = computed(() =>
    this.sistemasService.sistemas().map(s => ({ label: s.nombre, value: s.slug }))
  );

  // Signal: en Zoneless, un array plano actualizado tras un await no re-renderiza
  protected readonly selectedRemotes = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    this.sistemasService.cargarSistemas();

    const rolId = this.id();
    if (!rolId) return;

    // Modo edición: cargar el rol desde la API
    try {
      const rol = await this.service.obtenerRol(rolId);
      this.rolModel.set({ nombre: rol.nombre, slug: rol.slug });
      this.selectedRemotes.set([...rol.subsistemas]);
    } catch {
      this.router.navigate(['/admin/accesos/roles']);
    }
  }

  protected onNombreInput(event: Event): void {
    if (this.id()) return; // No auto-generar slug al editar

    const nombre = (event.target as HTMLInputElement).value;
    const slug = nombre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // quitar caracteres especiales
      .replace(/\s+/g, '-');        // espacios a guiones
    this.rolModel.update(m => ({ ...m, slug }));
  }

  protected isSubscribed(sub: string): boolean {
    return this.selectedRemotes().includes(sub);
  }

  protected onCheckboxChange(event: Event, value: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedRemotes.update(list =>
      isChecked ? [...list, value] : list.filter(sub => sub !== value)
    );
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.rolForm().invalid()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { nombre, slug } = this.rolModel();
    const payload = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      subsistemas: this.selectedRemotes()
    };

    const rolId = this.id();
    try {
      if (rolId) {
        await this.service.actualizarRol(rolId, payload);
      } else {
        await this.service.crearRol(payload);
      }
      this.router.navigate(['/admin/accesos/roles']);
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'No se pudo guardar el rol. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
