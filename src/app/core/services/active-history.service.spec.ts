import { TestBed } from '@angular/core/testing';

import { ActiveHistoryService } from './active-history.service';

describe('ActiveHistoryService', () => {
  let service: ActiveHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
