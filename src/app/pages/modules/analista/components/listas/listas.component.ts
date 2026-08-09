import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

interface EnlaceListaAnalista {
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
}

const ENLACES: EnlaceListaAnalista[] = [
  {
    nombre: 'Priorización de Leads',
    descripcion: 'Campañas y gestión de leads asignados.',
    icono: 'pi pi-bolt',
    ruta: 'priorizacion-leads',
  },
  {
    nombre: 'Becas Financiera Confianza',
    descripcion: 'Clientes postulantes a prospectar para becas.',
    icono: 'pi pi-graduation-cap',
    ruta: 'becas',
  },
];

/**
 * Listas (`/app/analista/listas`) — migrado de `ListasComponent` (legado
 * STG, `docs/07-modulos/analista/listas`). Solo un menú de 2 tarjetas que
 * navegan a Priorización de Leads y Becas.
 */
@Component({
  selector: 'app-listas-analista',
  standalone: true,
  imports: [RouterLink, ButtonModule, TooltipModule],
  templateUrl: './listas.component.html',
  styleUrl: './listas.component.css',
})
export class ListasComponent {
  private readonly router = inject(Router);

  protected readonly enlaces = ENLACES;

  protected volver(): void {
    this.router.navigate(['/app/analista']);
  }
}
