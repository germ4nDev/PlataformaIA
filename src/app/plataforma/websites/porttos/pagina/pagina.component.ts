/*
    Author: German Valencia
    Pattern: PORTTOS Página - Portal (OT-010)
    Description: Página genérica del portal. La ruta dice qué página pedir (data.pagina) y si lleva un bloque propio
      (data.bloque: 'planes', 'contacto' o 'puertos'; data.conPlanes: pide los planes sin pintarlos). Pinta las secciones en el orden de la base con el componente de su tipo
      (componenteDeSeccion), luego el bloque y las preguntas frecuentes. Título y descripción para buscadores desde el hero.
      Mientras carga: «Cargando…»; si el API falla: el mensaje honesto y un botón para reintentar (no hay contenido de reemplazo).
*/
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, Observable, combineLatest, of, switchMap, tap, catchError, map } from 'rxjs';
import { ConfigPortal, PaginaPortal, PlanesPortal, PreguntaPortal, componenteDeSeccion, metaDePagina } from 'src/app/plataforma/websites/porttos/nucleo';
import { PortalPorttosService } from 'src/app/theme/shared/service/portal-porttos.service';
import { Estado, conEstado } from 'src/app/theme/shared/service/portal-porttos.service';
import { SeccionHeroComponent } from '../componentes/secciones/hero.component';
import { SeccionCifrasComponent } from '../componentes/secciones/cifras.component';
import { SeccionTarjetasComponent } from '../componentes/secciones/tarjetas.component';
import { SeccionTablerosComponent } from '../componentes/secciones/tableros.component';
import { SeccionDestacadoComponent } from '../componentes/secciones/destacado.component';
import { SeccionCtaComponent } from '../componentes/secciones/cta.component';
import { SeccionPasosComponent } from '../componentes/secciones/pasos.component';
import { SeccionListaComponent } from '../componentes/secciones/lista.component';
import { SeccionTextoComponent } from '../componentes/secciones/texto.component';
import { PlanesComponent } from '../componentes/planes.component';
import { PreguntasComponent } from '../componentes/preguntas.component';
import { ContactoComponent } from '../componentes/contacto.component';
import { SeccionPerfilesComponent } from '../componentes/secciones/perfiles.component';
import { SeccionMetasComponent } from '../componentes/secciones/metas.component';
import { SeccionNivelesComponent } from '../componentes/secciones/niveles.component';
import { PuertosVivoComponent } from '../componentes/puertos-vivo.component';
import { SeccionAppComponent } from '../componentes/secciones/app.component';

interface Vista {
    pagina: PaginaPortal;
    bloque: string | null;
    planes: Estado<PlanesPortal> | null;
    preguntas: PreguntaPortal[];
    config: ConfigPortal | null;
}

