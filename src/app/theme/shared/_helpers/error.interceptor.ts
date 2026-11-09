/* Author: German Valencia */
import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../service/authentication.service'; // Ajusta la ruta si es necesario
import { SwalAlertService } from '../service/swal-alert.service';

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
                // CC-128: permiso denegado por validarPermiso del API (sin cerrar sesión)
                if (err.status === 403) {
                    this.injector.get(SwalAlertService).getToastWarning(err.error?.msg || 'No tiene permiso para esta acción.');
                }
                return throwError(() => err);
            })
        );
    }
}
