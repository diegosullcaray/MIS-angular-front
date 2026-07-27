import { Component } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideLogIn, lucideUsers, lucideBoxes } from '@ng-icons/lucide';

interface Guia {
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-guias',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideBookOpen, lucideLogIn, lucideUsers, lucideBoxes })],
  templateUrl: './guias.component.html',
  styleUrl: './guias.component.css',
})
export class GuiasComponent {
  protected readonly guias: Guia[] = [
    {
      icono: 'lucideLogIn',
      titulo: 'Iniciar sesión',
      descripcion: 'Ingresa con tu correo y contraseña corporativos desde la pantalla de inicio de sesión. Al validarse, entrás directo a "Mi espacio".',
    },
    {
      icono: 'lucideUsers',
      titulo: 'Gestionar usuarios y roles',
      descripcion: 'Desde Gestión de Accesos podés crear usuarios, definir roles y asignarles los subsistemas que cada uno puede ver, si tenés el rol de Administrador del Sistema.',
    },
    {
      icono: 'lucideBoxes',
      titulo: 'Navegar entre sistemas',
      descripcion: 'Los sistemas habilitados para tu rol aparecen como íconos en la barra lateral izquierda. Al seleccionar uno, el panel de la Columna 2 muestra su menú propio.',
    },
  ];
}
