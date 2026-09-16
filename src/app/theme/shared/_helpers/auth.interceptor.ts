// import { Injectable } from '@angular/core';
// import {
//     HttpRequest,
//     HttpHandler,
//     HttpEvent,
//     HttpInterceptor,
// } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { SKIP_TOKEN_INTERCEPTOR } from './http-context-keys';

// @Injectable()
// export class AuthInterceptor implements HttpInterceptor {

//     private publicUrls = [
//         '/api/public/websites',
//         '/api/public/data',
//         '/assets/',
//         '/api/auth/login'
//     ];

//     constructor() { }

//     intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

//         const isPublicUrl = this.publicUrls.some(url => request.url.includes(url));
//         const isSkippedByContext = request.context.get(SKIP_TOKEN_INTERCEPTOR);

//         if (isPublicUrl || isSkippedByContext) {
//             return next.handle(request);
//         }

//         // 🟢 Rescatamos TODO desde currentUser
//         const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

//         let token = ''; // Inicializamos vacío
//         let codigoSesion = '';

//         if (rawUser) {
//             try {
//                 const parsedUser = JSON.parse(rawUser);
//                 // 🟢 ¡AQUÍ ESTÁ LA CLAVE! Sacamos el token desde adentro del JSON
//                 token = parsedUser?.token || '';
//                 codigoSesion = parsedUser?.codigoSesion || parsedUser?.usuario?.codigoSesion || '';
//             } catch (error) {
//                 console.warn('Error parseando currentUser en AuthInterceptor');
//             }
//         }

//         // Si logramos sacar el token, armamos las cabeceras
//         if (token) {
//             let headersConfig: { [name: string]: string | string[] } = {
//                 'x-token': token
//             };

//             // Adjuntamos el código de sesión para el anti-concurrencia
//             if (codigoSesion) {
//                 headersConfig['x-sesion-id'] = codigoSesion;
//             }

//             const clonedRequest = request.clone({
//                 setHeaders: headersConfig
//             });

//             return next.handle(clonedRequest);
//         }

//         // Si por alguna razón no hay token, pasa la petición original (que seguramente dará 401)
//         return next.handle(request);
//     }
// }
/* Author: German Valencia */
import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { SKIP_TOKEN_INTERCEPTOR } from './http-context-keys';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private publicUrls = [
        '/api/public/websites',
        '/api/public/data',
        '/assets/',
        '/api/auth/login'
    ];

    constructor() { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        const isPublicUrl = this.publicUrls.some(url => request.url.includes(url));
        const isSkippedByContext = request.context.get(SKIP_TOKEN_INTERCEPTOR);

        if (isPublicUrl || isSkippedByContext) {
            return next.handle(request);
        }

        const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

        let token = '';
        let codigoSesion = '';

        if (rawUser) {
            try {
                const parsedUser = JSON.parse(rawUser);
                token = parsedUser?.token || '';
                codigoSesion = parsedUser?.codigoSesion || parsedUser?.usuario?.codigoSesion || '';
            } catch (error) {
                console.warn('Error parseando currentUser en AuthInterceptor');
            }
        }

        if (token) {
            let headersConfig: { [name: string]: string | string[] } = {
                'x-token': token
            };

            if (codigoSesion) {
                headersConfig['x-sesion-id'] = codigoSesion;
            }

            const clonedRequest = request.clone({
                setHeaders: headersConfig
            });

            return next.handle(clonedRequest);
        }

        return next.handle(request);
    }
}
