// // import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Subscription } from 'rxjs';
// // import { SocketManagerService } from 'src/app/theme/shared/service';
// // import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';

// // // 🟢 Importamos el contenedor maestro universal
// // import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // @Component({
// //     selector: 'app-wdg-usuarios',
// //     standalone: true,
// //     imports: [CommonModule, WidgetShellComponent], // 🟢 Actualizamos el import
// //     templateUrl: './wdg-usuarios.component.html'
// // })
// // export class WdgUsuariosComponent implements OnInit, OnDestroy {
// //     @Input() data: any;

// //     // 🟢 Fallback de seguridad
// //     @Input() widgetId: string = 'WDG_PLAT_USUARIOS_CONECTADOS';

// //     public totalConectados: number = 0;
// //     private socketSub!: Subscription;

// //     constructor(
// //         private _socketManager: SocketManagerService,
// //         private _dashboardService: DashboardPlataformaService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     ngOnInit() {
// //         this.cargarDataReal();

// //         this.socketSub = this._socketManager.usuariosActualizados$.subscribe(() => {
// //             this.cargarDataReal();
// //         });
// //     }

// //     cargarDataReal() {
// //         this._dashboardService.getUsuariosConectados().subscribe({
// //             next: (res: any) => {
// //                 this.totalConectados = res || 0;
// //                 this.cdr.detectChanges(); // 🟢 Aseguramos el renderizado
// //             },
// //             error: (err) => console.error('Error al cargar usuarios conectados:', err)
// //         });
// //     }

// //     ngOnDestroy() {
// //         if (this.socketSub) this.socketSub.unsubscribe();
// //     }
// // }
// import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { SocketManagerService } from 'src/app/theme/shared/service';
// import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-wdg-usuarios',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './wdg-usuarios.component.html'
// })
// export class WdgUsuariosComponent implements OnInit, OnDestroy {
//     @Input() data: any;
//     @Input() widgetId: string = 'WDG_PLAT_USUARIOS_CONECTADOS';

//     public totalConectados: number = 0;
//     public usuariosConectados: Array<{
//         nombre: string;
//         rol: string;
//         identificacion: string;
//         correo: string;
//         iniciales: string;
//         colorAvatar: string;
//         aplicacionActual: string;
//         tiempoConexion: string;
//         dispositivo: string;
//     }> = [];

//     private socketSub!: Subscription;

//     constructor(
//         private _socketManager: SocketManagerService,
//         private _dashboardService: DashboardPlataformaService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit() {
//         this.cargarDataReal();

//         this.socketSub = this._socketManager.usuariosActualizados$.subscribe(() => {
//             this.cargarDataReal();
//         });
//     }

//     cargarDataReal() {
//         this._dashboardService.getUsuariosConectados().subscribe({
//             next: (res: any) => {
//                 // Si tu servicio devuelve un objeto con el total y la lista: { total: 2, sesiones: [...] }
//                 // O si devuelve directamente la lista, ajústalo según tu backend:
//                 this.totalConectados = res?.total || res?.length || 0;

//                 // Mapeo de ejemplo (puedes adaptarlo a la estructura de tu API)
//                 this.usuariosConectados = res?.sesiones || [
//                     {
//                         nombre: 'German Valencia',
//                         rol: 'Administrador',
//                         identificacion: '1110543298',
//                         correo: 'german.valencia&#64;qplus.com',
//                         iniciales: 'GV',
//                         colorAvatar: 'bg-primary',
//                         aplicacionActual: 'Dashboard Principal',
//                         tiempoConexion: '3h 45m',
//                         dispositivo: 'Desktop (Chrome)'
//                     },
//                     {
//                         nombre: 'Claudia Ortiz',
//                         rol: 'Suscriptor',
//                         identificacion: '25489632',
//                         correo: 'claudia.ortiz&#64;qplus.com',
//                         iniciales: 'CO',
//                         colorAvatar: 'bg-info',
//                         aplicacionActual: 'Módulo de Paquetes',
//                         tiempoConexion: '42m',
//                         dispositivo: 'Desktop (Edge)'
//                     }
//                 ];

//                 this.cdr.detectChanges();
//             },
//             error: (err) => console.error('Error al cargar usuarios conectados:', err)
//         });
//     }

//     ngOnDestroy() {
//         if (this.socketSub) this.socketSub.unsubscribe();
//     }
// }
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-usuarios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-usuarios.component.html'
})
export class WdgUsuariosComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = 'WDG_PLAT_USUARIOS_CONECTADOS';

    public totalConectados: number = 0;
    public usuariosConectados: Array<any> = [];
    private sub!: Subscription;

    constructor(
        private _socketManager: SocketManagerService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // 🟢 Nos suscribimos al canal centralizado del manager
        this.sub = this._socketManager.sesionesActualizadas$.subscribe((res: any) => {
            if (res && res.sesiones) {
                this.totalConectados = res.total;

                this.usuariosConectados = res.sesiones.map((s: any) => ({
                    nombre: s.nombreUsuario,
                    rol: s.rol || 'Suscriptor',
                    identificacion: s.codigoUsuario,
                    correo: s.correo || 'N/A',
                    iniciales: this.calcularIniciales(s.nombreUsuario),
                    colorAvatar: s.rol === 'Administrador' ? 'bg-primary' : 'bg-info',
                    aplicacionActual: s.aplicacionActual || 'Dashboard Principal',
                    tiempoConexion: this.calcularTiempoTranscurrido(s.fechaLogin),
                    dispositivo: s.dispositivo || 'Desktop'
                }));

                this.cdr.detectChanges();
            }
        });
    }

    private calcularIniciales(nombre: string): string {
        if (!nombre) return 'QP';
        const partes = nombre.trim().split(' ');
        if (partes.length >= 2) {
            return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
        }
        return nombre.substring(0, 2).toUpperCase();
    }

    private calcularTiempoTranscurrido(fechaLogin: string): string {
        if (!fechaLogin) return '0m';
        const diffMs = new Date().getTime() - new Date(fechaLogin).getTime();
        const minutosTotales = Math.floor(diffMs / (1000 * 60));

        const horas = Math.floor(minutosTotales / 60);
        const minutos = minutosTotales % 60;

        if (horas === 0) {
            return `${minutos}m`;
        }
        return `${horas}h ${minutos}m`;
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
}
