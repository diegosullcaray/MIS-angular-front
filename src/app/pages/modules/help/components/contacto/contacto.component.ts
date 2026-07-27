import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLifeBuoy, lucideMail, lucidePhone, lucideClock } from '@ng-icons/lucide';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CardModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideLifeBuoy, lucideMail, lucidePhone, lucideClock })],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css',
})
export class ContactoComponent {}
