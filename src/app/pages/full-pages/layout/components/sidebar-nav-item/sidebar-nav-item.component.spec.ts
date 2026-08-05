import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';

describe('SidebarNavItemComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarNavItemComponent],
      providers: [provideRouter([])],
    });
  });

  function crear(ruta: SidebarNavRuta) {
    const fixture = TestBed.createComponent(SidebarNavItemComponent);
    fixture.componentRef.setInput('ruta', ruta);
    fixture.detectChanges();
    return fixture;
  }

  it('una hoja (sin hijos) emite rutaSeleccionada al hacer clic', () => {
    const fixture = crear({ etiqueta: 'Categoría A', ruta: '/app/ranking-k/categoria/1' });
    let emitido: string | undefined;
    fixture.componentInstance.rutaSeleccionada.subscribe((r) => (emitido = r));

    (fixture.nativeElement as HTMLElement).querySelector('a')?.dispatchEvent(new MouseEvent('click'));

    expect(emitido).toBe('/app/ranking-k/categoria/1');
  });

  it('un grupo (con hijos) emite expandChange en vez de navegar', () => {
    const fixture = crear({
      etiqueta: 'Grupo',
      hijos: [{ etiqueta: 'Hijo 1', ruta: '/x' }],
    });
    fixture.componentRef.setInput('depth', 2);
    fixture.componentRef.setInput('index', 3);
    fixture.detectChanges();

    let recibido: { depth: number; index: number } | undefined;
    fixture.componentInstance.expandChange.subscribe((e) => (recibido = e));
    let rutaEmitida: string | undefined;
    fixture.componentInstance.rutaSeleccionada.subscribe((r) => (rutaEmitida = r));

    (fixture.nativeElement as HTMLElement).querySelector('a')?.dispatchEvent(new MouseEvent('click'));

    expect(recibido).toEqual({ depth: 2, index: 3 });
    expect(rutaEmitida).toBeUndefined();
  });

  it('un enlace externo (Jira/Imparables/Helpdesk) dispara el overlay de redirección en vez de rutaSeleccionada', () => {
    const redirect = TestBed.inject(RedirectOverlayService);
    const spy = vi.spyOn(redirect, 'redirigir').mockImplementation(() => {});

    const fixture = crear({ etiqueta: 'Jira - Mesa de ayuda', ruta: 'jira' });
    let rutaEmitida: string | undefined;
    fixture.componentInstance.rutaSeleccionada.subscribe((r) => (rutaEmitida = r));

    (fixture.nativeElement as HTMLElement).querySelector('a')?.dispatchEvent(new MouseEvent('click'));

    expect(spy).toHaveBeenCalledWith('Jira - Mesa de ayuda', undefined);
    expect(rutaEmitida).toBeUndefined();
  });

  it('una ruta http:// externa pasa la URL directa al overlay de redirección', () => {
    const redirect = TestBed.inject(RedirectOverlayService);
    const spy = vi.spyOn(redirect, 'redirigir').mockImplementation(() => {});

    const fixture = crear({ etiqueta: 'Portal externo', ruta: 'http://ejemplo.com/portal' });

    (fixture.nativeElement as HTMLElement).querySelector('a')?.dispatchEvent(new MouseEvent('click'));

    expect(spy).toHaveBeenCalledWith('Portal externo', 'http://ejemplo.com/portal');
  });

  it('renderiza el ícono cuando la ruta lo trae, y un punto cuando no', () => {
    const conIcono = crear({ etiqueta: 'A', ruta: '/a', icono: 'pi pi-home' });
    expect((conIcono.nativeElement as HTMLElement).querySelector('i')).not.toBeNull();

    const sinIcono = crear({ etiqueta: 'B', ruta: '/b' });
    expect((sinIcono.nativeElement as HTMLElement).querySelector('.nav-item-dot')).not.toBeNull();
  });

  it('propaga expandChange y rutaSeleccionada emitidos por un hijo anidado', () => {
    const fixture = crear({
      etiqueta: 'Grupo',
      hijos: [{ etiqueta: 'Hoja', ruta: '/hoja' }],
    });
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    let rutaEmitida: string | undefined;
    fixture.componentInstance.rutaSeleccionada.subscribe((r) => (rutaEmitida = r));

    const hijoLink = (fixture.nativeElement as HTMLElement).querySelector('app-sidebar-nav-item a');
    hijoLink?.dispatchEvent(new MouseEvent('click'));

    expect(rutaEmitida).toBe('/hoja');
  });
});
