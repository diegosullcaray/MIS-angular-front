import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PanelAnunciosComponent } from './panel-anuncios.component';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';

describe('PanelAnunciosComponent', () => {
  let mockAnuncios: ReturnType<typeof signal<{ silenciar: boolean }>>;
  let mockPreferenciasService: {
    anuncios: ReturnType<typeof signal<{ silenciar: boolean }>>;
    setSilenciarAnuncios: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAnuncios = signal({ silenciar: false });
    mockPreferenciasService = {
      anuncios: mockAnuncios,
      setSilenciarAnuncios: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PanelAnunciosComponent],
      providers: [
        { provide: PreferenciasService, useValue: mockPreferenciasService },
      ],
    });
  });

  it('se crea correctamente y muestra la opción de silenciar comunicados', () => {
    const fixture = TestBed.createComponent(PanelAnunciosComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No mostrarme comunicados');
  });

  it('llama a setSilenciarAnuncios al cambiar el estado del switch', () => {
    const fixture = TestBed.createComponent(PanelAnunciosComponent);
    fixture.detectChanges();

    fixture.componentInstance['setSilenciar'](true);
    expect(mockPreferenciasService.setSilenciarAnuncios).toHaveBeenCalledWith(true);
  });
});
