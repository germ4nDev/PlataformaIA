/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';

@Component({
    selector: 'app-table-cola-gate',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent, TablaTclComponent],
    templateUrl: './table-cola-gate.component.html',
    styleUrls: ['./table-cola-gate.component.scss']
})
export class TableColaGateComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque = false;
    public listaCitas: any[] = [];

    /** Vista ampliada (2026-10-24): todas las columnas que ya trae cada cita, con búsqueda, orden y CSV. */
    public readonly columnasDetalle: ColumnaTabla[] = [
        { campo: 'placa', titulo: 'Placa', tipo: 'principal' },
        { campo: 'conductor', titulo: 'Conductor' },
        { campo: 'transportador', titulo: 'Transportador' },
        { campo: 'tipo_carga', titulo: 'Carga' },
        { campo: 'operacion', titulo: 'Operación' },
        { campo: 'terminal', titulo: 'Terminal' },
        { campo: 'fecha_hora_cita', titulo: 'Cita', tipo: 'fecha' },
        { campo: 'franja_horaria', titulo: 'Franja' },
        { campo: 'tiempo_espera_minutos', titulo: 'Espera', tipo: 'numero', unidad: 'min' },
        { campo: 'ubicacion', titulo: 'Ubicación' },
        { campo: 'distancia_km', titulo: 'Distancia', tipo: 'numero', decimales: 1, unidad: 'km' },
        { campo: 'distancia_estimada', titulo: 'Dist. estimada', tipo: 'si-no' },
        { campo: 'peso_bascula_ton', titulo: 'Báscula', tipo: 'numero', decimales: 1, unidad: 't' },
        { campo: 'ocr', titulo: 'OCR', tipo: 'estado' },
        { campo: 'biometria', titulo: 'Biometría', tipo: 'estado' },
        { campo: 'documental', titulo: 'Documental', tipo: 'estado' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
        { campo: 'imputados', titulo: 'Sin dato en', tipo: 'lista' }
    ];

    /** Filas de la vista ampliada: validaciones como Aprobada / Fallida / Sin dato. */
    private _detalle: { origen: any[] | null; filas: any[] } = { origen: null, filas: [] };
    get filasDetalle(): any[] {
        if (this._detalle.origen !== this.listaCitas) {
            const v = (x: any) => (x === true ? 'APROBADA' : x === false ? 'FALLIDA' : 'SIN DATO');
            this._detalle = {
                origen: this.listaCitas,
                filas: this.listaCitas.map((c: any) => ({
                    ...c, id: c.id_cita, ocr: v(c.validacion_ocr), biometria: v(c.validacion_biometria), documental: v(c.validacion_documental)
                }))
            };
        }
        return this._detalle.filas;
    }
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

    /** Origen del dato (fuente, ventana de tiempo, campos sin dato): pie de la vista ampliada. */
    public origen: any = null;

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

                    // Corregido 2026-10-17: resp.data no existe cuando la API falla (TypeError); se usa el nodo normalizado
                    const vg = resp?.virtualGate || resp?.data?.virtualGate || resp;
                    const citasCrudas = vg?.citas || vg?.cola || [];

                    this.listaCitas = Array.isArray(citasCrudas) ? citasCrudas : [];
                    this.origen = vg?.origen || null;
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
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
            return;
        }
        this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GATE_TABLA_COLA', {
            puerto: this.widgetConfig?.puerto, titulo: this.widgetConfig?.titulo, subtitulo: this.widgetConfig?.subtitulo
        });
    }
}
