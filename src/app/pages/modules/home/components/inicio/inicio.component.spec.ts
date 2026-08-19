import { TestBed } from '@angular/core/testing';
import { InicioComponent } from './inicio.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';

function usuario(nombre: string): UsuarioActivo {
  return {
    id: 'u-1',
    nombre,
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
  } as UsuarioActivo;
}

describe('InicioComponent', () => {
  let shell: ShellStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InicioComponent] });
    shell = TestBed.inject(ShellStateService);
  });

  function crear() {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
    return fixture;
  }

  // El backend manda el nombre completo en orden registral
  // (apellido paterno, apellido materno, nombres); el saludo usa el trato
  // corriente: primer nombre + segundo apellido.
  it('nombreCorto() saluda con el primer nombre y el segundo apellido', () => {
    shell.setUsuarioActivo(usuario('SANCHEZ QUISPE OSCAR ANDRE'));

    const fixture = crear();

    expect(fixture.componentInstance['nombreCorto']()).toBe('OSCAR QUISPE');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¡Hola, OSCAR QUISPE!');
  });

  it('nombreCorto() devuelve el texto tal cual si no trae los tres componentes del nombre', () => {
    shell.setUsuarioActivo(usuario('Ana Torres'));

    expect(crear().componentInstance['nombreCorto']()).toBe('Ana Torres');
  });

  // Algunos endpoints ya devuelven el saludo armado; no debe quedar duplicado.
  it('nombreCorto() descarta el "¡Hola, ...!" que pueda venir en la data', () => {
    shell.setUsuarioActivo(usuario('¡Hola, Ana!'));

    const fixture = crear();

    expect(fixture.componentInstance['nombreCorto']()).toBe('Ana');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¡Hola, Ana!');
  });

  it('nombreCorto() es vacío sin usuario activo', () => {
    expect(crear().componentInstance['nombreCorto']()).toBe('');
  });
});
