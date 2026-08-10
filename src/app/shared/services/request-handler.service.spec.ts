import { TestBed } from '@angular/core/testing';
import { of, throwError, delay } from 'rxjs';
import { RequestHandlerService } from './request-handler.service';
import { LoadingService } from './loading.service';

describe('RequestHandlerService', () => {
  let service: RequestHandlerService;
  let loadingService: { show: ReturnType<typeof vi.fn>; hide: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    loadingService = { show: vi.fn(), hide: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        RequestHandlerService,
        { provide: LoadingService, useValue: loadingService }
      ]
    });

    service = TestBed.inject(RequestHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show and hide loading during successful request', async () => {
    const testData = { message: 'test' };
    const mockObservable = of(testData).pipe(delay(10));

    const result = await new Promise((resolve, reject) => {
      service.handle(mockObservable, 'Testing...').subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual(testData);
    expect(loadingService.show).toHaveBeenCalledWith('Testing...');
    expect(loadingService.hide).toHaveBeenCalled();
  });

  it('should hide loading on error', async () => {
    const errorObservable = throwError(() => new Error('Test error'));

    const error = await new Promise((resolve, reject) => {
      service.handle(errorObservable).subscribe({ next: reject, error: resolve });
    });

    expect((error as Error).message).toBe('Test error');
    expect(loadingService.show).toHaveBeenCalled();
    expect(loadingService.hide).toHaveBeenCalledTimes(2); // Una en finalize, otra en catchError
  });

  it('should handle multiple requests with forkJoin', async () => {
    const req1 = of('result1').pipe(delay(10));
    const req2 = of('result2').pipe(delay(15));
    const requests = [req1, req2];

    const results = await new Promise((resolve, reject) => {
      service.handleMultiple(requests, 'Multiple requests...').subscribe({ next: resolve, error: reject });
    });

    expect(results).toEqual(['result1', 'result2']);
    expect(loadingService.show).toHaveBeenCalledWith('Multiple requests...');
    expect(loadingService.hide).toHaveBeenCalled();
  });

  it('should handle empty request array', async () => {
    const results = await new Promise((resolve, reject) => {
      service.handleMultiple([], 'Empty requests').subscribe({ next: resolve, error: reject });
    });

    expect(results).toEqual([]);
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
