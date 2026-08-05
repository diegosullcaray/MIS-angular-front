import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ErrorPageComponent } from './error-page.component';

describe('ErrorPageComponent', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ErrorPageComponent],
      providers: [provideRouter([])],
    });
    router = TestBed.inject(Router);
  });

  it('usa el código 500 por defecto cuando no se pasa route param', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('500');
    expect(texto).toContain('Algo salió mal'); // fallback (500 no está en HTTP_ERROR_MESSAGES)
  });

  it('muestra el título/mensaje mapeado para un código conocido (403)', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.componentRef.setInput('code', '403');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('403');
    expect(texto).toContain('Acceso denegado');
  });

  it('acción "login" (401) navega a /login al hacer clic en el botón principal', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.componentRef.setInput('code', '401');
    fixture.detectChanges();
    const navSpy = vi.spyOn(router, 'navigateByUrl');

    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();

    expect(navSpy).toHaveBeenCalledWith('/login');
  });

  it('acción "home" (403) navega a /app/dashboard al hacer clic en el botón principal', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.componentRef.setInput('code', '403');
    fixture.detectChanges();
    const navSpy = vi.spyOn(router, 'navigateByUrl');

    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();

    expect(navSpy).toHaveBeenCalledWith('/app/dashboard');
  });

  it('acción "back" (404) usa Location.back() al hacer clic en el botón principal', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.componentRef.setInput('code', '404');
    fixture.detectChanges();
    const backSpy = vi.spyOn(TestBed.inject(Location), 'back').mockImplementation(() => {});

    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();

    expect(backSpy).toHaveBeenCalled();
  });

  it('acción "retry" (408) recarga la página', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.componentRef.setInput('code', '408');
    fixture.detectChanges();
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();

    expect(reloadSpy).toHaveBeenCalled();
  });
});
