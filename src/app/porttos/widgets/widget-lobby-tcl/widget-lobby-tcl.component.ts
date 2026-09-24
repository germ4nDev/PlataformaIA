import { Component, EventEmitter, Input, Output, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalStorageService, UploadFilesService } from 'src/app/theme/shared/service';

@Component({
    selector: 'app-widget-lobby-tcl',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-lobby-tcl.component.html',
    styleUrls: ['./widget-lobby-tcl.component.scss']
})
export class WidgetLobbyTclComponent implements OnInit {
    @Input() visible: boolean = false;
    @Input() widgetsMaster: any[] = [];
    @Input() layoutActual: any[] = [];
    @Input() pestanaActual: string = '';

    @Output() cerrar = new EventEmitter<void>();
    @Output() toggleWidget = new EventEmitter<{ codigoWidget: string, seleccionado: boolean }>();

    public widgetsAgrupados: { [key: string]: any[] } = {};
    public categorias: string[] = [];

    public widgetsProcesados: Array<any> = [];
    suscriptor: string = '';

    constructor(
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService,
        private cdr: ChangeDetectorRef
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    get isDarkMode(): boolean {
        const mode = this._localStorageService.getThemeSettings();
        return mode?.isDarkTheme ?? false;
    }

    // get widgetsAgrupados(): { [key: string]: any[] } {
    //     if (!this.widgetsProcesados) return {};

    //     return this.widgetsProcesados.reduce((acc, widget) => {
    //         const categoria = widget.tipo || widget.categoria || widget.modulo || 'Métricas y Gráficos';

    //         const categoriaLimpia = String(categoria).toUpperCase().trim();

    //         if (!acc[categoriaLimpia]) {
    //             acc[categoriaLimpia] = [];
    //         }
    //         acc[categoriaLimpia].push(widget);
    //         return acc;
    //     }, {} as { [key: string]: any[] });
    // }

    // get categorias(): string[] {
    //     return Object.keys(this.widgetsAgrupados);
    // }

    ngOnInit() {
        if (this.visible) {
            this.procesarWidgets();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.visible) {
            this.procesarWidgets();
            this.cdr.detectChanges();
        }
    }

    procesarWidgets() {
        try {
            const masterFiltrado = this.widgetsMaster || [];

            this.widgetsProcesados = masterFiltrado.map(widget => {
                const item = (this.layoutActual || []).find(
                    l => (l.type === widget.codigoWidget || l.codigoWidget === widget.codigoWidget)
                );
                const activo = item ? (item.visible === true || item.visible === 'true' || item.visible === 1) : false;

                const imgPath = this.isDarkMode ?
                    (widget.imagenWidget_dark || widget.imagenWidgetDark) :
                    (widget.imagenWidget_light || widget.imagenWidgetLight);

                const imgFinal = imgPath ? this._uploadService.getFilePath(this.suscriptor, 'widgets', imgPath) : '';

                return {
                    ...widget,
                    codigoWidget: widget.codigoWidget || widget.codigo_widget,
                    nombreWidget: widget.nombreWidget || widget.nombre,
                    descripcionWidget: widget.descripcionWidget || widget.descripcion,
                    imagenWidget: imgFinal,
                    activo: activo
                };
            });

            // 🟢 NUEVO: Llamamos al agrupador inmediatamente después de procesar los widgets
            this.generarAgrupacion();

        } catch (error) {
            console.error('❌ ERROR al procesar widgets en el Lobby:', error);
        }
    }

    // 🟢 Método seguro para estructurar las categorías
    private generarAgrupacion() {
        const agrupador: { [key: string]: any[] } = {};

        (this.widgetsProcesados || []).forEach(widget => {
            // 🟢 Usamos directamente la columna estructurada que nos manda tu nuevo controlador
            // Si por algún motivo viene vacía, le ponemos 'Métricas' de respaldo.
            const nombreCategoria = widget.nombreTipo || widget.codigoTipo || 'Métricas';
            const categoriaLimpia = String(nombreCategoria).toUpperCase().trim();

            if (!agrupador[categoriaLimpia]) {
                agrupador[categoriaLimpia] = [];
            }
            agrupador[categoriaLimpia].push(widget);
        });

        this.widgetsAgrupados = agrupador;
        this.categorias = Object.keys(agrupador);

        console.log('📂 Categorías exactas desde BD generadas en Lobby:', this.categorias);
    }

    onCheckboxChange(codigoWidget: string, event: any) {
        const seleccionado = event.target.checked;

        const target = this.widgetsProcesados.find(w => w.codigoWidget === codigoWidget);
        if (target) {
            target.activo = seleccionado;
        }

        this.toggleWidget.emit({ codigoWidget, seleccionado });
    }

    get todosEstanSeleccionados(): boolean {
        if (!this.widgetsProcesados || this.widgetsProcesados.length === 0) return false;
        return this.widgetsProcesados.every(w => w.activo);
    }

    // 🟢 Método maestro para alternar el estado de todos de golpe
    toggleSeleccionarTodos() {
        const marcarComoActivo = !this.todosEstanSeleccionados;

        // Recorremos todos los widgets de la pestaña actual y emitimos el cambio uno por uno
        this.widgetsProcesados.forEach(widget => {
            if (widget.activo !== marcarComoActivo) {
                this.toggleWidget.emit({
                    codigoWidget: widget.codigoWidget,
                    seleccionado: marcarComoActivo
                });
            }
        });
    }

    cerrarModal() {
        console.log('🔴 Cerrando modal...'); // 👈 Agrega esta línea
        this.cerrar.emit();
    }
}
