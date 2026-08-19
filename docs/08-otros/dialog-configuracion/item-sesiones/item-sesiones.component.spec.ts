import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemSesionesComponent } from './item-sesiones.component';

describe('ItemSesionesComponent', () => {
  let component: ItemSesionesComponent;
  let fixture: ComponentFixture<ItemSesionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemSesionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemSesionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
