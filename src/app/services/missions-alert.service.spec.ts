import { TestBed } from '@angular/core/testing';

import { MissionsAlertService } from './missions-alert.service';

describe('MissionsAlertService', () => {
  let service: MissionsAlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MissionsAlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
