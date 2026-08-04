import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FullscreenService implements OnDestroy {
  private isFullscreenSubject = new BehaviorSubject<boolean>(this.getFullscreenState());
  public isFullscreen$ = this.isFullscreenSubject.asObservable();

  private resizeHandler: () => void;

  constructor(private ngZone: NgZone) {
    document.onfullscreenchange = () => {
      requestAnimationFrame(() => {
        const state = this.getFullscreenState();
        this.ngZone.run(() => {
          this.isFullscreenSubject.next(state);
        });
      });
    };

    (document as any).onwebkitfullscreenchange = () => {
      requestAnimationFrame(() => {
        const state = this.getFullscreenState();
        this.ngZone.run(() => {
          this.isFullscreenSubject.next(state);
        });
      });
    };

    this.resizeHandler = () => {
      requestAnimationFrame(() => {
        const state = this.getFullscreenState();
        this.ngZone.run(() => {
          this.isFullscreenSubject.next(state);
        });
      });
    };
    window.addEventListener('resize', this.resizeHandler, true);
  }

  private getFullscreenState(): boolean {
    return !!(document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler, true);
  }
}
