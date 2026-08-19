import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfiguracionComponent } from './dialog-configuracion.component';

describe('DialogConfiguracionComponent', () => {
  let component: DialogConfiguracionComponent;
  let fixture: ComponentFixture<DialogConfiguracionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogConfiguracionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogConfiguracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
