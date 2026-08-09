import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './listas.component.html',
  styleUrl: './listas.component.css',
})
export class ListasComponent {
  protected readonly enlaces = ENLACES;
}
