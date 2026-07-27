import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { RemoteWrapperComponent } from './remote-wrapper.component';
import { loadRemoteModule } from '@angular-architects/native-federation';

vi.mock('@angular-architects/native-federation', () => ({
  loadRemoteModule: vi.fn(),
}));

const loadRemoteModuleMock = loadRemoteModule as unknown as ReturnType<typeof vi.fn>;

@Component({ selector: 'app-stub-a', standalone: true, template: '<p>Contenido A</p>' })
class ComponenteRemotoA {}

@Component({ selector: 'app-stub-b', standalone: true, template: '<p>Contenido B</p>' })
class ComponenteRemotoB {}

describe('RemoteWrapperComponent', () => {
  beforeEach(() => {
    loadRemoteModuleMock.mockReset();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('muestra el skeleton mientras el remote está cargando', async () => {
    loadRemoteModuleMock.mockReturnValue(new Promise(() => {})); // nunca resuelve

    const fixture = TestBed.createComponent(RemoteWrapperComponent);
    fixture.componentRef.setInput('remoteName', 'subsistema-reportes');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-remote-skeleton')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-remote-error')).toBeFalsy();
  });

  it('inyecta el componente del remote cuando la carga se resuelve (CA-01)', async () => {
    loadRemoteModuleMock.mockResolvedValue({ default: ComponenteRemotoA });

    const fixture = TestBed.createComponent(RemoteWrapperComponent);
    fixture.componentRef.setInput('remoteName', 'subsistema-reportes');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadRemoteModuleMock).toHaveBeenCalledWith({
      remoteName: 'subsistema-reportes',
      exposedModule: './Component',
    });
    expect(fixture.nativeElement.textContent).toContain('Contenido A');
    expect(fixture.nativeElement.querySelector('app-remote-skeleton')).toBeFalsy();
  });

  it('muestra el error elegante sin romper la shell cuando el remote falla (CA-04)', async () => {
    loadRemoteModuleMock.mockRejectedValue(new Error('Remote no disponible'));

    const fixture = TestBed.createComponent(RemoteWrapperComponent);
    fixture.componentRef.setInput('remoteName', 'subsistema-caido');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-remote-error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-remote-skeleton')).toBeFalsy();
  });

  it('descarta una respuesta tardía si el usuario ya cambió de remote', async () => {
    let resolverA!: (value: unknown) => void;
    loadRemoteModuleMock.mockImplementationOnce(
      () => new Promise((resolve) => { resolverA = resolve; })
    );

    const fixture = TestBed.createComponent(RemoteWrapperComponent);
    fixture.componentRef.setInput('remoteName', 'subsistema-a');
    fixture.detectChanges();
    await fixture.whenStable();

    // El usuario navega a otro remote antes de que la primera carga resuelva
    loadRemoteModuleMock.mockImplementationOnce(() => Promise.resolve({ default: ComponenteRemotoB }));
    fixture.componentRef.setInput('remoteName', 'subsistema-b');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Contenido B');

    // La respuesta tardía de 'subsistema-a' llega ahora: debe descartarse
    resolverA({ default: ComponenteRemotoA });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Contenido B');
    expect(fixture.nativeElement.textContent).not.toContain('Contenido A');
  });
});
