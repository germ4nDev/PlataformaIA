import { TestBed } from '@angular/core/testing';

import { ContextoNavegacionService } from './contexto-navegacion.service';

describe('ContextoNavegacionService', () => {
  let service: ContextoNavegacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContextoNavegacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
