import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, email, minLength, applyWhen } from '@angular/forms/signals';
import { AccesosService } from '../../../services/accesos.service';
import { SistemasService } from '../../../../sistemas/services/sistemas.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck, lucideX } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-form',
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
    NgIconComponent
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideCheck, lucideX })],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnInit {
  protected readonly service = inject(AccesosService);
  private readonly sistemasService = inject(SistemasService);
  private readonly router    = inject(Router);

  // Input bound from route parameter :id
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  // ─── Signal Form (TRD §6.1) ──────────────────────────────────────────────

  protected readonly usuarioModel = signal({
    nombre: '',
    email: '',
    password: '',
  });

  protected readonly usuarioForm = form(this.usuarioModel, (schema) => {
    required(schema.nombre, { message: 'El nombre es requerido.' });
    required(schema.email,  { message: 'El correo electrónico es requerido.' });
    email(schema.email,     { message: 'Introduce un correo electrónico válido.' });

    // La contraseña solo es obligatoria al crear (no en edición)
    applyWhen(schema, () => !this.id(), (s) => {
      required(s.password,     { message: 'La contraseña es requerida.' });
      minLength(s.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres.' });
    });
  });

  // El rol se gestiona fuera del signal form: p-select (CVA de PrimeNG)
  // no es compatible con la directiva [formField]
  protected readonly rolId = signal('');
  protected readonly rolTouched = signal(false);

  /** Slug del rol del usuario en edición (se resuelve a rolId cuando cargan los roles). */
  protected readonly rolSlugEdicion = signal<string | null>(null);

  constructor() {
    effect(() => {
      const slug = this.rolSlugEdicion();
      const roles = this.service.roles();
      if (slug && roles.length > 0 && !this.rolId()) {
        const rol = roles.find(r => r.slug === slug);
        if (rol) this.rolId.set(rol.id);
      }
    });
  }

  // Opciones dinámicas desde la API (roles y sistemas registrados)
  protected readonly rolesOptions = computed(() =>
    this.service.roles().map(r => ({ label: r.nombre, value: r.id }))
  );

  protected readonly remotesOptions = computed(() =>
    this.sistemasService.sistemas().map(s => ({ label: s.nombre, value: s.slug }))
  );

  // Signal: en Zoneless, un array plano actualizado tras un await no re-renderiza
  protected readonly selectedRemotes = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    this.service.cargarRoles();
    this.sistemasService.cargarSistemas();

    const userId = this.id();
    if (!userId) return;

    // Modo edición: cargar el usuario y resolver su rolId por slug
    try {
      const user = await this.service.obtenerUsuario(userId);
      this.usuarioModel.update(m => ({
        ...m,
        nombre: user.nombre,
        email: user.email,
      }));
      this.rolSlugEdicion.set(user.rol);
      this.selectedRemotes.set([...user.subsistemas]);
    } catch {
      this.router.navigate(['/admin/accesos/usuarios']);
    }
  }

  protected async onRolChange(rolId: string): Promise<void> {
    this.rolId.set(rolId);
    this.rolTouched.set(true);

    // Al cambiar de rol, precargar los subsistemas predeterminados de ese rol
    try {
      const rol = await this.service.obtenerRol(rolId);
      this.selectedRemotes.set([...rol.subsistemas]);
    } catch {
      // El rol no existe en la API: mantener la selección actual
    }
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
    this.rolTouched.set(true);
    if (this.usuarioForm().invalid() || !this.rolId()) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { nombre, email, password } = this.usuarioModel();
    const payload = {
      nombre: nombre.trim(),
      email: email.trim(),
      rolId: this.rolId(),
      subsistemas: this.selectedRemotes(),
      ...(password ? { password } : {})
    };

    const userId = this.id();
    try {
      if (userId) {
        await this.service.actualizarUsuario(userId, payload);
      } else {
        await this.service.crearUsuario(payload);
      }
      this.router.navigate(['/admin/accesos/usuarios']);
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'No se pudo guardar el usuario. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
