import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co · Puertos en vivo (OT-011)
    Description: Bloque de la página «puertos»: selector con los puertos activos del maestro (?puerto=ID en la dirección, para
      compartir el enlace; sin él, el primero), tres tarjetas (vías de acceso, tráfico del último mes completo, clima y marea) y la
      gráfica del tráfico de los últimos 12 meses. Todo sale de /api/portal/puertos-en-vivo: solo fuentes públicas, nunca simulados. Cada
      tarjeta dice su fuente y la hora de su lectura; sin dato real dice «Sin dato». El mes que Supertransporte aún carga va
      rayado y rotulado «parcial». La gráfica tiene su tabla para lectores de pantalla.
*/
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, combineLatest, map, of, switchMap, catchError } from 'rxjs';
import {
  PuertoEnVivo, PuertoListado, barrasTrafico, formatoToneladas, horaLectura, nombreMes, textoVariacion,
} from 'src/app/plataforma/websites/porttos/nucleo';
import { Estado, PortalPorttosService, conEstado } from 'src/app/theme/shared/service/portal-porttos.service';
import { IconoComponent } from '../icono/icono.component';

interface Vista { puertos: PuertoListado[]; activo: string | null; datos: Estado<PuertoEnVivo> | null }

@Component({
  selector: 'pp-puertos-vivo',
  standalone: true,
  imports: [TranslateModule, AsyncPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './puertos-vivo.component.html',
  styleUrl: './puertos-vivo.component.scss',
})
export class PuertosVivoComponent {
  private readonly api = inject(PortalPorttosService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly vista$: Observable<Vista> = combineLatest([
    this.api.puertos().pipe(catchError(() => of([] as PuertoListado[]))),
    this.ruta.queryParamMap.pipe(map((q) => q.get('puerto'))),
  ]).pipe(
    switchMap(([puertos, pedido]) => {
      const activo = puertos.find((p) => p.id === pedido)?.id || puertos[0]?.id || null;
      if (!activo) return of<Vista>({ puertos, activo, datos: { cargando: false, error: 'No pudimos cargar los puertos en este momento. Intente de nuevo en unos minutos.' } });
      return conEstado(this.api.puertoEnVivo(activo)).pipe(map((datos) => ({ puertos, activo, datos })));
    }),
  );

  elegir(id: string): void {
    this.router.navigate([], { relativeTo: this.ruta, queryParams: { puerto: id }, replaceUrl: true });
  }

  hora(iso: string | null) { return horaLectura(iso) || '—'; }
  toneladas(n: number | null) { return formatoToneladas(n); }
  mes(m: number) { const t = nombreMes(m); return t.charAt(0).toUpperCase() + t.slice(1); }
  numero(n: number | null) { return n === null ? '—' : String(Math.round(n * 10) / 10).replace('.', ','); }
  variacion(d: PuertoEnVivo) { return textoVariacion(d.trafico.variacion, d.trafico.ultimoMes); }
  barras(d: PuertoEnVivo) { return barrasTrafico(d.trafico.serie); }
  maximo(d: PuertoEnVivo) { return Math.max(0, ...d.trafico.serie.map((m) => m.toneladas ?? 0)) || null; }
  estadoVia(e: string | null) { return e ? e.charAt(0) + e.slice(1).toLowerCase() : 'Sin dato'; }
}
