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
    @Output() guardar = new EventEmitter<string[]>();
    @Output() toggleWidget = new EventEmitter<{ codigoWidget: string, seleccionado: boolean }>();

    public widgetsAgrupados: { [key: string]: any[] } = {};
    public categorias: string[] = [];

    // 🟢 NUEVO: Controla cuál es la categoría seleccionada actualmente en el menú superior
    public tabActiva: string = '';

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
                // 1. Normalizar los códigos del widget maestro para abarcar ambas propiedades
                const codigoMaestro = widget.codigoWidget || widget.codigo_widget;

                // 2. Búsqueda robusta en el layout actual (que ahora viene de this.dashboard)
                const item = (this.layoutActual || []).find(l => {
                    // Validar contra 'type' y 'codigoWidget', que son las propiedades usadas en el dashboard
                    const codigoDashboard = l.type || l.codigoWidget;
                    return codigoDashboard === codigoMaestro;
                });

                // 3. Determinar si está activo (basta con que exista en el layoutActual)
                // Ya no necesitamos validar 'visible', porque si está en el layoutActual (dashboard), está activo.
                const activo = item ? true : false;

                const imgPath = this.isDarkMode ? widget.imagenWidget_dark : widget.imagenWidget_light;
                const imgFinal = this._uploadService.getFilePath(this.suscriptor, 'widgets', imgPath);

                return {
                    ...widget,
                    codigoWidget: codigoMaestro,
                    nombreWidget: widget.nombreWidget || widget.nombre,
                    descripcionWidget: widget.descripcionWidget || widget.descripcion,
                    imagenWidget: imgFinal,
                    activo: activo // Asignar el estado corregido
                };
            });

            this.generarAgrupacion();

        } catch (error) {
            console.error('❌ ERROR al procesar widgets en el Lobby:', error);
        }
    }

    private generarAgrupacion() {
        const agrupador: { [key: string]: any[] } = {};

        (this.widgetsProcesados || []).forEach(widget => {
            const nombreCategoria = widget.nombreTipo || widget.codigoTipo || 'Métricas';
            const categoriaLimpia = String(nombreCategoria).toUpperCase().trim();

            if (!agrupador[categoriaLimpia]) {
                agrupador[categoriaLimpia] = [];
            }
            agrupador[categoriaLimpia].push(widget);
        });

        this.widgetsAgrupados = agrupador;
        this.categorias = Object.keys(agrupador);

        // 🟢 NUEVO: Selecciona automáticamente la primera pestaña si no hay ninguna activa
        if (this.categorias.length > 0 && !this.categorias.includes(this.tabActiva)) {
            this.tabActiva = this.categorias[0];
        }

        console.log('📂 Categorías exactas desde BD generadas en Lobby:', this.categorias);
    }

    // 🟢 NUEVO: Este getter alimenta directamente el <div *ngFor> de la cuadrícula en el HTML
    get widgetsFiltrados(): any[] {
        return this.widgetsAgrupados[this.tabActiva] || [];
    }

    // 🟢 NUEVO: Método para cambiar de pestaña al hacer clic
    cambiarTab(categoria: string) {
        this.tabActiva = categoria;
    }

    // 🟢 MODIFICADO: Para poder hacer clic en toda la tarjeta (div), no solo en el checkbox
    toggleWidgetCard(widget: any) {
        if (event) {
            event.stopPropagation();
        }
        const nuevoEstado = !widget.activo;
        widget.activo = nuevoEstado;
        this.toggleWidget.emit({ codigoWidget: widget.codigoWidget, seleccionado: nuevoEstado });
    }

    // Mantenemos este por retrocompatibilidad por si usas el <input type="checkbox"> directo
    onCheckboxChange(codigoWidget: string, event: any) {
        const seleccionado = event.target.checked;
        const target = this.widgetsProcesados.find(w => w.codigoWidget === codigoWidget);
        if (target) {
            target.activo = seleccionado;
        }
        this.actualizarLayoutUsuario(this.widgetsProcesados);
        this.toggleWidget.emit({
            codigoWidget: codigoWidget,
            seleccionado: seleccionado
        });
    }

    get todosEstanSeleccionados(): boolean {
        if (!this.widgetsProcesados || this.widgetsProcesados.length === 0) return false;
        return this.widgetsProcesados.every(w => w.activo);
    }

    toggleSeleccionarTodos() {
        if (event) {
            event.stopPropagation();
        }
        const marcarComoActivo = !this.todosEstanSeleccionados;
        this.widgetsProcesados.forEach(widget => {
            if (widget.activo !== marcarComoActivo) {
                this.toggleWidget.emit({
                    codigoWidget: widget.codigoWidget,
                    seleccionado: marcarComoActivo
                });
            }
        });
        this.actualizarLayoutUsuario(this.widgetsProcesados);
    }

    actualizarLayoutUsuario(widgetsProcesados: any[]) {
        const activos = widgetsProcesados.filter(x => x.activo == true);
        const navSetrtings = this._localStorageService.getNavSettingsLocalStorage();
        const pestana = navSetrtings.pestanas?.find(x => x.codigoPestana == this.pestanaActual);
        pestana.widgets = activos;
        console.log('widgets actrivos lobby', activos);
        this.guardar.emit(activos);
        this._localStorageService.setNavSettingsLocalStorage(navSetrtings);
    }

    cerrarModal() {
        console.log('🔴 Cerrando modal...');
        this.cerrar.emit();
    }
}
