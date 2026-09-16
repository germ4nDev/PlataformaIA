/* Author: German Valencia */
import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../service/authentication.service'; // Ajusta la ruta si es necesario

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private injector: Injector) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((err) => {
                if (err.status === 401) {
                    const authenticationService = this.injector.get(AuthenticationService);
                    authenticationService.logout();
                }
                return throwError(() => err);
            })
        );
    }
}
