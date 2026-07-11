import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccesosService } from '../../../services/accesos.service';
import { ROL_LABELS } from '../../../models/acceso.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
    ReactiveFormsModule,
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
  private readonly fb        = inject(FormBuilder);
  private readonly router    = inject(Router);

  // Input bound from route parameter :id
  readonly id = input<string>();

  protected form!: FormGroup;
  protected readonly cargando = signal(false);

  protected readonly rolesOptions = [
    { label: ROL_LABELS['admin-sistema'],   value: 'rol-001' },
    { label: ROL_LABELS['admin-general'],   value: 'rol-002' },
    { label: ROL_LABELS['supervisor-area'], value: 'rol-003' }
  ];

  protected readonly remotesOptions = [
    { label: 'Contabilidad', value: 'subsistema-contabilidad' },
    { label: 'RRHH',         value: 'subsistema-rrhh' },
    { label: 'Ventas',       value: 'subsistema-ventas' },
    { label: 'Logística',    value: 'subsistema-logistica' }
  ];

  protected selectedRemotes: string[] = [];

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.service.cargarRoles();
    const userId = this.id();
    if (userId) {
      // Edit Mode
      const user = this.service.getUsuarioById(userId);
      if (user) {
        // Map slug to rolId
        const rolMap: Record<string, string> = {
          'admin-sistema':   'rol-001',
          'admin-general':   'rol-002',
          'supervisor-area': 'rol-003'
        };
        this.form.patchValue({
          nombre: user.nombre,
          email: user.email,
          rolId: rolMap[user.rol] ?? ''
        });
        this.selectedRemotes = [...user.subsistemas];
      } else {
        // User not found
        this.router.navigate(['/admin/accesos/usuarios']);
      }
    }
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      rolId: ['', [Validators.required]],
      password: ['']
    });
  }

  protected onRolChange(rolId: string): void {
    // Si cambia de rol, podemos inicializar los remotos predeterminados de ese rol
    const rol = this.service.getRolById(rolId);
    if (rol) {
      this.selectedRemotes = [...rol.subsistemas];
    }
  }

  protected isSubscribed(sub: string): boolean {
    return this.selectedRemotes.includes(sub);
  }

  protected onCheckboxChange(event: Event, value: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedRemotes = [...this.selectedRemotes, value];
    } else {
      this.selectedRemotes = this.selectedRemotes.filter(sub => sub !== value);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) return;

    this.cargando.set(true);
    const formVal = this.form.value;
    const payload = {
      nombre: formVal.nombre.trim(),
      email: formVal.email.trim(),
      rolId: formVal.rolId,
      subsistemas: this.selectedRemotes,
      ...(formVal.password ? { password: formVal.password } : {})
    };

    const userId = this.id();
    try {
      if (userId) {
        await this.service.actualizarUsuario(userId, payload);
      } else {
        await this.service.crearUsuario(payload);
      }
      this.router.navigate(['/admin/accesos/usuarios']);
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando.set(false);
    }
  }
}
