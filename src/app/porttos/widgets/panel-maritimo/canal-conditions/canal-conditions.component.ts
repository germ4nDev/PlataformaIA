// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Generic Widget - Condiciones del Canal (Refactorizado con Shell)
// // */
// // import { ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { CanalModel } from 'src/app/theme/shared/_helpers/models/tablero-control/canal.model';

// // // 🟢 Importamos el Shell maestro
// // import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // @Component({
// //     selector: 'app-canal-conditions',
// //     standalone: true,
// //     imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
// //     templateUrl: './canal-conditions.component.html',
// //     styleUrls: ['./canal-conditions.component.scss'],
// //     encapsulation: ViewEncapsulation.None
// // })
// // export class CanalConditionsComponent implements OnInit {

// //     // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
// //     @Input() widgetConfig: any;
// //     @Input() isEnfoque: boolean = false;
// //     @Input() mostrarTabla: boolean = false;

// //     public data: any = {}; // Usamos any o Partial<CanalModel> para manejar la data inyectada
// //     public isLoading: boolean = true; // Empezamos cargando

// //     constructor(
// //         private cdr: ChangeDetectorRef,
// //         private _torreService: DashboardService
// //     ) { }

// //     ngOnInit(): void {
// //         this._torreService.datosPestana$.subscribe(diccionario => {
// //             if (!diccionario) return;

// //             let miId = this.widgetConfig?.idClon || this.widgetConfig?.id;
// //             let codigo = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || '').toUpperCase();

// //             // Búsqueda inteligente: Por ID, por Código exacto o por coincidencia parcial
// //             let miData = (miId && diccionario[miId]) ? diccionario[miId] : diccionario[codigo];

// //             if (!miData) {
// //                 const llave = Object.keys(diccionario).find(k => k.includes('TU_CLAVE_AQUI')); // Ej: 'MOTONAVES', 'CANAL'
// //                 if (llave) miData = diccionario[llave];
// //             }

// //             if (miData) {
// //                 // AQUÍ ASIGNAS LA DATA A TU VARIABLE LOCAL (ej. this.miModeloData = miData)
// //                 this.isLoading = false;
// //                 this.cdr.detectChanges();
// //             }
// //         });
// //     }

// //     // 🟢 Toggle de enfoque: Abre o cierra el modal de forma estandarizada
// //     maximizarDesdeShell() {
// //         if (this.isEnfoque) {
// //             this._torreService.cerrarModoEnfoque();
// //         } else {
// //             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_CANAL', this.data);
// //         }
// //     }
// // }
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - Condiciones del Canal (Refactorizado Dumb Component)
// */
// import { Component, Input, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// // 🟢 Importamos el Shell maestro
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-canal-conditions',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './canal-conditions.component.html',
//     styleUrls: ['./canal-conditions.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class CanalConditionsComponent {

//     // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Recibe los datos vivos directo del túnel de la pestaña. ¡Cero suscripciones!
//     @Input() datosVivos: any;

//     constructor(
//         private _torreService: DashboardService
//     ) { }

//     // 🟢 EL CEREBRO REACTIVO: Angular lo reevalúa solo cuando 'datosVivos' cambia
//     get data() {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || {};

//         // Fusionamos la configuración visual con los datos vivos de las condiciones del canal
//         return {
//             ...configBase,
//             ...(this.datosVivos || {})
//         };
//     }

//     get isLoading(): boolean {
//         return !this.datosVivos;
//     }

//     // 🟢 Toggle de enfoque: Abre o cierra el modal de forma estandarizada
//     maximizarDesdeShell() {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_CANAL', this.data);
//         }
//     }
// }/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Condiciones del Canal (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
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
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-canal-conditions',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './canal-conditions.component.html',
    styleUrls: ['./canal-conditions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CanalConditionsComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoCanal: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarCondicionesCanal();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarCondicionesCanal();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server (TCL_Clima_Pronostico) filtrada por puerto
     */
    private cargarCondicionesCanal(): void {
        // 1. Si recibe datos precargados desde el modal de Enfoque
        if (this.datosVivos && (this.datosVivos.marea || this.datosVivos.marea_metros !== undefined)) {
            this.datosAutonomosSQL = this.normalizarCondicionesCanal(this.datosVivos);
            this.cargandoCanal = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_PANEL_CANAL')
            .trim()
            .toUpperCase();

        this.cargandoCanal = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarCondicionesCanal(respuestaSQL);
                    this.cargandoCanal = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget CanalConditions] Error consultando condiciones del canal:', err);
                    this.cargandoCanal = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa columnas de TCL_Clima_Pronostico y JSON actual del backend
     */
    private normalizarCondicionesCanal(raw: any): any {
        if (!raw) return {};

        // Si SQL devuelve un arreglo con la última lectura de la estación, tomamos el primer registro
        const origen = Array.isArray(raw) ? (raw[0] || {}) : raw;

        const mareaTexto =
            origen.marea ||
            (origen.marea_metros !== undefined && origen.marea_metros !== null
                ? `${origen.marea_metros >= 0 ? '+' : ''}${Number(origen.marea_metros).toFixed(1)} m`
                : '--');

        const visibilidadTexto =
            origen.visibilidad ||
            (origen.visibilidad_km !== undefined && origen.visibilidad_km !== null
                ? `${Number(origen.visibilidad_km).toFixed(0)} km`
                : '12 km');

        const vientoValor = origen.viento ?? origen.Viento;
        const vientoTexto =
            typeof vientoValor === 'number' ? `${vientoValor} nudos` : (vientoValor || '8 nudos NO');

        const estadoCanal = origen.estadoCanal || origen.estado_canal || 'Abierto';
        const pilotaje = origen.pilotaje || origen.estado_pilotaje || 'Normal';
        const pleamar = origen.pleamar || origen.hora_pleamar || '--';
        const dragado =
            origen.dragado ||
            (origen.calado_dragado_m !== undefined && origen.calado_dragado_m !== null
                ? `${Number(origen.calado_dragado_m).toFixed(1)} m`
                : null);
        const restriccion = origen.restriccion || origen.restriccion_canal || '';

        const estadoUpper = estadoCanal.toUpperCase();
        const claseEstado =
            origen.claseEstado ||
            (estadoUpper.includes('CERRAD') || estadoUpper.includes('SUSPEND')
                ? 'text-danger'
                : estadoUpper.includes('RESTR') || estadoUpper.includes('ALERTA')
                    ? 'text-warning'
                    : 'text-success');

        return {
            ...origen,
            titulo: origen.titulo || 'CONDICIONES DEL CANAL',
            subtitulo: origen.subtitulo || 'Reporte meteorológico y estado DIMAR',
            icono: origen.icono || 'feather icon-wind',
            marea: mareaTexto,
            visibilidad: visibilidadTexto,
            viento: vientoTexto,
            estadoCanal,
            claseEstado,
            pilotaje,
            pleamar,
            dragado,
            restriccion
        };
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get isLoading(): boolean {
        return this.cargandoCanal && !this.datosAutonomosSQL && !this.datosVivos;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_PANEL_CANAL',
                this.data
            );
        }
    }
}
