import { TestBed } from '@angular/core/testing';

import { HistorialEventosService } from './historial-eventos.service';

describe('HistorialEventosService', () => {
  let service: HistorialEventosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistorialEventosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
