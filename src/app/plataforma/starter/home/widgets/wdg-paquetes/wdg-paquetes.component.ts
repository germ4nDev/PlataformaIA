import { ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el nuevo contenedor universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-paquetes',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Actualizamos el import
    templateUrl: './wdg-paquetes.component.html',
    styleUrl: './wdg-paquetes.component.scss'
})
export class WdgPaquetesComponent implements OnInit, OnDestroy {
    @Input() data: any;

    // 🟢 Agregamos fallback por seguridad
    @Input() widgetId: string = 'WDG_PLAT_PAQUETES';

    public paquetesUnificados: Array<{
        suscriptor: string,
        activos: number,
        inactivos: number,
        pctActivos: number,
        pctInactivos: number
    }> = [];

    private socketSub!: Subscription;

    constructor(
        private _socketManager: SocketManagerService,
        private _dashboardService: DashboardPlataformaService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarMetricasReales();

        this.socketSub = this._socketManager.paquetesActualizados$.subscribe(() => {
            this.cargarMetricasReales();
        });
    }

    cargarMetricasReales() {
        this._dashboardService.getPaquetesPorSuscriptor().subscribe({
            next: (res: any) => {
                const activosList = res.activos || [];
                const inactivosList = res.inactivos || [];

                const mapaUnificado = new Map<string, any>();

                activosList.forEach((item: any) => {
                    mapaUnificado.set(item.suscriptor, {
                        suscriptor: item.suscriptor,
                        activos: item.cantidad,
                        inactivos: 0
                    });
                });

                inactivosList.forEach((item: any) => {
                    if (mapaUnificado.has(item.suscriptor)) {
                        mapaUnificado.get(item.suscriptor).inactivos = item.cantidad;
                    } else {
                        mapaUnificado.set(item.suscriptor, {
                            suscriptor: item.suscriptor,
                            activos: 0,
                            inactivos: item.cantidad
                        });
                    }
                });

                const arrayUnificado = Array.from(mapaUnificado.values());

                let maximoAbsoluto = 1;
                arrayUnificado.forEach(item => {
                    if (item.activos > maximoAbsoluto) maximoAbsoluto = item.activos;
                    if (item.inactivos > maximoAbsoluto) maximoAbsoluto = item.inactivos;
                });

                this.paquetesUnificados = arrayUnificado.map(item => ({
                    suscriptor: item.suscriptor,
                    activos: item.activos,
                    inactivos: item.inactivos,
                    pctActivos: Math.round((item.activos / maximoAbsoluto) * 100),
                    pctInactivos: Math.round((item.inactivos / maximoAbsoluto) * 100)
                }));

                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al cargar paquetes por suscriptor:', err)
        });
    }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
