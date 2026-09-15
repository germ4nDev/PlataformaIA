import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WidgetShellComponent } from '../widget-shell/widget-shell.component';

// 🟢 1. Importa tus servicios de datos
// import { DashboardPlataformaService } from '...';

// 🟢 2. Importa el contenedor maestro universal

@Component({
    selector: 'app-wdg-base', // Cambiar por tu selector real (ej. app-wdg-ventas)
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-base.component.html',
    styleUrl: './wdg-base.component.scss' // 💡 TIP: Borra esta línea si no vas a usar SCSS personalizado
})
export class WdgBaseComponent implements OnInit, OnDestroy {

    // ==============================================
    // ⚙️ INPUTS ESTÁNDAR DEL DASHBOARD
    // ==============================================
    @Input() data: any;
    @Input() widgetId: string = 'WDG_PLAT_NUEVO'; // Cambiar por el código real de SQL

    // ==============================================
    // 📊 VARIABLES DE ESTADO Y DATOS
    // ==============================================
    public isLoading: boolean = true;
    public myData: any = null; // Reemplazar con el modelo real (arreglo, total, etc.)
    private dataSub!: Subscription;

    constructor(
        // private _dashboardService: DashboardPlataformaService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.isLoading = true; // Activa el skeleton

        // 🟢 3. Reemplaza este bloque con tu llamado real a la API o Socket
        /*
        this.dataSub = this._dashboardService.getTusDatos().subscribe({
            next: (res: any) => {
                this.myData = res;
                this.isLoading = false; // Apaga el skeleton
                this.cdr.detectChanges(); // Fuerza la actualización visual
            },
            error: (err) => {
                console.error('Error en WdgBase:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
        */

        // Simulación temporal de carga para ver el skeleton al crear el componente
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 1500);
    }

    ngOnDestroy(): void {
        // 🟢 4. Limpieza de memoria vital
        if (this.dataSub) this.dataSub.unsubscribe();
    }
}
