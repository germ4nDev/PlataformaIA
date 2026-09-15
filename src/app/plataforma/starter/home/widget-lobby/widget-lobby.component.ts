import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalStorageService, UploadFilesService } from 'src/app/theme/shared/service';

@Component({
    selector: 'app-widget-lobby',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-lobby.component.html',
    styleUrls: ['./widget-lobby.component.scss']
})
export class WidgetLobbyComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Input() widgetsMaster: any[] = [];
    @Input() layoutActual: any[] = [];
    @Input() pestanaActual: string = '';

    @Output() cerrar = new EventEmitter<void>();
    @Output() toggleWidget = new EventEmitter<{ codigoWidget: string, seleccionado: boolean }>();

    public widgetsProcesados: Array<any> = [];
    suscriptor: string = '';

    constructor(
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
    }

    get isDarkMode(): boolean {
        const mode = this._localStorageService.getThemeSettings();
        return mode.isDarkTheme;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.visible) {
            this.procesarWidgets();
        }
    }

    procesarWidgets() {
        const filtrados = (this.widgetsMaster || []).filter(w => w.pestana === this.pestanaActual && w.estadoWidget == true);

        this.widgetsProcesados = filtrados.map(widget => {
            const item = this.layoutActual.find(
                l => (l.type === widget.codigoWidget || l.codigoWidget === widget.codigoWidget) && l.pestana === this.pestanaActual
            );
            const activo = item ? (item.visible === true || item.visible === 'true' || item.visible === 1) : false;

            widget.imagenWidget = this.isDarkMode ?
                this._uploadService.getFilePath(this.suscriptor, 'widgets', widget.imagenWidget_dark) :
                this._uploadService.getFilePath(this.suscriptor, 'widgets', widget.imagenWidget_light);

            return {
                ...widget,
                activo: activo
            };
        });
    }

    onCheckboxChange(codigoWidget: string, event: any) {
        const seleccionado = event.target.checked;

        const target = this.widgetsProcesados.find(w => w.codigoWidget === codigoWidget);
        if (target) {
            target.activo = seleccionado;
        }

        this.toggleWidget.emit({ codigoWidget, seleccionado });
    }

    cerrarModal() {
        this.cerrar.emit();
    }
}
