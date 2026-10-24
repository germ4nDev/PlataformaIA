/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Directiva: origen del dato para los widgets de la pestaña Marítimo (Fase 1 de la vista ampliada, 2026-10-23).
    Cada nodo de /maritimo/resumen trae `origen` (fuente, si es respaldo, periodo). Los widgets marítimos normalizan
    su nodo de formas distintas; esta directiva lo toma del mismo flujo compartido (MaritimoService, sin otra
    consulta) y lo entrega al shell para el pie de la vista ampliada:
        <app-widget-shell [origenMaritimo]="widgetConfig" ...>
*/
import { ChangeDetectorRef, Directive, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Directive({ selector: 'app-widget-shell[origenMaritimo]', standalone: true })
export class OrigenMaritimoDirective implements OnChanges, OnDestroy {
    @Input() origenMaritimo: any;
    private sub?: Subscription;

    constructor(private shell: WidgetShellComponent, private maritimo: MaritimoService, private cdr: ChangeDetectorRef) { }

    ngOnChanges(): void {
        const cfg = this.origenMaritimo || {};
        const codigo = String(cfg.type || cfg.codigoWidget || '').trim().toUpperCase();
        const puerto = String(cfg.puerto || cfg.data?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        this.sub?.unsubscribe();
        if (!codigo) return;
        this.sub = this.maritimo.obtenerDatosWidgetMaritimo(puerto, codigo).subscribe((nodo: any) => {
            this.shell.origen = nodo && !Array.isArray(nodo) ? nodo.origen ?? null : null;
            this.cdr.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }
}
