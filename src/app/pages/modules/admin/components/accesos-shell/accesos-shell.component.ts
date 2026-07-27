import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccesosService } from '../../services/accesos.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUsers, lucideShield, lucideArrowRight, lucideUserCheck, lucideSettings } from '@ng-icons/lucide';

@Component({
  selector: 'app-accesos-shell',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, NgIconComponent],
  viewProviders: [provideIcons({
    lucideUsers, lucideShield, lucideArrowRight, lucideUserCheck, lucideSettings
  })],
  templateUrl: './accesos-shell.component.html',
  styleUrl: './accesos-shell.component.css',
})
export class AccesosShellComponent implements OnInit {
  protected readonly service = inject(AccesosService);

  ngOnInit(): void {
    this.service.cargarUsuarios();
    this.service.cargarRoles();
  }
}
