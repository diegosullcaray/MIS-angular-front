import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemEstructuraComponent } from './item-estructura.component';

describe('ItemEstructuraComponent', () => {
  let component: ItemEstructuraComponent;
  let fixture: ComponentFixture<ItemEstructuraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemEstructuraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemEstructuraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
