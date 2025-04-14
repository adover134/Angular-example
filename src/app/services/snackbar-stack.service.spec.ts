import { TestBed } from '@angular/core/testing';

import { SnackbarStackService } from './snackbar-stack.service';

describe('SnackbarStackService', () => {
  let service: SnackbarStackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnackbarStackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
