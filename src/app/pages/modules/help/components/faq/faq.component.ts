import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideHelpCircle } from '@ng-icons/lucide';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [AccordionModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideHelpCircle })],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  protected readonly preguntas: PreguntaFrecuente[] = [
    {
      pregunta: '¿Cómo inicio sesión en el MIS?',
      respuesta: 'Ingresa tu correo y contraseña corporativos en la pantalla de inicio de sesión y presiona "Acceder". Si tus credenciales son correctas, entrarás directo a "Mi espacio".',
    },
    {
      pregunta: '¿Qué hago si olvidé mi contraseña?',
      respuesta: 'Usa el enlace "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión, o contacta a soporte técnico para que la restablezcan por ti.',
    },
    {
      pregunta: '¿Por qué no veo todos los sistemas en la barra lateral?',
      respuesta: 'La barra lateral solo muestra los subsistemas (Remotes) habilitados para tu rol. Si necesitas acceso a uno adicional, pídele a un Administrador del Sistema que lo asigne desde Gestión de Accesos.',
    },
    {
      pregunta: '¿Qué significa que un sistema esté en "Mantenimiento"?',
      respuesta: 'Indica que ese subsistema está temporalmente fuera de servicio para actualizaciones. El Host sigue funcionando con normalidad; solo ese Remote específico no estará disponible.',
    },
    {
      pregunta: '¿Quién puede gestionar usuarios y roles?',
      respuesta: 'Únicamente el rol Administrador del Sistema tiene acceso a Gestión de Accesos (usuarios, roles) y Gestión de Sistemas.',
    },
  ];
}
