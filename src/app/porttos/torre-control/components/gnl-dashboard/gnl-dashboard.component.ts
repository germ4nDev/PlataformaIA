import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { Subscription } from 'rxjs';

import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { WIDGET_MAP } from '../../widget-registry';

@Component({
    selector: 'app-gnl-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './gnl-dashboard.component.html', // <-- Archivo enlazado
    styleUrls: ['./gnl-dashboard.component.scss']  // (Opcional, si creas uno)
})
export class GnlDashboardComponent implements OnInit, OnChanges, OnDestroy {
    @Input() puerto!: string;
    @Input() usuarioId!: string;
    @Input() lsWidgets!: any[];

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

    public brazoSeleccionado: string = 'TODOS';
    public brazosActivos: Set<string> = new Set();
    public ultimoEstadoBrazos: Map<string, any> = new Map();
    private socketSub: Subscription | null = null;

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private socketService: SocketManagerService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.iniciarGridster();
        this.cargarLayout();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
            this.cargarLayout(); // Recarga si cambia el puerto global
        }
    }

    async cargarLayout() {
        this.dashboard = await this.layoutEngine.obtenerLayoutBase('TLC_GNL_001', this.usuarioId, this.lsWidgets);
        this.encenderTelemetria();
    }

    encenderTelemetria() {
        if (this.socketSub) this.socketSub.unsubscribe();

        // ✅ Nos suscribimos al Subject público de tu SocketManagerService
        this.socketSub = this.socketService.telemetriaGNLActualizada$.subscribe((payload: any) => {
            // Filtramos para que solo procese los datos del puerto seleccionado en la cabecera
            if (payload.id_puerto !== this.puerto) return;

            // 1. Registramos el brazo dinámicamente
            this.brazosActivos.add(payload.codigo_segmento);

            // 2. Guardamos su último estado conocido en memoria
            this.ultimoEstadoBrazos.set(payload.codigo_segmento, payload);

            // 3. Verificamos qué píldora tiene seleccionada el usuario
            if (this.brazoSeleccionado === 'TODOS') {
                this.calcularConsolidado();
            } else if (this.brazoSeleccionado === payload.codigo_segmento) {
                // Si el payload que acaba de llegar pertenece al brazo que estamos mirando, actualizamos
                this.inyectarDatosGridster(payload.flujo_m3, payload.temp_ducto, payload.presion_psi);
            }
        });
    }

    cambiarFiltroGNL(brazo: string) {
        this.brazoSeleccionado = brazo;
        if (brazo === 'TODOS') {
            this.calcularConsolidado();
        } else {
            const datos = this.ultimoEstadoBrazos.get(brazo);
            if (datos) this.inyectarDatosGridster(datos.flujo_m3, datos.temp_ducto, datos.presion_psi);
        }
    }

    private calcularConsolidado() {
        let sFlujo = 0, sTemp = 0, sPresion = 0;
        const total = this.ultimoEstadoBrazos.size;
        if (total === 0) return;

        this.ultimoEstadoBrazos.forEach(d => {
            sFlujo += d.flujo_m3; sTemp += d.temp_ducto; sPresion += d.presion_psi;
        });
        this.inyectarDatosGridster(sFlujo, sTemp / total, sPresion / total);
    }

    private inyectarDatosGridster(flujo: number, temp: number, presion: number) {
        this.dashboard.forEach(w => {
            const c = (w.type || '').toUpperCase();
            if (c.includes('HISTORICO_FLUJO')) w.data = { ...w.data, flujo_m3: flujo };
            if (c.includes('TEMPERATURA')) w.data = { ...w.data, temp_ducto: temp };
            if (c.includes('PRESION')) w.data = { ...w.data, presion_psi: presion };
        });
        this.cdr.detectChanges();
    }

    obtenerComponentePara(codigoWidget: string) {
        return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
    }

    iniciarGridster() {
        this.options = {
            gridType: GridType.ScrollVertical, margin: 16,
            minCols: 12, maxCols: 12, draggable: { enabled: false }, resizable: { enabled: false }
        };
    }

    trackByWidget(i: number, w: any) { return w.idClon || w.type; }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
