import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../services/common/common.service';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private commonService = inject(CommonService);
  private secretKey = environment.secretKey;

  constructor(private router: Router, private toastrService: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const storedAuth = localStorage.getItem('authObj');
    const storedForgeryToken = localStorage.getItem('forgeryToken');

    const userData = storedAuth ? JSON.parse(storedAuth) : null;
    const forgeryToken = storedForgeryToken ? JSON.parse(storedForgeryToken) : null;
    const token = userData?.token;

    // If no token, pass the request as-is
    if (!token) {
      return next.handle(req);
    }

    // Example: Only apply special case if backend is picky about header casing
    const needsExactHeaderCase = req.url.includes('/dashboard/admin');

    // ⚡ Use fetch() for the special case
    if (needsExactHeaderCase) {
      return from(this.makeFetchRequest(req, token, forgeryToken));
    }

    // ✅ Standard request flow
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-TOKEN': forgeryToken || '',
      },
    });

    return next.handle(clonedReq).pipe(
      tap({
        error: (err) => this.handleError(err),
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  private async makeFetchRequest(
    req: HttpRequest<any>,
    bearerToken: string,
    forgeryToken: string,
  ): Promise<HttpEvent<any>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${bearerToken}`,
        'X-CSRF-TOKEN': forgeryToken || '',
      };

      // Only set Content-Type for JSON body requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(req.url, {
        method: req.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? JSON.stringify(req.body) : undefined,
      });

      const contentType = response.headers.get('content-type') || '';

      let body: any;
      if (
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('application/zip')
      ) {
        body = await response.blob();
      } else if (contentType.includes('text/plain')) {
        body = await response.text();
      } else {
        // fallback to JSON
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
      }

      if (!response.ok) {
        throw new HttpErrorResponse({
          status: response.status,
          statusText: response.statusText,
          url: req.url,
          error: body,
        });
      }

      return new HttpResponse({
        body,
        status: response.status,
        url: req.url,
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any): void {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
        case 440:
          this.toastrService.error('Session expired or unauthorized. Please sign in again.');
          localStorage.clear();
          this.router.navigate(['/auth/sign-in']);
          break;

        default:
          const msg =
            typeof error.error === 'string' ? error.error : error.error?.message || error.message || 'Unexpected error';
          this.toastrService.error(msg);
          break;
      }
    } else {
      this.toastrService.error('Unexpected error occurred.');
    }
  }
}
