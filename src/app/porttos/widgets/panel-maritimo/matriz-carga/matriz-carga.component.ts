// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - Matriz de Carga (Refactorizado Dumb Component)
// */
// import { Component, Input, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// // 🟢 Importamos el Shell maestro
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-matriz-carga',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './matriz-carga.component.html',
//     styleUrls: ['./matriz-carga.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class MatrizCargaComponent {

//     // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Recibe la data inyectada directamente desde el HTML
//     @Input() datosVivos: any;

//     constructor(
//         private _torreService: DashboardService
//     ) { }

//     // 🟢 EL CEREBRO REACTIVO: Elimina suscripciones, búsquedas por ID y forcejeos.
//     get data() {
//         // Combinamos la configuración estática de diseño con la data viva inyectada.
//         // Si no hay data inyectada, asume la configuración base o devuelve vacío.
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...(this.datosVivos || {})
//         };
//     }

//     get isLoading(): boolean {
//         // Consideramos que está cargando solo si la data no ha llegado.
//         return !this.datosVivos;
//     }

//     formatNum(val: number): string {
//         if (!val || val === 0) return '—';
//         return val.toLocaleString('es-CO');
//     }

//     // 🟢 Toggle de enfoque: Abre o cierra el modal
//     maximizarDesdeShell() {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_MATRIZ', this.data);
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Matriz Terminal x Tipo de Carga (Consumo Autónomo SQL)
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

export interface IFilaMatrizCarga {
    terminal: string;
    cont: number;
    solido: number;
    general: number;
    liquido: number;
    carbon: number;
    total: number;
}

@Component({
    selector: 'app-matriz-carga',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './matriz-carga.component.html',
    styleUrls: ['./matriz-carga.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MatrizCargaComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoMatriz: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarMatrizCarga();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarMatrizCarga();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte)
     */
    private cargarMatrizCarga(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (this.datosVivos && (Array.isArray(this.datosVivos.filas) || Array.isArray(this.datosVivos))) {
            this.datosAutonomosSQL = this.normalizarMatriz(this.datosVivos);
            this.cargandoMatriz = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_TAB_MATRIZ_CARGA'
        )
            .trim()
            .toUpperCase();

        this.cargandoMatriz = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarMatriz(respuestaSQL);
                    this.cargandoMatriz = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget MatrizCarga] Error consultando matriz terminal x carga:', err);
                    this.datosAutonomosSQL = { filas: [] };
                    this.cargandoMatriz = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Objeto con { filas: [{ terminal, cont, solido, general, liquido, carbon, total }] }
     * 2. Filas relacionales de TCL_TraficoPortuarioMaritimo o TCL_HistoricosSupertransporte
     */
    private normalizarMatriz(raw: any): any {
        if (!raw) return { filas: [] };

        // Caso A: Ya viene con el arreglo 'filas' pre-pivoteado
        if (Array.isArray(raw.filas) && raw.filas.length > 0 && raw.filas[0].terminal !== undefined) {
            const filasLimpias: IFilaMatrizCarga[] = raw.filas.map((f: any) => {
                const cont = Number(f.cont ?? f.contenedores ?? 0);
                const solido = Number(f.solido ?? f.granel_solido ?? 0);
                const general = Number(f.general ?? f.carga_general ?? 0);
                const liquido = Number(f.liquido ?? f.granel_liquido ?? 0);
                const carbon = Number(f.carbon ?? 0);
                const total = Number(f.total ?? (cont + solido + general + liquido + carbon));

                return {
                    terminal: f.terminal || f.sociedadPortuaria || '—',
                    cont,
                    solido,
                    general,
                    liquido,
                    carbon,
                    total
                };
            });

            return {
                ...raw,
                operadores: raw.operadores || filasLimpias.length,
                filas: filasLimpias
            };
        }

        // Caso B: Pivot dinámico de filas SQL (TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte)
        const registros: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
        if (registros.length === 0) {
            return { ...(Array.isArray(raw) ? {} : raw), filas: [] };
        }

        const mapaTerminales = new Map<string, IFilaMatrizCarga>();
        let anioDetectado = raw.anio || '';

        registros.forEach((r: any) => {
            const terminal = (
                r.sociedadPortuaria ||
                r.sociedad_portuaria ||
                r.terminal ||
                r.id_terminal ||
                'OTROS'
            ).trim();

            if (!anioDetectado && (r.anioVigencia || r.anio)) {
                anioDetectado = String(r.anioVigencia || r.anio);
            }

            if (!mapaTerminales.has(terminal)) {
                mapaTerminales.set(terminal, {
                    terminal,
                    cont: 0,
                    solido: 0,
                    general: 0,
                    liquido: 0,
                    carbon: 0,
                    total: 0
                });
            }

            const fila = mapaTerminales.get(terminal)!;

            // Si la fila ya viene con columnas de tipo de carga separadas
            if (r.cont !== undefined || r.solido !== undefined) {
                fila.cont += Number(r.cont || 0);
                fila.solido += Number(r.solido || 0);
                fila.general += Number(r.general || 0);
                fila.liquido += Number(r.liquido || 0);
                fila.carbon += Number(r.carbon || 0);
            } else {
                // Si viene normalizada por fila desde TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte
                const tipo = (r.tipoCarga || r.tipo_carga || 'GENERAL').toUpperCase();
                const volumen =
                    r.totalToneladas !== undefined
                        ? Number(r.totalToneladas)
                        : r.total_toneladas !== undefined
                            ? Number(r.total_toneladas)
                            : Number(r.exportacion || 0) +
                            Number(r.importacion || 0) +
                            Number(r.transbordo || 0) +
                            Number(r.transitoInternacional || 0) +
                            Number(r.fluvial || 0) +
                            Number(r.cabotaje || 0) +
                            Number(r.movilizacionesABordo || 0) +
                            Number(r.transitoria || 0);

                if (tipo.includes('CONTENEDOR')) {
                    fila.cont += volumen;
                } else if (tipo.includes('CARBÓN') || tipo.includes('CARBON')) {
                    fila.carbon += volumen;
                } else if (tipo.includes('LÍQUIDO') || tipo.includes('LIQUIDO')) {
                    fila.liquido += volumen;
                } else if (tipo.includes('SÓLIDO') || tipo.includes('SOLIDO')) {
                    fila.solido += volumen;
                } else {
                    fila.general += volumen;
                }
            }

            fila.total = Math.round(fila.cont + fila.solido + fila.general + fila.liquido + fila.carbon);
        });

        const filasPivoteadas = Array.from(mapaTerminales.values())
            .map((f) => ({
                ...f,
                cont: Math.round(f.cont),
                solido: Math.round(f.solido),
                general: Math.round(f.general),
                liquido: Math.round(f.liquido),
                carbon: Math.round(f.carbon)
            }))
            .sort((a, b) => b.total - a.total);

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || '🏆 MATRIZ TERMINAL x TIPO DE CARGA',
            anio: anioDetectado,
            operadores: filasPivoteadas.length,
            filas: filasPivoteadas
        };
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get filas(): IFilaMatrizCarga[] {
        return this.data?.filas || [];
    }

    get isLoading(): boolean {
        return this.cargandoMatriz && !this.datosAutonomosSQL && !this.datosVivos;
    }

    formatNum(val: number): string {
        if (!val || val === 0) return '—';
        return Math.round(val).toLocaleString('es-CO');
    }

    trackByTerminal(index: number, item: IFilaMatrizCarga): string {
        return item.terminal || index.toString();
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_TAB_MATRIZ_CARGA',
                this.data
            );
        }
    }
}
