import { TestBed } from '@angular/core/testing';

import { PtltiposWidgetService } from './ptltipos-widget.service';

describe('PtltiposWidgetService', () => {
  let service: PtltiposWidgetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PtltiposWidgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
