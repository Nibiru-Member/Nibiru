import { TestBed } from '@angular/core/testing';

import { ServerStateService } from './server-state.service';

describe('ServerStateService', () => {
  let service: ServerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
