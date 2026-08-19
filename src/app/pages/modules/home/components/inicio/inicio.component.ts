import { Component, computed, inject } from '@angular/core';
import {provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';


@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [],
  viewProviders: [provideIcons({ lucideTrophy })],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly shell = inject(ShellStateService);

  constructor() {
  }

protected readonly nombreCorto = computed(() => {
  const dataCruda = this.shell.usuarioActivo()?.nombre ?? '';

  // 1. Limpiamos "¡Hola, " y el "!" del string original
  const nombreLimpio = dataCruda.replace(/¡Hola,\s*|!/g, '').trim();

  // Si está vacío, retornamos vacío
  if (!nombreLimpio) return '';

  // 2. Separamos las palabras por espacios
  // Ejemplo: ['SANCHEZ', 'QUISPE', 'OSCAR', 'ANDRE']
  const partes = nombreLimpio.split(/\s+/);

  // Verificamos que tenga al menos 3 partes (2 apellidos y 1 nombre) para evitar errores
  if (partes.length >= 3) {
    const segundoApellido = partes[1]; // Índice 1: QUISPE
    const primerNombre = partes[2];    // Índice 2: OSCAR
    
    return `${primerNombre} ${segundoApellido}`;
  }

  // Fallback: si no tiene el formato esperado, devolvemos el texto limpio
  return nombreLimpio;
});
}
