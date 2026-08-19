import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemTemasComponent } from './item-temas.component';

describe('ItemTemasComponent', () => {
  let component: ItemTemasComponent;
  let fixture: ComponentFixture<ItemTemasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemTemasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemTemasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
