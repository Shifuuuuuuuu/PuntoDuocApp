import { TestBed } from '@angular/core/testing';

import { EventosGestorService } from './eventos-gestor.service';

describe('EventosGestorService', () => {
  let service: EventosGestorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventosGestorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
