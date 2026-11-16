/*
    Author: German Valencia
    Pattern: PLATAFORMA Token - Aplicación de la compilación (OT-034, CC-194)
    Description: el arranque de la compilación aislada de una aplicación la declara (código de PTL_Aplicaciones y ruta de inicio);
      ContextoDominioService la usa para entrar directo a esa aplicación. La compilación de la plataforma no la provee.
*/
import { InjectionToken } from '@angular/core';
import { DeclaracionCompilacion } from './nucleo';

export const APLICACION_DE_COMPILACION = new InjectionToken<DeclaracionCompilacion | null>('APLICACION_DE_COMPILACION');
