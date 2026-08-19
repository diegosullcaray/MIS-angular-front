import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPreferenciasComponent } from './item-preferencias.component';

describe('ItemPreferenciasComponent', () => {
  let component: ItemPreferenciasComponent;
  let fixture: ComponentFixture<ItemPreferenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemPreferenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemPreferenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
