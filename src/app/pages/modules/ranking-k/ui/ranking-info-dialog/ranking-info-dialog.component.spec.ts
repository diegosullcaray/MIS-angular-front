import { TestBed } from '@angular/core/testing';
import { RankingInfoDialogComponent } from './ranking-info-dialog.component';

describe('RankingInfoDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RankingInfoDialogComponent] });
  });

  it('empieza cerrado', () => {
    const fixture = TestBed.createComponent(RankingInfoDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['visible']()).toBe(false);
  });

  it('abrir() muestra el diálogo y cerrar() lo oculta', () => {
    const fixture = TestBed.createComponent(RankingInfoDialogComponent);
    fixture.detectChanges();
    const instancia = fixture.componentInstance;

    instancia['abrir']();
    expect(instancia['visible']()).toBe(true);

    instancia['cerrar']();
    expect(instancia['visible']()).toBe(false);
  });
});
