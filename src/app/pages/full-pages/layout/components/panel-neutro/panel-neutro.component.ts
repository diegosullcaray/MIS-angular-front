import { Component, computed, inject } from '@angular/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { MenuStgService } from '../../services/menu-stg.service';

@Component({
  selector: 'app-panel-neutro',
  standalone: true,
  imports: [],
  templateUrl: './panel-neutro.component.html',
  styleUrl: './panel-neutro.component.css',
})
export class PanelNeutroComponent {
  protected readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);

  protected readonly tituloSistema = computed(() => {
    const id = this.shell.sidebarIconActivo();
    if (id === 'host-inicio') return 'Inicio';
    if (id === 'ranking-k') return 'Ranking Kaypacha';
    if (id === 'analista') return 'Analista';
    const sistema = this.menuStg.sistemas().find((s) => s.id === id);
    return sistema?.etiqueta || 'Módulo de Gestión';
  });

  protected readonly iconoSistema = computed(() => {
    const id = this.shell.sidebarIconActivo();
    if (id === 'host-inicio') return 'pi pi-home';
    if (id === 'ranking-k') return 'pi pi-trophy';
    if (id === 'analista') return 'pi pi-chart-line';
    const sistema = this.menuStg.sistemas().find((s) => s.id === id);
    return sistema?.icono || 'pi pi-th-large';
  });
}
