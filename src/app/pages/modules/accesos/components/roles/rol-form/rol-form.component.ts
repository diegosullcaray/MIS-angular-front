import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccesosService } from '../../../services/accesos.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
    ReactiveFormsModule,
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
  private readonly fb        = inject(FormBuilder);
  private readonly router    = inject(Router);

  // Input bound from route parameter :id
  readonly id = input<string>();

  protected form!: FormGroup;
  protected readonly cargando = signal(false);

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
    const rolId = this.id();
    if (rolId) {
      // Edit Mode
      const rol = this.service.getRolById(rolId);
      if (rol) {
        this.form.patchValue({
          nombre: rol.nombre,
          slug: rol.slug
        });
        this.form.get('slug')?.disable(); // Can't edit slug key
        this.selectedRemotes = [...rol.subsistemas];
      } else {
        this.router.navigate(['/admin/accesos/roles']);
      }
    }
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]]
    });
  }

  protected onNombreInput(): void {
    if (this.id()) return; // Don't auto-slug on edit

    const nombreVal = this.form.get('nombre')?.value || '';
    const slugVal = nombreVal
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove specials
      .replace(/\s+/g, '-');       // space to dash
    this.form.patchValue({ slug: slugVal });
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
    const formVal = this.form.getRawValue();
    const payload = {
      nombre: formVal.nombre.trim(),
      slug: formVal.slug.trim(),
      subsistemas: this.selectedRemotes
    };

    const rolId = this.id();
    try {
      if (rolId) {
        await this.service.actualizarRol(rolId, payload);
      } else {
        await this.service.crearRol(payload);
      }
      this.router.navigate(['/admin/accesos/roles']);
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando.set(false);
    }
  }
}
