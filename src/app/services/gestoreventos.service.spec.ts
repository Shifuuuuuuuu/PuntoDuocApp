import { TestBed } from '@angular/core/testing';

import { GestoreventosService } from './gestoreventos.service';

describe('GestoreventosService', () => {
  let service: GestoreventosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestoreventosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
