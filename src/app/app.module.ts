/*
    Author: German Valencia
    Pattern: PLATAFORMA - Módulo de la compilación de la plataforma (consola)
    Description: desde el CC-191 (OT-034) los proveedores y el layout comunes viven en plataforma/casco/casco.module.ts para que cada
      compilación (sistemas, porttos…) los use sin arrastrar las rutas de la consola. Este módulo = casco + rutas de la plataforma.
      Antes: todo el contenido aquí (copia en _respaldos/2026-11-15_ot034-piloto-sistemas/app.module.ts).
*/
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { CascoModule } from './plataforma/casco/casco.module';

@NgModule({
  imports: [CascoModule, AppRoutingModule],
  exports: [CascoModule]
})
export class AppModule {}
