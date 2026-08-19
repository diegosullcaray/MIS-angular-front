import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemNotificacionesComponent } from './item-notificaciones.component';
import { NotificationPreferencesService } from '../../../../../full-pages/layout/services/notification-preferences.service';

describe('ItemNotificacionesComponent', () => {
  let component: ItemNotificacionesComponent;
  let fixture: ComponentFixture<ItemNotificacionesComponent>;
  let preferencesService: jasmine.SpyObj<NotificationPreferencesService>;

  beforeEach(async () => {
    const preferencesServiceSpy = jasmine.createSpyObj('NotificationPreferencesService', [
      'loadPreferences'
    ]);

    await TestBed.configureTestingModule({
      imports: [ItemNotificacionesComponent],
      providers: [
        { provide: NotificationPreferencesService, useValue: preferencesServiceSpy }
      ]
    }).compileComponents();

    preferencesService = TestBed.inject(
      NotificationPreferencesService
    ) as jasmine.SpyObj<NotificationPreferencesService>;

    fixture = TestBed.createComponent(ItemNotificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT load preferences on init (loaded by app.component on login)', () => {
    expect(preferencesService.loadPreferences).not.toHaveBeenCalled();
  });
});
