/* Author: German Valencia */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';

@Injectable({
    providedIn: 'root'
})
export class ContextoNavegacionService {

    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private _localStorage: LocalStorageService,
        private router: Router // 🟢 Inyectamos el enrutador de Angular
    ) {
        this.iniciarSincronizacionAutomatica();
    }

    /**
     * 🟢 Se suscribe a la navegación de Angular.
     * Cada vez que el usuario cambia de pantalla, sincroniza el navSettings con la BD.
     */
    private iniciarSincronizacionAutomatica(): void {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {

            // Si va al login, no enviamos nada
            if (event.urlAfterRedirects.includes('/login')) return;

            // Damos un micro-respiro (50ms) para asegurar que navSettings ya se actualizó en el click
            setTimeout(() => {
                this.sincronizarConBackend();
            }, 50);
        });
    }

    /**
     * 🟢 Lee la Fuente de Verdad (navSettings) y la envía al Backend
     */
    public sincronizarConBackend(): void {
        //const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        const rawUser = this._localStorage.getObject<any>('currentUser');
        const rawNavSettings = this._localStorage.getObject<any>('navsettings');
        let codigoSesion = '';

        if (rawUser) {
            try {
                codigoSesion = rawUser?.usuario?.codigoSesion || '';
            } catch (e) { }
        }

        console.log('📦 [FRONTEND] CodigoSesion:', codigoSesion);
        if (codigoSesion) {
            // 🟢 LEEMOS TU FUENTE DE VERDAD CENTRALIZADA
            // (Si navSettings es un servicio, usa this.navSettingsService.getDatos() en vez de localStorage)
            let contextoNav = {};

            console.log('📦 [FRONTEND] Esto es lo que leí de navSettings:', rawNavSettings);

            if (rawNavSettings) {
                try {
                    contextoNav = {
                        codigoSuscriptor: rawNavSettings?.suscriptor.codigoSuscriptor || null,
                        codigoAplicacion: rawNavSettings?.aplicacion.codigoAplicacion || null,
                        codigoSuite: rawNavSettings?.suite.codigoSuite || null,
                        codigoModulo: rawNavSettings?.modulo.codigoModulo || null
                    };
                } catch (e) {
                    console.warn('Error leyendo navSettings');
                }
            }

            const payload = {
                codigoSesion: codigoSesion,
                ...contextoNav
            };

            console.log('🚀 [FRONTEND] Payload que voy a enviar a Node:', payload);
            // 🟢 Disparamos el POST silencioso
            this.http.post(`${this.baseUrl}/sesiones/contexto`, payload)
                .subscribe({
                    next: () => console.log('✅ Sincronización automática de contexto exitosa'),
                    error: (err) => console.warn('⚠️ No se pudo sincronizar el contexto', err)
                });
        }
    }
}
