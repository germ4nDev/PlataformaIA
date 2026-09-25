import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// 🟢 1. Importamos el CDK de Drag & Drop
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-pestana-lobby-tcl',
    standalone: true,
    // 🟢 2. Lo añadimos a los imports
    imports: [CommonModule, DragDropModule],
    templateUrl: './pestana-lobby-tcl.component.html',
    styleUrls: ['./pestana-lobby-tcl.component.scss']
})
export class PestanaLobbyTclComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Input() catalogoPestanas: any[] = [];
    @Input() pestanasActivas: string[] = [];

    @Output() cerrar = new EventEmitter<void>();
    @Output() guardar = new EventEmitter<string[]>(); // Se emite en vivo

    public pestanasProcesadas: any[] = [];
    public todosEstanSeleccionados: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.inicializarPestanas();
        }
    }

    private inicializarPestanas() {
        // Mapeamos para agregar el estado 'activo'
        this.pestanasProcesadas = this.catalogoPestanas.map(p => ({
            ...p,
            activo: this.pestanasActivas.includes(p.codigoPestana)
        }));

        // 🟢 ORDENAMIENTO INTELIGENTE: Ordenamos las tarjetas visuales basándonos
        // en el orden real en el que el usuario las arrastró previamente (pestanasActivas).
        this.pestanasProcesadas.sort((a, b) => {
            const indexA = this.pestanasActivas.indexOf(a.codigoPestana);
            const indexB = this.pestanasActivas.indexOf(b.codigoPestana);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Ambas activas (ordenamos por su índice)
            if (indexA !== -1) return -1; // 'a' está activa, va arriba
            if (indexB !== -1) return 1;  // 'b' está activa, va arriba
            return 0; // Ninguna está activa, mantienen su orden natural
        });

        this.verificarSeleccionTodos();
    }

    // 🟢 NUEVO: Método que se dispara al soltar la tarjeta
    onDrop(event: CdkDragDrop<any[]>) {
        // Reordena el arreglo visual
        moveItemInArray(this.pestanasProcesadas, event.previousIndex, event.currentIndex);
        // Como el orden cambió, emitimos el nuevo arreglo en vivo
        this.emitirCambios();
    }

    togglePestana(codigoPestana: string) {
        const pestana = this.pestanasProcesadas.find(p => p.codigoPestana === codigoPestana);
        if (pestana) {
            pestana.activo = !pestana.activo;
            this.procesarCambio();
        }
    }

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
        // 🟢 Al usar filter y map sobre pestanasProcesadas, automáticamente estamos
        // emitiendo los códigos EN EL ORDEN exacto en el que quedaron tras el Drag & Drop
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
