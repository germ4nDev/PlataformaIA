import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { routes } from './app.routes';

// Abierto solo (4201) no hay plataforma que dé las traducciones: se ven las llaves. Dentro de la plataforma usa su TranslateService.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), importProvidersFrom(TranslateModule.forRoot())]
};
