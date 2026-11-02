/*
    Author: German Valencia
    Pattern: PLATAFORMA Guard - Rutas por dominio (OT-012)
    Description: En el dominio de una aplicación (p. ej. porttos.co) solo se abren las rutas del menú de esa aplicación y las
      comunes (login, inicio, sitios públicos). La consola (aplicaciones, suscriptores, usuarios…) y las demás aplicaciones no.
      Si aún no se eligió la aplicación del dominio, va al inicio (que la elige sola); si la ruta es de otra, al inicio de la suya.
      Consola y dominios sin registro: todo igual que hoy. El API hace su propio control (middleware validarDominio).
*/
import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { ContextoDominioService } from '../service/contexto-dominio.service';
import { LocalStorageService } from '../service/local-storage.service';
import { AuthenticationService } from '../service/authentication.service';
import { rutaPermitida, rutasDeAplicacion } from 'src/app/plataforma/dominios/nucleo';

export const rutaPorDominioGuard: CanActivateChildFn = (_ruta, estado) => {
    const ctx = inject(ContextoDominioService).contexto;
    if (ctx.tipo !== 'aplicacion') return true;
    const router = inject(Router);
    const almacen = inject(LocalStorageService);
    const nav: any = almacen.getNavSettingsLocalStorage() || {};
    const rutas = rutasDeAplicacion(nav.aplicacion, nav.suite, ctx);
    const r = rutaPermitida(ctx, estado.url, nav.aplicacion?.codigoAplicacion, rutas);
    if (r === 'ok') return true;
    if (r === 'elegir') {
        const auth = inject(AuthenticationService);
        const token = auth.getToken();
        const conSesion = !!token && !auth.isTokenExpired(token);
        return router.parseUrl(conSesion ? '/starter/inicio-suscriptores' : '/autenticacion/login');
    }
    return router.parseUrl(ctx.rutaInicio || nav.suite?.rutaInicio || '/starter/inicio-suites');
};
