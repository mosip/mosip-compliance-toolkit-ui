import { TestBed, inject } from '@angular/core/testing';

import { DataService } from './data-service';

describe('DataStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService],
    });
  });

  it('should be created', inject([DataService], (service: DataService) => {
    expect(service).toBeTruthy();
  }));
});
