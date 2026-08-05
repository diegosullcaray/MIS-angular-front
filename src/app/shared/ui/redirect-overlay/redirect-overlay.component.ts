import { Component, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RedirectOverlayService } from '../../services/redirect-overlay.service';

@Component({
  selector: 'app-redirect-overlay',
  standalone: true,
  imports: [ProgressSpinnerModule],
  templateUrl: './redirect-overlay.component.html',
  styleUrl: './redirect-overlay.component.css',
})
export class RedirectOverlayComponent {
  protected readonly redirect = inject(RedirectOverlayService);
}
