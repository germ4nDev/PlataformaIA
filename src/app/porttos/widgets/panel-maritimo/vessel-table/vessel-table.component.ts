// /* eslint-disable @typescript-eslint/no-explicit-any */
// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Generic Widget - Vessel Table (Refactorizado con Shell)
// // */
// // import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { VesselTableModel } from 'src/app/theme/shared/_helpers/models/tablero-control/vessel-table.model';

// // // 🟢 Importamos el Shell maestro
// // import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // @Component({
// //     selector: 'app-vessel-table',
// //     standalone: true,
// //     imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
// //     templateUrl: './vessel-table.component.html',
// //     styleUrls: ['./vessel-table.component.scss'],
// //     encapsulation: ViewEncapsulation.None
// // })
// // export class VesselTableComponent implements OnInit, OnChanges {

// //     // 🟢 NUEVO ESTÁNDAR
// //     @Input() widgetConfig: any;
// //     @Input() isEnfoque: boolean = false;
// //     @Input() mostrarTabla: boolean = false;

// //     public data: Partial<VesselTableModel> = {};
// //     public isLoading: boolean = false;

// //     // Mantenemos la lógica de expansión de columnas adaptada al widgetConfig
// //     @HostBinding('class') get hostClass() {
// //         return `col-span-${this.widgetConfig?.colspan || 2}`;
// //     }

// //     constructor(
// //         private cdr: ChangeDetectorRef,
// //         private _torreService: DashboardService
// //     ) { }

// //     ngOnInit(): void {
// //         const dataExistente = this._torreService.obtenerDatosActuales();
// //         if (dataExistente) {
// //             this.procesarDataDelTunel(dataExistente);
// //         }

// //         this._torreService.datosPestana$.subscribe(diccionario => {
// //             if (diccionario) {
// //                 this.procesarDataDelTunel(diccionario);
// //             }
// //         });
// //     }

// //     private procesarDataDelTunel(diccionario: any) {
// //         if (!diccionario) return;
// //         // console.log('****DATOS DICCIONARIO MOTONAVES', diccionario);
// //         // console.log('****widgetConfig', this.widgetConfig);

// //         let miId = this.widgetConfig?.idClon || this.widgetConfig?.id || 'PTT_MAE_TAB_MOTONAVES';
// //         let codigo = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_TAB_MOTONAVES').toUpperCase();

// //         let miData = null;

// //         if (miId && diccionario[miId]) {
// //             miData = diccionario[miId];
// //         }
// //         else if (codigo && diccionario[codigo]) {
// //             miData = diccionario[codigo];
// //         }
// //         else {
// //             const llave = Object.keys(diccionario).find(k =>
// //                 k.toUpperCase().includes('WDG_TABLE_REPORTE_MOTONAVES')
// //             );
// //             if (llave) {
// //                 miData = diccionario[llave];
// //             }
// //         }

// //         if (miData) {
// //             console.log('✅ Datos atrapados exitosamente para el widget:', miData);

// //             this.data = miData;

// //             this.isLoading = false;
// //             this.cdr.detectChanges();
// //         } else {
// //             console.warn('⚠️ El diccionario no trajo datos compatibles con este componente.');
// //         }
// //     }

// //     ngOnChanges(changes: SimpleChanges): void {
// //         if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
// //             this.data = this.widgetConfig?.data || {};
// //         }
// //     }

// //     // 🟢 Toggle de enfoque: Abre o cierra el modal
// //     maximizarDesdeShell() {
// //         if (this.isEnfoque) {
// //             this._torreService.cerrarModoEnfoque();
// //         } else {
// //             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_MAE_TAB_MOTONAVES', this.data);
// //         }
// //     }
// // }
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - Vessel Table (Refactorizado Dumb Component)
// */
// import { Component, Input, HostBinding, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { VesselTableModel } from 'src/app/theme/shared/_helpers/models/tablero-control/vessel-table.model';

// // 🟢 Importamos el Shell maestro
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-vessel-table',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './vessel-table.component.html',
//     styleUrls: ['./vessel-table.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class VesselTableComponent {

//     // 🟢 NUEVO ESTÁNDAR
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Recibe los datos filtrados y listos directo desde la pestaña
//     @Input() datosVivos: any;

//     // Mantenemos la lógica de expansión de columnas adaptada al widgetConfig
//     @HostBinding('class') get hostClass() {
//         return `col-span-${this.widgetConfig?.colspan || 2}`;
//     }

//     constructor(
//         private _torreService: DashboardService
//     ) { }

//     // 🟢 EL CEREBRO REACTIVO: Fusión automática de configuraciones y datos de la API
//     get data(): Partial<VesselTableModel> {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || {};

//         return {
//             ...configBase,
//             ...(this.datosVivos || {})
//         };
//     }

//     get isLoading(): boolean {
//         // La tabla está cargando mientras no reciba la inyección de la API
//         return !this.datosVivos;
//     }

