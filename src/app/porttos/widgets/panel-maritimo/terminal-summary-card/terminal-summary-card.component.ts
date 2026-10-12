// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - Terminal Summary Card (Refactorizado Dumb Component)
// */
// import { Component, Input, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { TerminalDocksDetailComponent } from "../terminal-docks-detail/terminal-docks-detail.component";
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
// import { TcFooterComponent } from '../../tc-footer/tc-footer.component';

// @Component({
//     selector: 'app-terminal-summary-card',
//     standalone: true,
//     imports: [CommonModule, TerminalDocksDetailComponent, WidgetShellComponent, TcFooterComponent],
//     templateUrl: './terminal-summary-card.component.html',
//     styleUrls: ['./terminal-summary-card.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class TerminalSummaryCardComponent implements AfterViewInit, OnChanges {

//     // 🟢 NUEVO ESTÁNDAR
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Toda la magia del slot y diccionarios la hace el padre, aquí solo llega la data final.
//     @Input() datosVivos: any;a

//     public esVistaCompacta: boolean = true;

//     constructor(
//         private _torreService: DashboardService,
//         private el: ElementRef
//     ) { }

//     // 🟢 EL CEREBRO REACTIVO: Extrae la configuración unificada
//     get data() {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || this.widgetConfig.dataTerminal || {};
//         const datosVivos = this.datosVivos?.dataTerminal || this.datosVivos || {};

//         // Fusión limpia
//         return {
//             ...configBase,
//             ...datosVivos
//         };
//     }

//     get cargandoIA(): boolean {
//         // Asumimos que está cargando si no ha recibido la inyección viva o la configuración base
//         return !this.datosVivos && !this.widgetConfig;
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         // Redimensionamiento forzado si entra en modo enfoque a través de un Input change
//         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
//             this.evaluarVistaCompacta();
//         }
//     }

//     ngAfterViewInit(): void {
//         // Damos un tick para que el DOM se asiente
//         setTimeout(() => {
//             this.evaluarVistaCompacta();
//         });
//     }

//     private evaluarVistaCompacta() {
//         // Evaluamos si el componente está dentro de un modal o si isEnfoque es true
//         const contenedorModal = this.el.nativeElement.closest('.modal, dialog, .cdk-overlay-pane, .modal-dialog');
//         if (contenedorModal || this.isEnfoque) {
//             this.esVistaCompacta = false;
//             this.mostrarTabla = true;
//         } else {
//             this.esVistaCompacta = true;
//         }
//     }

//     public maximizarDesdeShell() {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TERMINAL_INDIVIDUAL', this.data);
//         }
//     }

