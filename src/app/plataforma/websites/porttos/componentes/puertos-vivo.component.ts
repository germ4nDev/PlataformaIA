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
import { IconoComponent } from './icono.component';

interface Vista { puertos: PuertoListado[]; activo: string | null; datos: Estado<PuertoEnVivo> | null }

@Component({
  selector: 'pp-puertos-vivo',
  standalone: true,
  imports: [AsyncPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vista$ | async; as v) {
      <section class="bloque bloque--pegado" aria-label="Datos públicos del puerto">
        <div class="contenedor">
          @if (v.puertos.length) {
            <div class="selector-puertos" role="group" aria-label="Puerto">
              @for (p of v.puertos; track p.id) {
                <button type="button" class="chip" [attr.aria-pressed]="p.id === v.activo" (click)="elegir(p.id)">{{ p.nombre }}</button>
              }
            </div>
          }
          @if (v.datos?.cargando) {
            <div class="estado estado--corto" role="status"><span class="girador" aria-hidden="true"></span>Cargando…</div>
          } @else if (v.datos?.error) {
            <div class="estado estado--corto estado--error" role="alert"><p>{{ v.datos?.error }}</p></div>
          } @else { @if (v.datos?.dato; as d) {
            <div class="vivo__cabeza">
              <h2 class="titulo-seccion">{{ d.puerto.nombre }}</h2>
              <p class="vivo__hora">Consultado {{ hora(d.generado) }}</p>
            </div>
            <p class="oculto" role="status">Datos de {{ d.puerto.nombre }} cargados.</p>
            <div class="rejilla rejilla--vivo">
              <article class="dato-vivo">
                <p class="dato-vivo__rotulo"><pp-icono nombre="via" [tamano]="18" />Vías de acceso</p>
                @if (d.vias.sinDato) {
                  <p class="dato-vivo__valor dato-vivo__valor--sin">Sin dato</p>
                  <p class="dato-vivo__texto">La fuente no ha reportado en las últimas 24 horas.</p>
                } @else {
                  <p class="dato-vivo__valor" [attr.data-semaforo]="d.vias.semaforo">{{ estadoVia(d.vias.estado) }}</p>
                  <p class="dato-vivo__texto">
                    @if (d.vias.semaforo === null) { TomTom no reporta eventos viales cerca del puerto. }
                    @else { {{ d.vias.eventos === 1 ? '1 evento vial vigente' : d.vias.eventos + ' eventos viales vigentes' }} cerca del puerto. }
                    @if (d.vias.corredores.length) { Corredor más afectado: {{ d.vias.corredores[0].corredor }}. }
                  </p>
                }
                <p class="dato-vivo__fuente">Fuente: {{ d.vias.fuente }}@if (d.vias.lectura) { · {{ hora(d.vias.lectura) }} }</p>
              </article>
              <article class="dato-vivo">
                <p class="dato-vivo__rotulo"><pp-icono nombre="barco" [tamano]="18" />Tráfico portuario del último mes</p>
                @if (d.trafico.ultimoMes; as u) {
                  <p class="dato-vivo__valor">{{ toneladas(u.toneladas) }}</p>
                  <p class="dato-vivo__texto">
                    {{ mes(u.mes) }} de {{ u.anio }}.
                    @if (variacion(d); as t) { {{ t }}. }
                  </p>
                } @else {
                  <p class="dato-vivo__valor dato-vivo__valor--sin">Sin dato</p>
                  <p class="dato-vivo__texto">Aún no hay reportes de este puerto.</p>
                }
                <p class="dato-vivo__fuente">Fuente: {{ d.trafico.fuente }}@if (d.trafico.lectura) { · actualizado {{ hora(d.trafico.lectura) }} }</p>
              </article>
              <article class="dato-vivo">
                <p class="dato-vivo__rotulo"><pp-icono nombre="clima" [tamano]="18" />Clima y marea</p>
                @if (!d.clima.sinDato) {
                  <p class="dato-vivo__valor">{{ numero(d.clima.temperatura) }} °C · {{ numero(d.clima.vientoNudos) }} nudos</p>
                  <p class="dato-vivo__texto">
                    @if (d.clima.tiempo) { {{ d.clima.tiempo }}. }
                    @if (!d.marea.sinDato) { Próxima pleamar: {{ hora(d.marea.pleamar) }}@if (d.marea.nivel) { ({{ d.marea.nivel }}) }. }
                    @else { Marea: sin dato. }
                  </p>
                } @else {
                  <p class="dato-vivo__valor dato-vivo__valor--sin">Sin dato</p>
                  <p class="dato-vivo__texto">
                    El servicio de clima no respondió.
                    @if (!d.marea.sinDato) { Próxima pleamar: {{ hora(d.marea.pleamar) }}. }
                  </p>
                }
                <p class="dato-vivo__fuente">Fuente: {{ d.clima.fuente }} y {{ d.marea.fuente }}@if (d.clima.lectura) { · {{ hora(d.clima.lectura) }} }</p>
              </article>
            </div>

            @if (!d.trafico.sinDato) {
              <figure class="grafica-trafico">
                <figcaption class="grafica-trafico__titulo">
                  <strong>Tráfico de los últimos 12 meses</strong>
                  <span>Toneladas movilizadas por mes · Fuente: {{ d.trafico.fuente }}</span>
                </figcaption>
                <div class="grafica-trafico__area" aria-hidden="true">
                  <span class="grafica-trafico__max">{{ toneladas(maximo(d)) }}</span>
                  @for (b of barras(d); track b.anio * 100 + b.mes) {
                    <div class="grafica-trafico__mes">
                      <div class="grafica-trafico__pista">
                        @if (b.alto !== null) {
                          <span class="grafica-trafico__barra" [class.parcial]="b.parcial" [style.height.%]="b.alto"></span>
                          <span class="grafica-trafico__tip">{{ mes(b.mes) }} {{ b.anio }}: {{ toneladas(b.toneladas) }}@if (b.parcial) { (parcial) }</span>
                        }
                      </div>
                      <span class="grafica-trafico__etiqueta">{{ b.etiqueta }}</span>
                    </div>
                  }
                </div>
                @if (d.trafico.mesParcial; as p) {
                  <p class="grafica-trafico__nota"><span class="muestra-parcial" aria-hidden="true"></span>
                    {{ mes(p.mes) }} de {{ p.anio }}: parcial, Supertransporte aún lo está cargando.</p>
                }
                <table class="oculto">
                  <caption>Toneladas movilizadas por mes en {{ d.puerto.nombre }}, últimos 12 meses</caption>
                  <thead><tr><th scope="col">Mes</th><th scope="col">Toneladas</th></tr></thead>
                  <tbody>
                    @for (b of barras(d); track b.anio * 100 + b.mes) {
                      <tr><th scope="row">{{ mes(b.mes) }} {{ b.anio }}</th><td>{{ toneladas(b.toneladas) || 'Sin dato' }}@if (b.parcial) { (parcial) }</td></tr>
                    }
                  </tbody>
                </table>
              </figure>
            }
          } }
        </div>
      </section>
    }`,
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
