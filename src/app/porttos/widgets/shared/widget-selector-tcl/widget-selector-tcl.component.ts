import { Component, Input, Output, EventEmitter, Type, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { WidgetHeaderComponent } from 'src/app/theme/shared/components/widget-header/widget-header.component';
import { WIDGET_MAP } from '../../../torre-control/widget-registry';

@Component({
    selector: 'app-widget-selector-tcl',
    standalone: true,
    imports: [
        CommonModule,
        WidgetShellComponent,
        WidgetHeaderComponent
    ],
    templateUrl: './widget-selector-tcl.component.html',
    styleUrls: ['./widget-selector-tcl.component.scss']
})
export class WidgetSelectorTclComponent implements OnChanges {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() datosVivos: any; // 🟢 La compuerta abierta

    @Output() toggleEnfoque = new EventEmitter<void>();

    public mostrarTablaTerminal: boolean = false;

    // 🟢 Propiedades estáticas para evitar el bucle infinito
    public componenteDinamico: Type<unknown> | null = null;
    public componenteInputs: any = {};

    ngOnChanges(changes: SimpleChanges) {
        // 1. Solo resolvemos el componente si la configuración cambia
        if (changes['widgetConfig']) {
            this.resolverComponente();
        }

        // 2. Solo armamos los inputs cuando llega nueva data (Cortocircuitos)
        if (changes['widgetConfig'] || changes['datosVivos'] || changes['isEnfoque']) {
            this.actualizarInputs();
        }
    }

    private resolverComponente() {
        if (!this.widgetConfig || !this.widgetConfig.type) {
            this.componenteDinamico = null;
            return;
        }

        const tipo = this.widgetConfig.type.startsWith('WDG_DINAMICO_TERM')
            ? 'WDG_PORT_TERMINAL_INDIVIDUAL'
            : this.widgetConfig.type;

        const registro = WIDGET_MAP[tipo];
        this.componenteDinamico = registro ? registro.componente : null;
    }

    private actualizarInputs() {
        // 🟢 Creamos el objeto UNA sola vez en memoria por cada cambio real
        this.componenteInputs = {
            widgetConfig: this.widgetConfig,
            isEnfoque: this.isEnfoque,
            mostrarTabla: this.mostrarTablaTerminal,
            datosVivos: this.datosVivos
        };
    }

    get metaWidget() {
        return {
            titulo: this.widgetConfig?.nombreWidget || this.widgetConfig?.titulo || this.widgetConfig?.type,
            icono: this.widgetConfig?.icono || 'feather icon-grid'
        };
    }

    toggleTablaTerminal() {
        this.mostrarTablaTerminal = !this.mostrarTablaTerminal;
        this.actualizarInputs(); // Actualizamos la referencia para que el Outlet se entere
    }

    accionEnfoque() {
        this.toggleEnfoque.emit();
    }
}
