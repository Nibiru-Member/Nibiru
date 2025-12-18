import { TestBed } from '@angular/core/testing';

import { ActivityLoggerService } from './activity-logger.service';

describe('ActivityLoggerService', () => {
  let service: ActivityLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
