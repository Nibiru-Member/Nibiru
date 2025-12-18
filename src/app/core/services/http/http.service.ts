import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LocalService } from '../local/local.service';
import { LocalConstant } from '../../constants/local.constant';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router, private localService: LocalService) {}

  private createHeaders(options?: any): HttpHeaders {
    const headers = new HttpHeaders().set('X-Frame-Options', 'SAMEORIGIN');
    if (options && options.customHeader) {
      return headers.append('Custom-Header', options.customHeader);
    }
    return headers;
  }

  public get(uri: string, options?: any): Observable<any> {
    const headers = this.createHeaders(options);
    return this.http
      .get(this.apiUrl + uri, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public post(url: string, data: any, options?: any): Observable<any> {
    const headers = this.createHeaders(options);
    return this.http
      .post(this.apiUrl + url, data, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public put(url: string, data: any, options?: any): Observable<any> {
    const headers = this.createHeaders(options);
    return this.http
      .put(this.apiUrl + url, data, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public patch(url: string, data: any, options?: any): Observable<any> {
    const headers = this.createHeaders(options);
    return this.http
      .patch(this.apiUrl + url, data, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public delete(url: string, options?: any): Observable<any> {
    const headers = this.createHeaders(options);
    return this.http
      .delete(this.apiUrl + url, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (
      error?.status === 401 ||
      (error?.error.errors && error?.error.errors[0] === 'Your account has been deactivated, Please contact to admin')
    ) {
      this.handleDeactivatedAccount();
      return throwError(error);
    }
    return throwError(error);
  }

  private handleDeactivatedAccount(): void {
    this.localService.removeLocalData(LocalConstant.USER_DATA);
    this.router.navigateByUrl('/');
  }
}
