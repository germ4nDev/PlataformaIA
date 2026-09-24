import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pestana-lobby-tcl',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pestana-lobby-tcl.component.html',
    styleUrls: ['./pestana-lobby-tcl.component.scss']
})
export class PestanaLobbyTclComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Input() catalogoPestanas: any[] = [];
    @Input() pestanasActivas: string[] = [];

    @Output() cerrar = new EventEmitter<void>();
    @Output() guardar = new EventEmitter<string[]>(); // 👈 Se emite en vivo ahora

    public pestanasProcesadas: any[] = [];
    public todosEstanSeleccionados: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.inicializarPestanas();
        }
    }

    private inicializarPestanas() {
        this.pestanasProcesadas = this.catalogoPestanas.map(p => ({
            ...p,
            activo: this.pestanasActivas.includes(p.codigoPestana)
        }));
        this.verificarSeleccionTodos();
    }

    // Método para cuando hacen clic en toda la tarjeta
    togglePestana(codigoPestana: string) {
        const pestana = this.pestanasProcesadas.find(p => p.codigoPestana === codigoPestana);
        if (pestana) {
            pestana.activo = !pestana.activo;
            this.procesarCambio();
        }
    }

    // Método para cuando hacen clic directamente en el checkbox
    onCheckboxChange(codigoPestana: string, event: any) {
        const checked = event.target.checked;
        const pestana = this.pestanasProcesadas.find(p => p.codigoPestana === codigoPestana);
        if (pestana) {
            pestana.activo = checked;
            this.procesarCambio();
        }
    }

    toggleSeleccionarTodos() {
        this.todosEstanSeleccionados = !this.todosEstanSeleccionados;
        this.pestanasProcesadas.forEach(p => p.activo = this.todosEstanSeleccionados);
        this.emitirCambios(); // Emite de inmediato
    }

    private procesarCambio() {
        this.verificarSeleccionTodos();
        this.emitirCambios(); // Dispara la actualización en vivo
    }

    private emitirCambios() {
        const codigosSeleccionados = this.pestanasProcesadas
            .filter(p => p.activo)
            .map(p => p.codigoPestana);

        this.guardar.emit(codigosSeleccionados);
    }

    private verificarSeleccionTodos() {
        this.todosEstanSeleccionados = this.pestanasProcesadas.every(p => p.activo);
    }

    cerrarModal() {
        this.cerrar.emit();
    }

    obtenerIconoPestana(codigoPestana: string): string {
        const diccionarioIconos: { [key: string]: string } = {
            'TLC_MARITIMO_001': 'fas fa-ship text-info',
            'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',
            'TLC_CONTENEDORES_001': 'fas fa-box text-success',
            'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',
            'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary'
        };
        return diccionarioIconos[codigoPestana] || 'fas fa-th-large text-secondary';
    }
}
