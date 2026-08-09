import { TestBed } from '@angular/core/testing';
import { DetalleTablaDialogComponent } from './detalle-tabla-dialog.component';

describe('DetalleTablaDialogComponent', () => {
  function crear() {
    TestBed.configureTestingModule({ imports: [DetalleTablaDialogComponent] });
    const fixture = TestBed.createComponent(DetalleTablaDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const spy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(spy);

    fixture.componentInstance['cerrar']();

    expect(spy).toHaveBeenCalledWith(false);
  });
});
