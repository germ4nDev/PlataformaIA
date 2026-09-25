import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { PtlSesionesService } from 'src/app/theme/shared/service/ptlsesiones.service';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service'; // 🟢 Agregado para el enfoque

@Component({
    selector: 'app-wdg-usuarios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-usuarios.component.html',
    styleUrls: ['./wdg-usuarios.component.scss'] // 🟢 Asegurado el enlace a los estilos
})
export class WdgUsuariosComponent implements OnInit, OnDestroy {

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa y el estado de enfoque
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public totalConectados: number = 0;
    public usuariosConectados: Array<any> = [];
    private sub!: Subscription;

    constructor(
        private _socketManager: SocketManagerService,
        private _sesionesService: PtlSesionesService,
        private _dashboardService: DashboardPlataformaService, // 🟢 Inyectado
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarEstadoInicial();

        this.sub = this._socketManager.sesionesActualizadas$.subscribe((res: any) => {
            if (res && res.sesiones) {
                this.mapearDatos(res.total, res.sesiones);
            }
        });
    }

    private cargarEstadoInicial() {
        this._sesionesService.getSesionesActivas().subscribe({
            next: (res: any) => {
                const sesiones = res.data || res.sesiones || res;
                this.mapearDatos(sesiones.length, sesiones);
            },
            error: (err) => console.warn('No se pudo cargar la lista inicial de usuarios', err)
        });
    }

    private mapearDatos(total: number, sesionesBD: any[]) {
        this.totalConectados = total;

        this.usuariosConectados = sesionesBD.map((s: any) => ({
            nombre: s.nombreUsuario,
            rol: s.rol || 'Suscriptor',
            identificacion: s.codigoUsuario,
            correo: s.correo || 'N/A',
            iniciales: this.calcularIniciales(s.nombreUsuario),
            colorAvatar: s.rol === 'Administrador' ? 'bg-primary' : 'bg-info',
            aplicacionActual: s.aplicacionActual || s.codigoModulo || 'Dashboard Principal',
            tiempoConexion: this.calcularTiempoTranscurrido(s.fechaLogin),
            dispositivo: s.dispositivo || 'Desktop'
        }));

        this.cdr.detectChanges();
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

    // 🟢 Función para comunicar el enfoque
    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PLAT_USUARIOS_CONECTADOS',
                { conectados: this.usuariosConectados, total: this.totalConectados }
            );
        }
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
}
