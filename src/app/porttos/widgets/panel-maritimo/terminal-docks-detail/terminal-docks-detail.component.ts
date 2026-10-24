/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: TerminalDocksDetailComponent
    Pattern: PORTTOS Generic Widget - Detalle de Muelles (Refactorizado Dumb Component)
*/
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-terminal-docks-detail',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './terminal-docks-detail.component.html',
    styleUrls: ['./terminal-docks-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TerminalDocksDetailComponent {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() vistaCompacta: boolean = true;

    // 🟢 LA NUEVA COMPUERTA: Recibe los datos vivos directo de la pestaña
    @Input() datosVivos: any;

    constructor(private _torreService: DashboardService) { }

    // 🟢 EL CEREBRO REACTIVO: Extrae el array de muelles sin importar cómo venga empaquetado
    get dataArray(): any[] {
        // 1. Priorizamos los datos vivos inyectados
        if (this.datosVivos) {
            if (Array.isArray(this.datosVivos)) return this.datosVivos;
            if (this.datosVivos.muelles) return this.datosVivos.muelles;
        }

        // 2. Fallback a la configuración estática
        if (this.widgetConfig) {
            if (Array.isArray(this.widgetConfig)) return this.widgetConfig;
            if (Array.isArray(this.widgetConfig.data)) return this.widgetConfig.data;
            if (this.widgetConfig.data?.muelles) return this.widgetConfig.data.muelles;
        }

        return [];
    }

    // 🟢 Metadata combinada para el título del Shell y configuraciones visuales
    get configData(): any {
        const base = this.widgetConfig?.data || {};
        const vivos = this.datosVivos || {};

        // Evitamos fusionar (spread) accidentalmente si alguno viene como Array puro
        const safeBase = Array.isArray(base) ? {} : base;
        const safeVivos = Array.isArray(vivos) ? {} : vivos;

        return { ...safeBase, ...safeVivos };
    }

    /** La columna AIS solo aparece si el backend envió la verificación. */
    get hayAis(): boolean {
        return this.dataArray.some((m: any) => m?.ais && m.ais.estado !== 'SIN_DATOS');
    }

    public etiquetaAis(estado?: string): string {
        switch (estado) {
            case 'CONFIRMADO': return 'Confirmado';
            case 'SIN_CONFIRMAR': return 'No lo ve';
            case 'DISCREPANCIA': return 'Otro barco';
            case 'NO_REPORTADO': return 'Fuera de line-up';
            case 'LIBRE': return 'Libre';
            default: return 'Sin datos';
        }
    }

    public textoEstado(muelle: any): string {
        if (muelle?.estado === 'mantenimiento') return 'MANTENIMIENTO';
        if (muelle?.estado === 'ocupado') return 'OCUPADO';
        if (muelle?.estado === 'libre') return 'LIBRE';
        return String(muelle?.status || '').toUpperCase();
    }

    public getDotColor(especialidad: string): string {
        const esp = (especialidad || '').toLowerCase();
        if (esp.includes('contenedor')) return '#3b82f6'; // Azul primario
        if (esp.includes('granel')) return '#f59e0b';      // Naranja warning
        if (esp.includes('líquido')) return '#10b981';     // Verde success
        return '#64748b';                                  // Gris secundario
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            // Pasamos un objeto estandarizado al modo enfoque
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_DOCKS_DETAIL', {
                ...this.configData,
                muelles: this.dataArray
            });
        }
    }
}
