import { TestBed } from '@angular/core/testing';
import { DestinoCreditoInfoDialogComponent } from './destino-credito-info-dialog.component';

describe('DestinoCreditoInfoDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DestinoCreditoInfoDialogComponent] });
  });

  it('empieza cerrado', () => {
    const fixture = TestBed.createComponent(DestinoCreditoInfoDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['visible']()).toBe(false);
  });

  it('abrir() muestra el diálogo y cerrar() lo oculta', () => {
    const fixture = TestBed.createComponent(DestinoCreditoInfoDialogComponent);
    fixture.detectChanges();
    const instancia = fixture.componentInstance;

    instancia['abrir']();
    expect(instancia['visible']()).toBe(true);

    instancia['cerrar']();
    expect(instancia['visible']()).toBe(false);
  });
});
