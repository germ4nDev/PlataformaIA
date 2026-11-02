/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal (OT-010)
    Description: Íconos de línea para el campo `icono` de TCL_PortalElementos. Un código desconocido pinta un punto
      (el contenido puede traer íconos nuevos sin romper la página). Decorativo: aria-hidden.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

const TRAZOS: Record<string, string[]> = {
  cuadricula: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  barco: ['M3 17l2 3h14l2-3', 'M5 17V11h14v6', 'M12 11V4', 'M12 4l5 4h-5', 'M8 11V8h4'],
  estrella: ['M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z'],
  escudo: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'],
  camion: ['M2 6h12v10H2z', 'M14 9h4l3 3v4h-7', 'M6 19a2 2 0 100-4 2 2 0 000 4z', 'M17 19a2 2 0 100-4 2 2 0 000 4z'],
  bodega: ['M3 10l9-6 9 6v10H3z', 'M7 20v-6h10v6', 'M7 17h10'],
  contenedor: ['M3 7h18v10H3z', 'M7 7v10', 'M11 7v10', 'M15 7v10', 'M19 7v10'],
  granel: ['M4 20h16', 'M6 20l4-9 3 5 2-3 3 7', 'M14 6a2 2 0 104 0 2 2 0 00-4 0'],
  suelta: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v8'],
  gnl: ['M12 3c3 4 5 7 5 10a5 5 0 01-10 0c0-3 2-6 5-10z', 'M12 17a2 2 0 01-2-2'],
  capacidad: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  noticias: ['M4 5h13v14H6a2 2 0 01-2-2z', 'M17 9h3v8a2 2 0 01-2 2', 'M8 9h5', 'M8 13h5'],
  mapa: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14', 'M15 6v14'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  correo: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  reloj: ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 7v5l3 2'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  cerrar: ['M6 6l12 12', 'M18 6L6 18'],
  flecha: ['M5 12h14', 'M13 6l6 6-6 6'],
  gobierno: ['M3 21h18', 'M5 21V11', 'M9.5 21V11', 'M14.5 21V11', 'M19 21V11', 'M12 3l9 5H3z'],
  via: ['M7 3L4 21', 'M17 3l3 18', 'M12 4v3', 'M12 10v4', 'M12 17v3'],
  // App móvil (CC-103)
  telefono: ['M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1z', 'M11 18h2'],
  campana: ['M6 16V11a6 6 0 0112 0v5l2 2H4z', 'M10 20a2 2 0 004 0'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 10h8', 'M8 13h5'],
  huella: ['M8 20c1-3 1-6 1-8a3 3 0 016 0c0 3 0 6-1 8', 'M5 17c.5-2 .5-4 .5-5a6.5 6.5 0 0113 0c0 2 0 4-.5 6', 'M12 12c0 3 0 6-1 8'],
  rotar: ['M20 12a8 8 0 11-2.3-5.7', 'M20 4v4h-4'],
  descargar: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
  clima: ['M12 3v2', 'M5.6 5.6L7 7', 'M3 12h2', 'M16 12a4 4 0 10-7.5 2', 'M8 20h9a3.5 3.5 0 000-7h-1'],
};

@Component({
  selector: 'pp-icono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="tamano" [attr.height]="tamano" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @for (d of trazos; track $index) { <path [attr.d]="d" /> }
      @if (!trazos.length) { <circle cx="12" cy="12" r="4" /> }
    </svg>`,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconoComponent {
  @Input() tamano = 24;
  trazos: string[] = [];
  @Input() set nombre(v: string | null | undefined) { this.trazos = TRAZOS[String(v || '').toLowerCase()] || []; }
}
