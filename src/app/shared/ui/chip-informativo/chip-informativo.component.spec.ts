import { TestBed } from '@angular/core/testing';
import { ChipInformativoComponent } from './chip-informativo.component';

describe('ChipInformativoComponent', () => {
  function crear(texto: string, severidad?: 'info' | 'danger') {
    const fixture = TestBed.createComponent(ChipInformativoComponent);
    fixture.componentRef.setInput('texto', texto);
    if (severidad) fixture.componentRef.setInput('severidad', severidad);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el texto en un p-tag informativo con ícono', () => {
    const el = crear('Expresado en PEN y %');
    const tag = el.querySelector('p-tag') as HTMLElement;

    expect(tag.textContent).toContain('Expresado en PEN y %');
    expect(tag.className).toContain('p-tag-info');
    expect(el.querySelector('.pi-info-circle')).not.toBeNull();
  });

  it('respeta la severidad del semáforo', () => {
    const tag = crear('Cumplimiento de Meta: 80%', 'danger').querySelector('p-tag') as HTMLElement;
    expect(tag.className).toContain('p-tag-danger');
  });
});
