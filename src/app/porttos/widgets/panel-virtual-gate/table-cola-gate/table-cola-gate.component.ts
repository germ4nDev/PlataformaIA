/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-table-cola-gate',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './table-cola-gate.component.html',
    styleUrls: ['./table-cola-gate.component.scss']
})
export class TableColaGateComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    public listaCitas: any[] = [];
    public cargando: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargar();
    }

    /** Corregido 2026-10-17: antes no recargaba al cambiar de puerto. */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.cargar();
        }
    }

    private cargar(): void {
        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();

        // Si el widgetConfig ya trae las citas inyectadas directamente, las usamos de inmediato
        if (this.widgetConfig?.citas && Array.isArray(this.widgetConfig.citas)) {
            this.listaCitas = this.widgetConfig.citas;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        // Si no, las pedimos de forma autónoma usando el servicio compartido por puerto
        this._virtualGateService
            .obtenerColaGate(puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (resp: any) => {
                    this.cargando = false;
                    // Extraemos las citas directamente del objeto virtualGate procesado
                    console.log('*************respuesta servicio', resp);

                    // Corregido 2026-10-17: resp.data no existe cuando la API falla (TypeError); se usa el nodo normalizado
                    const vg = resp?.virtualGate || resp?.data?.virtualGate || resp;
                    const citasCrudas = vg?.citas || vg?.cola || [];

                    this.listaCitas = Array.isArray(citasCrudas) ? citasCrudas : [];

                    console.log('🚛 [TableColaGateComponent] Citas cargadas en la tabla:', this.listaCitas);
                    console.log('🚛 [TableColaGateComponent] numero de Citas cargadas en la tabla:', this.listaCitas.length);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [TableColaGateComponent] Error al obtener citas:', err);
                    this.listaCitas = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    maximizarDesdeShell(): void {
        this._torreService.abrirModoEnfoque(
            this.widgetConfig?.type || 'PTT_GATE_TABLA_COLA',
            this.listaCitas
        );
    }
}
