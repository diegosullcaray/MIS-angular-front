import { TestBed } from '@angular/core/testing';
import { AdsDialogComponent } from './ads-dialog.component';

describe('AdsDialogComponent', () => {
  it('se crea correctamente', () => {
    TestBed.configureTestingModule({ imports: [AdsDialogComponent] });
    const fixture = TestBed.createComponent(AdsDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
