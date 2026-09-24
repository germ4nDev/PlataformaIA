import { Component, Input, Output, EventEmitter, Type } from '@angular/core';
import { CommonModule } from '@angular/common';

// 1. Importas tu Shell y Header maestros
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { WidgetHeaderComponent } from 'src/app/theme/shared/components/widget-header/widget-header.component';

// 2. Importas tu diccionario existente (Ajusta la ruta real de tu archivo)
import { WIDGET_MAP } from '../../../porttos/torre-control/widget-registry';

@Component({
    selector: 'app-widget-selector-tcl',
    standalone: true,
    imports: [
        CommonModule,
        WidgetShellComponent,
        WidgetHeaderComponent
        // CERO importaciones de gráficas individuales aquí. Angular las inyectará en memoria.
    ],
    templateUrl: './widget-selector-tcl.component.html',
    styleUrls: ['./widget-selector-tcl.component.scss']
})
export class WidgetSelectorTclComponent {

    // Objeto completo del widget que viene del tablero
    @Input() widgetConfig: any;

    // Bandera para saber si estamos en la vista de modal/enfoque
    @Input() isEnfoque: boolean = false;

    @Output() toggleEnfoque = new EventEmitter<void>();

    // 🟢 MAGIA: Busca en tu WIDGET_MAP y devuelve la clase del componente
    get componenteDinamico(): Type<unknown> | null {
        if (!this.widgetConfig || !this.widgetConfig.type) return null;

        // Mantienes la regla para las terminales dinámicas
        const tipo = this.widgetConfig.type.startsWith('WDG_DINAMICO_TERM')
            ? 'WDG_PORT_TERMINAL_INDIVIDUAL'
            : this.widgetConfig.type;

        const registro = WIDGET_MAP[tipo];
        return registro ? registro.componente : null;
    }

    // Metadatos para el header (Si tu BD ya manda titulo e icono, úsalos directamente)
    get metaWidget() {
        return {
            titulo: this.widgetConfig?.nombreWidget || this.widgetConfig?.titulo || this.widgetConfig?.type,
            icono: this.widgetConfig?.icono || 'feather icon-grid'
        };
    }

    accionEnfoque() {
        this.toggleEnfoque.emit();
    }
}
