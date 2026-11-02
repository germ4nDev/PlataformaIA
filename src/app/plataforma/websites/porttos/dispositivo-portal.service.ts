/*
    Author: German Valencia
    Pattern: PORTTOS Servicio - Portal porttos.co (CC-103)
    Description: Sistema del equipo del visitante (sistemaMovil del núcleo) leído una vez del navegador. En un teléfono o una
      tableta el portal no muestra «Iniciar sesión» y ofrece la app (decisión del usuario, 2026-10-31); en escritorio, como antes.
      Sin navegador (pruebas, prerender) cuenta como escritorio.
*/
import { Injectable } from '@angular/core';
import { SistemaMovil, sistemaMovil } from 'src/app/plataforma/websites/porttos/nucleo';

@Injectable({ providedIn: 'root' })
export class DispositivoPortalService {
  readonly sistema: SistemaMovil | null = typeof navigator === 'undefined'
    ? null : sistemaMovil(navigator.userAgent, navigator.maxTouchPoints || 0);
  readonly movil = this.sistema !== null;
}