//     // 🟢 Toggle de enfoque: Abre o cierra el modal
//     maximizarDesdeShell() {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             // Mandamos los datos ya procesados por el getter
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_MAE_TAB_MOTONAVES', this.data);
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Vessel Table 72h (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    HostBinding,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewEncapsulation,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { VesselTableModel } from 'src/app/theme/shared/_helpers/models/tablero-control/vessel-table.model';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-vessel-table',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './vessel-table.component.html',
    styleUrls: ['./vessel-table.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VesselTableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre desde el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoTabla: boolean = true;
    private datosAutonomosSQL: Partial<VesselTableModel> | null = null;
    private readonly destroy$ = new Subject<void>();

    @HostBinding('class') get hostClass(): string {
        return `col-span-${this.widgetConfig?.colspan || 2}`;
    }

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarProgramacionMotonaves();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarProgramacionMotonaves();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma al servicio Marítimo filtrada por puerto activo
     */
    private cargarProgramacionMotonaves(): void {
        // 1. Si viene inyectado desde el modal de Enfoque, usamos esa data directamente
        if (this.datosVivos && Array.isArray(this.datosVivos.motonaves)) {
            this.datosAutonomosSQL = this.normalizarPayloadMotonaves(this.datosVivos);
            this.cargandoTabla = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_TAB_MOTONAVES')
            .trim()
            .toUpperCase();

        this.cargandoTabla = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarPayloadMotonaves(respuestaSQL);
                    this.cargandoTabla = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget VesselTable] Error consultando programación 72h:', err);
                    this.datosAutonomosSQL = { motonaves: [] };
                    this.cargandoTabla = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa registros provenientes de:
     * - TCL_LineUpMaritimo (lineaAgencia, fechaAtraque, trabajoOperacion, posicion)
     * - vw_TCL_CicloVidaMotonaves / DIMAR (agencia, instalacion_portuaria, ata, dwt, estado_operativo)
     * - TCL_OperacionMaritima (fechaETA, fechaATA, estadoBuque, carga_declarada)
     */
    private normalizarPayloadMotonaves(raw: any): Partial<VesselTableModel> {
        if (!raw) return { motonaves: [] };

        const listaCruda: any[] = Array.isArray(raw)
            ? raw
            : raw.motonaves || raw.rows || raw.data || [];

        const motonavesNormalizadas = listaCruda.map((n: any) => {
            const estadoTexto =
                n.estadoTexto ||
                n.estado_operativo ||
                n.estadoBuque ||
                n.posicion ||
                'Programado';

            return {
                ...n,
                motonave: n.motonave || n.nombreMotonave || '—',
                naviera: n.naviera || n.lineaAgencia || n.agencia || '—',
                terminal: n.terminal || n.instalacion_portuaria || n.codigoTerminal || '—',
                tipo: n.tipo || n.tipo_nave || n.tipo_buque || n.tipoCarga || '',
                eta: n.eta || n.fechaETA || '--',
                fechaAtraque:
                    n.fechaAtraque ||
                    n.ata ||
                    n.fechaATA ||
                    (n.muelle ? `${n.muelle}` : '--'),
                carga:
                    n.carga ||
                    n.trabajoOperacion ||
                    n.carga_declarada ||
                    (n.dwt ? `${Number(n.dwt).toLocaleString('es-CO')} DWT` : '—'),
                estadoTexto,
                estadoClase: n.estadoClase || this.resolverClaseBadge(estadoTexto, n.severidad_badge)
            };
        });

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'REPORTE DE MOTONAVES · 72H',
            subtitulo: raw.subtitulo || 'Programación de arribos, fondeo y atraques',
            icono: raw.icono || 'feather icon-anchor',
            motonaves: motonavesNormalizadas
        };
    }

    private resolverClaseBadge(estadoTexto: string, severidad?: string): string {
        const txt = (estadoTexto || '').toUpperCase();
        const sev = (severidad || '').toLowerCase();

        if (sev === 'success' || txt.includes('DESCARG') || txt.includes('MUELLE') || txt.includes('OPERANDO')) {
            return 'bg-success bg-opacity-25 text-success border-success';
        }
        if (sev === 'warning' || txt.includes('FONDEO') || txt.includes('ATRACANDO') || txt.includes('DEMORA')) {
            return 'bg-warning bg-opacity-25 text-warning border-warning';
        }
        if (sev === 'danger' || txt.includes('SUSPEND') || txt.includes('CRÍTIC') || txt.includes('ALERTA')) {
            return 'bg-danger bg-opacity-25 text-danger border-danger';
        }
        return 'bg-info bg-opacity-25 text-info border-info';
    }

    get data(): Partial<VesselTableModel> {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get isLoading(): boolean {
        return this.cargandoTabla && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByNave(index: number, nave: any): string {
        return nave.id_aviso || nave.codigoOperacion || `${nave.motonave}-${nave.eta}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_TAB_MOTONAVES',
                this.data
            );
        }
    }
}
