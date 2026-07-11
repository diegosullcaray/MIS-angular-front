import { Component, inject, signal, computed } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({
    lucideChevronDown, lucideUser, lucideSettings,
    lucideLogOut, lucideBell, lucideSearch,
  })],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly shell = inject(ShellStateService);
  protected readonly dropdownOpen = signal(false);

  protected readonly rolLabel = computed(() => {
    const labels: Record<string, string> = {
      'admin-sistema':   'Admin Sistema',
      'admin-general':   'Admin General',
      'supervisor-area': 'Supervisor',
    };
    return labels[this.shell.usuarioActivo()?.rol ?? ''] ?? '';
  });

  protected toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  protected cerrarSesion(): void {
    this.shell.cerrarSesion();
    this.dropdownOpen.set(false);
  }
}
