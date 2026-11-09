import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// OT-023 fase 5 (regla 21, usuario 2026-11-08): AppComponent es standalone y la web arranca con bootstrapApplication.
// AppModule queda como módulo de proveedores (rutas, traducción, sockets, toastr, interceptores, APP_INITIALIZER): todo se toma de él.
// Antes: platformBrowserDynamic().bootstrapModule(AppModule) (copia en _respaldos/2026-11-08_ot023-fases-4-5).
bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(AppModule)]
}).catch((err) => console.error(err));