//     public toggleVista(): void {
//         this.mostrarTabla = !this.mostrarTabla;
//     }
// }
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Terminal Summary Card (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    ElementRef,
    OnInit,
    AfterViewInit,
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
import { TerminalDocksDetailComponent } from '../terminal-docks-detail/terminal-docks-detail.component';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { TcFooterComponent } from '../../tc-footer/tc-footer.component';

@Component({
    selector: 'app-terminal-summary-card',
    standalone: true,
    imports: [CommonModule, TerminalDocksDetailComponent, WidgetShellComponent, TcFooterComponent],
    templateUrl: './terminal-summary-card.component.html',
    styleUrls: ['./terminal-summary-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TerminalSummaryCardComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo de retrocompatibilidad (por si se abre en modal o desde una vista aún no migrada)
    @Input() datosVivos: any;

    public esVistaCompacta: boolean = true;
    public cargandoDatos: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private el: ElementRef,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatosAutonomos();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            this.evaluarVistaCompacta();
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarDatosAutonomos();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.evaluarVistaCompacta();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server (T_Maestro_Terminales + TCL_EstadoTerminales + TCL_EstadoMuelles)
     */
    private cargarDatosAutonomos(): void {
        // 1. Si viene precargado desde el modal de Enfoque o por input directo, no hace petición HTTP
        if (this.datosVivos?.dataTerminal || this.datosVivos?.docks || this.widgetConfig?.docks) {
            this.datosAutonomosSQL = this.normalizarEstructuraTerminal(
                this.datosVivos?.dataTerminal || this.datosVivos || this.widgetConfig
            );
            this.cargandoDatos = false;
            this.cdr.detectChanges();
            return;
        }

        if (!this.widgetConfig) return;

        const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const identificadorSlot =
            this.widgetConfig.idClon ||
            this.widgetConfig.id_terminal ||
            this.widgetConfig.id ||
            'TERM_SLOT_0';

        this.cargandoDatos = true;

        this._maritimoService
            .obtenerDatosTerminalSlot(puerto, identificadorSlot)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (terminalRaw: any) => {
                    if (terminalRaw) {
                        this.datosAutonomosSQL = this.normalizarEstructuraTerminal(terminalRaw);
                    }
                    this.cargandoDatos = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(`❌ [SmartWidget Terminal] Error cargando ${identificadorSlot}:`, err);
                    this.cargandoDatos = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa columnas SQL (T_Maestro_Terminales / T_Maestro_Muelles / TCL_EstadoTerminales)
     * con la estructura visual que consume terminal-summary-card.component.html
     */
    private normalizarEstructuraTerminal(raw: any): any {
        if (!raw) return {};

        const ocupacionNum = Number(raw.ocupacion_pct ?? parseFloat(raw.kpis?.ocupacion || '0'));
        const statusCalculado =
            raw.status ||
            raw.severidad_badge ||
            (ocupacionNum >= 85 ? 'warning' : 'success');

        // Mapeo de Muelles (Soporta arreglo 'docks' actual o relación 'muelles' de T_Maestro_Muelles + TCL_EstadoMuelles)
        const muellesOrigen = raw.docks || raw.muelles || [];
        const docksNormalizados = muellesOrigen.map((m: any) => {
            const enMantenimiento = m.estado_mantenimiento === true || m.estado_mantenimiento === 1 || m.estado_ocupacion === 'maintenance';
            const ocupado = m.estado_ocupacion === 'occupied' || (m.motonave_atracada && m.motonave_atracada !== '—');

            let dockClass = m.class;
            if (!dockClass) {
                dockClass = enMantenimiento ? 'maintenance' : ocupado ? 'occupied' : 'free';
            }

            return {
                ...m,
                id: m.id_interno || m.id || m.codigo_muelle,
                label: m.label || m.codigo_muelle || m.nombre || m.id,
                class: dockClass,
                barcoAtracado:
                    m.barcoAtracado ||
                    (m.motonave_atracada && m.motonave_atracada !== '—' ? m.motonave_atracada : null),
                operation: m.operation || m.operacion_actual || m.especialidad || 'Disponible',
                especialidad: m.especialidad || ''
            };
        });

        return {
            ...raw,
            nombreTerminal: raw.nombreTerminal || raw.nombre || 'Terminal Marítimo',
            descripcionTerminal: raw.descripcionTerminal || raw.subtitulo || raw.descripcion || 'Operación Portuaria',
            legend: raw.legend || raw.descripcion || '',
            status: statusCalculado,
            docks: docksNormalizados,
            kpis: {
                ocupacion: raw.kpis?.ocupacion || (raw.ocupacion_pct !== undefined ? `${Math.round(raw.ocupacion_pct)}%` : '0%'),
                motonaves: raw.kpis?.motonaves ?? raw.motonaves_activas ?? 0,
                metricValue: raw.kpis?.metricValue || raw.volumen_dia_texto || raw.volumen_dia_valor || '0',
                metricLabel: (raw.kpis?.metricLabel || raw.unidad_medida || 'TM HOY').toUpperCase()
            }
        };
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || this.widgetConfig?.dataTerminal || {};
        const inyeccionExterna = this.datosVivos?.dataTerminal || this.datosVivos || {};

        return {
            ...configBase,
            ...inyeccionExterna,
            ...(this.datosAutonomosSQL || {})
        };
    }

    get cargandoIA(): boolean {
        return this.cargandoDatos && !this.datosAutonomosSQL && !this.datosVivos;
    }

    private evaluarVistaCompacta(): void {
        const contenedorModal = this.el.nativeElement.closest('.modal, dialog, .cdk-overlay-pane, .modal-dialog');
        if (contenedorModal || this.isEnfoque) {
            this.esVistaCompacta = false;
            this.mostrarTabla = true;
        } else {
            this.esVistaCompacta = true;
        }
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PORT_TERMINAL_INDIVIDUAL',
                this.data
            );
        }
    }

    public toggleVista(): void {
        this.mostrarTabla = !this.mostrarTabla;
    }
}