@Component({
    selector: 'pp-pagina',
    standalone: true,
    imports: [
        AsyncPipe, SeccionHeroComponent, SeccionCifrasComponent, SeccionTarjetasComponent, SeccionTablerosComponent,
        SeccionDestacadoComponent, SeccionCtaComponent, SeccionPasosComponent, SeccionListaComponent, SeccionTextoComponent,
        PlanesComponent, PreguntasComponent, ContactoComponent, SeccionPerfilesComponent, SeccionMetasComponent,
        SeccionNivelesComponent, PuertosVivoComponent, SeccionAppComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (estado$ | async; as e) {
      @if (e.cargando) {
        <div class="estado" role="status"><span class="girador" aria-hidden="true"></span>Cargando…</div>
      } @else if (e.error) {
        <div class="estado estado--error" role="alert">
          <p>{{ e.error }}</p>
          <button type="button" class="boton boton--secundario" (click)="reintentar()">Reintentar</button>
        </div>
      } @else { @if (e.dato; as v) {
        @for (s of v.pagina.secciones; track s.codigo; let i = $index) {
          @switch (tipo(s.tipo)) {
            @case ('hero') { <pp-seccion-hero [s]="s" [grande]="v.pagina.pagina === 'inicio' && i === 0" /> }
            @case ('cifras') { <pp-seccion-cifras [s]="s" /> }
            @case ('tarjetas') { <pp-seccion-tarjetas [s]="s" /> }
            @case ('tableros') { <pp-seccion-tableros [s]="s" /> }
            @case ('destacado') { <pp-seccion-destacado [s]="s" /> }
            @case ('cta') { <pp-seccion-cta [s]="s" /> }
            @case ('pasos') { <pp-seccion-pasos [s]="s" /> }
            @case ('lista') { <pp-seccion-lista [s]="s" /> }
            @case ('texto') { <pp-seccion-texto [s]="s" /> }
            @case ('perfiles') { <pp-seccion-perfiles [s]="s" [planes]="v.planes?.dato?.planes || []" /> }
            @case ('metas') { <pp-seccion-metas [s]="s" /> }
            @case ('niveles') { <pp-seccion-niveles [s]="s" /> }
            @case ('app') { <pp-seccion-app [s]="s" [config]="v.config" /> }
          }
          @if (i === 0 && v.bloque === 'puertos') { <pp-puertos-vivo /> }
          @if (i === 0 && v.bloque === 'planes') {
            @if (v.planes?.cargando) { <div class="estado" role="status"><span class="girador" aria-hidden="true"></span>Cargando…</div> }
            @if (v.planes?.error) { <div class="estado estado--error" role="alert"><p>{{ v.planes?.error }}</p></div> }
            @if (v.planes?.dato; as planes) { <pp-planes [datos]="planes" /> }
          }
          @if (i === 0 && v.bloque === 'contacto') {
            <pp-contacto [config]="v.config" [planes]="v.planes?.dato?.planes || []" />
          }
        }
        <pp-preguntas [preguntas]="v.preguntas" />
      } }
    }`,
})
export class PaginaComponent {
    private readonly api = inject(PortalPorttosService);
    private readonly ruta = inject(ActivatedRoute);
    private readonly titulo = inject(Title);
    private readonly meta = inject(Meta);
    private readonly recarga = new BehaviorSubject<void>(undefined);

    readonly estado$: Observable<Estado<Vista>> = combineLatest([this.ruta.data, this.recarga]).pipe(
        switchMap(([data]) => {
            const pagina = String(data['pagina'] || 'inicio');
            const bloque = (data['bloque'] as string) || null;
            const config$ = this.api.config().pipe(catchError(() => of(null)));
            const conPlanes = bloque === 'planes' || bloque === 'contacto' || data['conPlanes'] === true;
            const planes$: Observable<Estado<PlanesPortal> | null> = conPlanes ? conEstado(this.api.planes()) : of(null);
            const preguntas$ = this.api.preguntas(pagina).pipe(catchError(() => of([] as PreguntaPortal[])));
            return conEstado(combineLatest([this.api.pagina(pagina), planes$, preguntas$, config$]).pipe(
                map(([p, planes, preguntas, config]) => ({ pagina: p, bloque, planes, preguntas, config })),
                tap((v) => this.ponerMeta(v.pagina)),
            ));
        }),
    );

    tipo(t: string) { return componenteDeSeccion(t); }
    reintentar(): void { this.recarga.next(); }

    private ponerMeta(p: PaginaPortal): void {
        const m = metaDePagina(p);
        this.titulo.setTitle(m.titulo);
        if (m.descripcion) {
            this.meta.updateTag({ name: 'description', content: m.descripcion });
            this.meta.updateTag({ property: 'og:title', content: m.titulo });
            this.meta.updateTag({ property: 'og:description', content: m.descripcion });
        } else {
            // Sin descripción propia no se deja la de la página anterior
            this.meta.removeTag("name='description'");
            this.meta.removeTag("property='og:description'");
        }
    }
}
