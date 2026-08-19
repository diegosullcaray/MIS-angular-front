import { TestBed } from '@angular/core/testing';
import { MessageService as PrimeMessageService } from 'primeng/api';

import { MessageService } from './message.service';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PrimeMessageService] });
    service = TestBed.inject(MessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
