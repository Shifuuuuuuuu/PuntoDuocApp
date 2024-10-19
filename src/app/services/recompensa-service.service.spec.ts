import { TestBed } from '@angular/core/testing';

import { RecompensaService } from '../services/recompensa-service.service';

describe('RecompensaServiceService', () => {
  let service: RecompensaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecompensaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
