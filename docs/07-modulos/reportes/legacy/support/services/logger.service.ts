import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { printWarn, printLog } from 'app/core/helpers/debug.util';


@Injectable({ providedIn: 'root' })
export class LoggerService {

  constructor(private errorHandler: ErrorHandler) {}

  log(value: any, ...rest: any[]) {
    if (!environment.production) {
      printLog(value, ...rest);
    }
  }

  error(error: Error) {
    this.errorHandler.handleError(error);
  }

  warn(value: any, ...rest: any[]) {
    if (!environment.production) {
      printWarn(value, ...rest);
    }
  }

}
