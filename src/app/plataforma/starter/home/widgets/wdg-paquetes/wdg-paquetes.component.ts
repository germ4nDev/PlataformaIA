// import { Component, Input, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { SocketManagerService } from 'src/app/theme/shared/service';
// import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// @Component({
//     selector: 'app-wdg-paquetes',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './wdg-paquetes.component.html',
//     styleUrl: './wdg-paquetes.component.scss'
// })
// export class WdgPaquetesComponent implements OnInit, OnDestroy {
//     @Input() data: any;
//     @Input() widgetId: string = '';

//     public paquetesActivos: Array<{ suscriptor: string, cantidad: number, porcentaje: number }> = [];
//     public paquetesInactivos: Array<{ suscriptor: string, cantidad: number, porcentaje: number }> = [];

//     // Opcional: Para alternar vistas si agregas pestañas en el HTML del widget
//     public vistaActual: 'activos' | 'inactivos' = 'activos';

//     private socketSub!: Subscription;

//     constructor(
//         private _socketManager: SocketManagerService,
//         private _dashboardService: DashboardPlataformaService
//     ) { }

//     ngOnInit() {
//         this.cargarMetricasReales();

//         this.socketSub = this._socketManager.paquetesActualizados$.subscribe(() => {
//             this.cargarMetricasReales();
//         });
//     }

//     cargarMetricasReales() {
//         this._dashboardService.getPaquetesPorSuscriptor().subscribe({
//             // 🟢 Cambiamos el tipado estricto a 'any' para que acepte la respuesta del backend
//             next: (res: any) => {
//                 console.log('datos metricas paquetes', res);

//                 // 1. Mapear Activos
//                 const activosList = res.activos || [];
//                 const maxActivos = Math.max(...activosList.map((item: any) => item.cantidad), 1);
//                 this.paquetesActivos = activosList.map((item: any) => ({
//                     suscriptor: item.suscriptor,
//                     cantidad: item.cantidad,
//                     porcentaje: Math.round((item.cantidad / maxActivos) * 100)
//                 }));

//                 // 2. Mapear Inactivos
//                 const inactivosList = res.inactivos || [];
//                 const maxInactivos = Math.max(...inactivosList.map((item: any) => item.cantidad), 1);
//                 this.paquetesInactivos = inactivosList.map((item: any) => ({
//                     suscriptor: item.suscriptor,
//                     cantidad: item.cantidad,
//                     porcentaje: Math.round((item.cantidad / maxInactivos) * 100)
//                 }));
//             },
//             error: (err) => console.error('Error al cargar paquetes por suscriptor:', err)
//         });
//     }

//     ngOnDestroy() {
//         if (this.socketSub) this.socketSub.unsubscribe();
//     }
// }
import { ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';
import { WidgetHeaderComponent } from "src/app/theme/shared/components/widget-header/widget-header.component";

@Component({
    selector: 'app-wdg-paquetes',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent],
    templateUrl: './wdg-paquetes.component.html',
    styleUrl: './wdg-paquetes.component.scss'
})
export class WdgPaquetesComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = '';

    // 🟢 Nuevo arreglo unificado
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

                // 1. Agrupar datos por suscriptor
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

                // 2. Calcular el valor máximo absoluto para escalar las barras proporcionalmente
                let maximoAbsoluto = 1;
                arrayUnificado.forEach(item => {
                    if (item.activos > maximoAbsoluto) maximoAbsoluto = item.activos;
                    if (item.inactivos > maximoAbsoluto) maximoAbsoluto = item.inactivos;
                });

                // 3. Mapear al arreglo final con los porcentajes
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

    abrirEnfoque() {
        // Le pasas su propio ID y Data al servicio central
        this._dashboardService.abrirModoEnfoque(this.widgetId, this.data);
    }

}
