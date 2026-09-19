/* Author: German Valencia */
import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from '../service';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {

    constructor(
        private injector: Injector,
        private _localStorage: LocalStorageService
    ) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {

                if (error.status === 401) {
                    const router = this.injector.get(Router);

                    if (router.url.includes('/login')) {
                        return throwError(() => error);
                    }

                    this._localStorage.setObject('alerta_expiracion', 'Tu sesión ha expirado por inactividad o seguridad. Por favor ingresa nuevamente.');
                    this._localStorage.localClear();

                    window.location.href = '/autenticacion/login';
                }

                return throwError(() => error);
            })
        );
    }
}
