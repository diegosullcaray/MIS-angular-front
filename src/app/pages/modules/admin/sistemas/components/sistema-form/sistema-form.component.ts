import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, pattern, disabled } from '@angular/forms/signals';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SistemasService } from '../../services/sistemas.service';
import { SISTEMA_ESTADO_LABELS, type SistemaEstado } from '../../models/sistema.model';

@Component({
  selector: 'app-sistema-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule
  ],
  templateUrl: './sistema-form.component.html',
  styleUrl: './sistema-form.component.css',
})
export class SistemaFormComponent implements OnInit {
  protected readonly service = inject(SistemasService);
  private readonly router = inject(Router);

  // Input bound from route parameter :id (undefined en modo crear)
  readonly id = input<string>();

  protected readonly activeTab = signal<'identificacion' | 'despliegue'>('identificacion');
  protected readonly cargando = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly tabOptions = [
    { label: 'Información de Registro', value: 'identificacion' },
    { label: 'Configuración de Despliegue', value: 'despliegue' }
  ];

  // ─── Signal Form (TRD §6.1) ──────────────────────────────────────────────

  protected readonly sistemaModel = signal({
    nombre: '',
    slug: '',
    descripcion: '',
    icono: '',
    url: '',
    version: '',
  });

  protected readonly sistemaForm = form(this.sistemaModel, (schema) => {
    required(schema.nombre, { message: 'El nombre es requerido.' });
    required(schema.slug,   { message: 'El slug es requerido.' });
    pattern(schema.slug, /^[a-z0-9-]+$/, {
      message: 'El slug debe ser en minúsculas, sin espacios (solo letras, números y guiones).',
    });
    // El slug identifica al Remote en el manifest: no se edita
    disabled(schema.slug, () => !!this.id());
  });

  // Estado gestionado fuera del signal form (p-select no soporta [formField])
  protected readonly estado = signal<SistemaEstado>('inactivo');

  protected readonly estadosOptions = (
    Object.entries(SISTEMA_ESTADO_LABELS) as [SistemaEstado, string][]
  ).map(([value, label]) => ({ value, label }));

  async ngOnInit(): Promise<void> {
    const sistemaId = this.id();
    if (!sistemaId) return;

    // Modo edición: cargar el sistema desde la API
    try {
      const s = await this.service.obtenerSistema(sistemaId);
      this.sistemaModel.set({
        nombre: s.nombre,
        slug: s.slug,
        descripcion: s.descripcion,
        icono: s.icono,
        url: s.url,
        version: s.version,
      });
      this.estado.set(s.estado);
    } catch {
      this.router.navigate(['/admin/sistemas']);
    }
  }

  protected onNombreInput(event: Event): void {
    if (this.id()) return; // No auto-generar slug al editar

    const nombre = (event.target as HTMLInputElement).value;
    const slug = 'subsistema-' + nombre
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin tildes
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    this.sistemaModel.update(m => ({ ...m, slug }));
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.sistemaForm().invalid()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { nombre, slug, descripcion, icono, url, version } = this.sistemaModel();
    const payload = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      descripcion: descripcion.trim(),
      icono: icono.trim(),
      url: url.trim(),
      version: version.trim(),
      estado: this.estado(),
    };

    const sistemaId = this.id();
    try {
      if (sistemaId) {
        await this.service.actualizarSistema(sistemaId, payload);
        this.router.navigate(['/admin/sistemas', sistemaId]);
      } else {
        const nuevo = await this.service.crearSistema(payload);
        // Al crear, ir directo al detalle para definir la estructura
        this.router.navigate(['/admin/sistemas', nuevo.id]);
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'No se pudo guardar el sistema. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
