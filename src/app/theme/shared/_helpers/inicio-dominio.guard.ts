/*
    Author: German Valencia
    Pattern: PLATAFORMA Guard - Inicio por dominio (OT-010 CC-095; multidominio OT-012)
    Description: Decide a dónde va la raíz de la web. El dominio (ContextoDominioService, tabla PTLDominiosAP) trae su rutaPortal:
      sin sesión, la raíz abre ese portal (porttos.co → /websites/porttos); con sesión, o sin portal, va a /autenticacion/login
      como siempre. Si el API no responde, el respaldo es environment.dominiosPortal. Siempre devuelve una redirección.
*/
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../service/authentication.service';
import { ContextoDominioService } from '../service/contexto-dominio.service';
import { destinoRaiz } from 'src/app/plataforma/dominios/nucleo';

export const inicioPorDominioGuard: CanActivateFn = () => {
    const router = inject(Router);
    const auth = inject(AuthenticationService);
    const token = auth.getToken();
    const conSesion = !!token && !auth.isTokenExpired(token);
    return router.parseUrl(destinoRaiz(inject(ContextoDominioService).contexto, conSesion));
};
