import { TestBed } from '@angular/core/testing';

import { VentasAuthService } from './ventas.service';

describe('VentasService', () => {
  let service: VentasAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentasAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
