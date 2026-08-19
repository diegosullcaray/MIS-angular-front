import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemMfaComponent } from './item-mfa.component';

describe('ItemMfaComponent', () => {
  let component: ItemMfaComponent;
  let fixture: ComponentFixture<ItemMfaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemMfaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemMfaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
