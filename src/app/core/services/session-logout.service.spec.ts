import { TestBed } from '@angular/core/testing';

import { SessionLogoutService } from './session-logout.service';

describe('SessionLogoutService', () => {
  let service: SessionLogoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionLogoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
