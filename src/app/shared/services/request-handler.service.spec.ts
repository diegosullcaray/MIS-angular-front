import { TestBed } from '@angular/core/testing';
import { of, throwError, delay } from 'rxjs';
import { RequestHandlerService } from './request-handler.service';
import { LoadingService } from './loading.service';

describe('RequestHandlerService', () => {
  let service: RequestHandlerService;
  let loadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);

    TestBed.configureTestingModule({
      providers: [
        RequestHandlerService,
        { provide: LoadingService, useValue: loadingServiceSpy }
      ]
    });

    service = TestBed.inject(RequestHandlerService);
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show and hide loading during successful request', (done) => {
    const testData = { message: 'test' };
    const mockObservable = of(testData).pipe(delay(10));

    service.handle(mockObservable, 'Testing...').subscribe({
      next: (result) => {
        expect(result).toEqual(testData);
        expect(loadingService.show).toHaveBeenCalledWith('Testing...');
        expect(loadingService.hide).toHaveBeenCalled();
        done();
      },
      error: done.fail
    });
  });

  it('should hide loading on error', (done) => {
    const errorObservable = throwError(() => new Error('Test error'));

    service.handle(errorObservable).subscribe({
      next: () => done.fail('Should not succeed'),
      error: (error) => {
        expect(error.message).toBe('Test error');
        expect(loadingService.show).toHaveBeenCalled();
        expect(loadingService.hide).toHaveBeenCalledTimes(2); // Una en finalize, otra en catchError
        done();
      }
    });
  });

  it('should handle multiple requests with forkJoin', (done) => {
    const req1 = of('result1').pipe(delay(10));
    const req2 = of('result2').pipe(delay(15));
    const requests = [req1, req2];

    service.handleMultiple(requests, 'Multiple requests...').subscribe({
      next: (results) => {
        expect(results).toEqual(['result1', 'result2']);
        expect(loadingService.show).toHaveBeenCalledWith('Multiple requests...');
        expect(loadingService.hide).toHaveBeenCalled();
        done();
      },
      error: done.fail
    });
  });

  it('should handle empty request array', (done) => {
    service.handleMultiple([], 'Empty requests').subscribe({
      next: (results) => {
        expect(results).toEqual([]);
        done();
      },
      error: done.fail
    });
  });

  it('should show loading without auto-hide for manual requests', () => {
    const testObservable = of('test data');

    const result$ = service.handleManual(testObservable, 'Manual loading...');

    expect(loadingService.show).toHaveBeenCalledWith('Manual loading...');
    expect(loadingService.hide).not.toHaveBeenCalled();

    // Verificar que el observable original no se modifique
    result$.subscribe(result => {
      expect(result).toBe('test data');
    });
  });
});
