import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideShieldAlert } from '@ng-icons/lucide';

/**
 * Estado de acceso denegado — se muestra cuando el usuario intenta
 * entrar a una vista restringida para su rol (F3B-09).
 */
@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ lucideShieldAlert, lucideArrowLeft })],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.css',
})
export class AccessDeniedComponent {
  readonly mensaje = input<string>(
    'No tienes permisos para acceder a esta sección. Contacta al Administrador del Sistema.'
  );
}
