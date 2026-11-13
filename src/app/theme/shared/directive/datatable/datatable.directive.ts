// Directiva propia para DataTables (OT-035): reemplaza a `angular-datatables`, que no tiene versión para Angular 20 en adelante.
// Mantiene el mismo contrato para no tocar las pantallas: `<table datatable [dtOptions]="..." [dtTrigger]="...">` y
// `@ViewChild(DataTableDirective) … .dtInstance.then((dt: Api<any>) => …)`. DataTables 2 se carga global (angular.json → scripts).
import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import type { Api } from 'datatables.net';

declare const $: any;

@Directive({ selector: '[datatable]' })
export class DataTableDirective implements OnInit, OnDestroy {
    /** Opciones de DataTables (o una promesa que las resuelve). */
    @Input() dtOptions: any = {};
    /** Si se da, la tabla se dibuja cada vez que emite (con las opciones emitidas, si trae). */
    @Input() dtTrigger?: Subject<any>;

    /** Instancia de DataTables, disponible cuando la tabla quedó dibujada. */
    dtInstance!: Promise<Api<any>>;

    private tabla: Api<any> | null = null;
    private sub?: Subscription;

    constructor(private el: ElementRef<HTMLTableElement>) {}

    ngOnInit(): void {
        if (this.dtTrigger) {
            this.sub = this.dtTrigger.subscribe((opciones) => this.dibujar(opciones));
        } else {
            this.dibujar(null);
        }
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.tabla?.destroy(true);
        this.tabla = null;
    }

    private dibujar(opciones: any): void {
        if (opciones) this.dtOptions = opciones;
        this.dtInstance = new Promise<Api<any>>((resolve, reject) => {
            Promise.resolve(this.dtOptions).then((resueltas) => {
                // Igual que angular-datatables: se espera un ciclo para que Angular termine de pintar las filas.
                setTimeout(() => {
                    this.tabla = $(this.el.nativeElement).DataTable({ ...(resueltas || {}) });
                    resolve(this.tabla as Api<any>);
                });
            }, reject);
        });
    }
}
