import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemIdiomasComponent } from './item-idiomas.component';

describe('ItemIdiomasComponent', () => {
  let component: ItemIdiomasComponent;
  let fixture: ComponentFixture<ItemIdiomasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemIdiomasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemIdiomasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
