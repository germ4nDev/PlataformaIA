/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget Base - Widgets marítimos en vivo

    Cada widget:
      - toma el puerto de widgetConfig.puerto (lo pone el dashboard según el filtro),
      - consulta al iniciar, cada `intervaloMs` y, si `escucharAis`, cuando AIS reporta un cambio de estado
        en el puerto (agrupado 3 s para no disparar una consulta por evento),
      - conserva los últimos datos buenos si una consulta falla y muestra el error sin romper el tablero.
*/
import { ChangeDetectorRef, Directive, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { EMPTY, merge, Observable, of, Subscription, timer } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoVivoService } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { mensajeError } from './maritimo-vivo.util';

@Directive()
export abstract class WidgetMaritimoVivoBase<T> implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    public datos: T | null = null;
    public cargando = true;
    public error: string | null = null;
    public ultimaActualizacion: Date | null = null;
    public puerto = 'BUENAVENTURA';

    protected readonly core = inject(MaritimoVivoService);
    protected readonly cdr = inject(ChangeDetectorRef);
    private readonly torre = inject(DashboardService);
    private suscripcion?: Subscription;

    /** Código del widget en WIDGET_MAP (para el modo enfoque) */
    protected abstract readonly codigo: string;
    protected intervaloMs = 60_000;
    protected escucharAis = true;

    protected abstract consultar(puerto: string): Observable<T>;
    /** Gancho tras cada carga exitosa (p. ej. redibujar una gráfica) */
    protected alActualizar(): void { }

    ngOnInit(): void {
        this.iniciar();
    }

    ngOnChanges(cambios: SimpleChanges): void {
        const cambio = cambios['widgetConfig'];
        if (cambio && !cambio.firstChange && this.puertoDe(cambio.currentValue) !== this.puerto) this.iniciar();
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }

    /** Origen del dato (pie de la vista ampliada). */
    public get origenVivo(): { fuente: string; periodo: string; generadoEn: Date | null; nota: string | null } {
        return {
            fuente: 'AIS (posiciones) + avisos de llegada DIMAR',
            periodo: 'En vivo · posiciones AIS de los últimos 60 min',
            generadoEn: this.ultimaActualizacion,
            nota: this.error ? `Última consulta fallida: ${this.error}` : null
        };
    }

    public refrescar(): void {
        this.iniciar();
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) this.torre.cerrarModoEnfoque();
        else this.torre.abrirModoEnfoque(this.widgetConfig?.type || this.codigo, this.widgetConfig);
    }

    private puertoDe(config: any): string {
        return String(config?.puerto || 'BUENAVENTURA').trim().toUpperCase();
    }

    private iniciar(): void {
        this.suscripcion?.unsubscribe();
        this.puerto = this.puertoDe(this.widgetConfig);
        this.datos = null;
        this.cargando = true;
        this.error = null;

        const disparadores = merge(
            timer(0, this.intervaloMs),
            this.escucharAis ? this.core.cambiosDeEstado(this.puerto).pipe(debounceTime(3000)) : EMPTY
        );

        this.suscripcion = disparadores
            .pipe(
                switchMap(() => this.consultar(this.puerto).pipe(
                    map((datos) => ({ datos, error: null as unknown })),
                    catchError((error: unknown) => of({ datos: null as T | null, error }))
                ))
            )
            .subscribe(({ datos, error }) => {
                if (error) {
                    this.error = mensajeError(error);
                } else {
                    this.datos = datos;
                    this.error = null;
                    this.ultimaActualizacion = new Date();
                }
                this.cargando = false;
                this.cdr.markForCheck();
                if (!error) this.alActualizar();
            });
    }
}
