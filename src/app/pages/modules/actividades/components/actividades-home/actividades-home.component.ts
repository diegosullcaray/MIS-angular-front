import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import type { ActividadCard } from '../../models/actividades.model';

@Component({
  selector: 'app-actividades-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './actividades-home.component.html',
  styleUrl: './actividades-home.component.css',
})
export class ActividadesHomeComponent {
  readonly cards: ActividadCard[] = [
    {
      titulo: 'Destino de Crédito',
      descripcion: 'Seguimiento del cumplimiento del destino de crédito desembolsado a clientes. Registre fechas de visita y valide el cumplimiento.',
      icono: 'pi pi-compass',
      ruta: 'dest-credito',
      colorBg: 'rgba(3,80,150,0.08)',
      colorIcon: '#035096',
      badge: 'Seguimiento',
    },
    {
      titulo: 'Prospectos Corresponsal',
      descripcion: 'Gestión y registro de nuevos prospectos para el sistema corresponsal. Alta de nuevos agentes potenciales.',
      icono: 'pi pi-users',
      ruta: 'reg-prosp-corr',
      colorBg: 'rgba(156,59,71,0.08)',
      colorIcon: '#9C3B47',
      badge: 'Registro',
    },
    {
      titulo: 'Transacciones Corresponsal',
      descripcion: 'Consulta del historial de transacciones, consultas RUC/RCC y estado de corresponsales instalados.',
      icono: 'pi pi-bolt',
      ruta: 'regprosp-corr',
      colorBg: 'rgba(6,95,70,0.08)',
      colorIcon: '#065f46',
      badge: 'Consulta',
    },
  ];
}
