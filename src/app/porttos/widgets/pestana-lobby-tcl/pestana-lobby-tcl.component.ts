import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// 🟢 1. Importamos el CDK de Drag & Drop
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LocalStorageService } from 'src/app/theme/shared/service';

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
    @Input() pestanasActivas: any[] = [];
    @Output() seleccionCambiada = new EventEmitter<any[]>();
    @Output() cerrar = new EventEmitter<void>();
    @Output() guardar = new EventEmitter<string[]>(); // Se emite en vivo

    public pestanasProcesadas: any[] = [];
    public todosEstanSeleccionados: boolean = false;
    pestanasSeleccionadas: any[] = [];
    constructor(private _localStorage: LocalStorageService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.inicializarPestanas();
        }
    }

    private inicializarPestanas() {
        this.pestanasProcesadas = this.catalogoPestanas.map(p => ({
            ...p,
            activo: this.pestanasActivas.find(x => x.codigoPestana == p.codigoPestana) ? true : false
        }));

        this.pestanasProcesadas.sort((a, b) => {
            const indexA = this.pestanasActivas.indexOf(a.codigoPestana);
            const indexB = this.pestanasActivas.indexOf(b.codigoPestana);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });

        this.verificarSeleccionTodos();
    }

    onDrop(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.pestanasProcesadas, event.previousIndex, event.currentIndex);
        this.emitirCambios();
    }

    togglePestana(codigoPestana: string) {
        if (event) {
            event.stopPropagation();
        }
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
        const codigosSeleccionados = this.pestanasProcesadas
            .filter(p => p.activo)
            .map(p => p);
        const navSettings = this._localStorage.getNavSettingsLocalStorage();
        navSettings.pestanas = codigosSeleccionados;
        this._localStorage.setNavSettingsLocalStorage(navSettings);
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

    onCheckboxToggle(pestana: any, isChecked: boolean) {
        if (isChecked) {
            this.pestanasSeleccionadas.push(pestana.codigoPestana);
        } else {
            this.pestanasSeleccionadas = this.pestanasSeleccionadas.filter(cod => cod !== pestana.codigoPestana);
        }

        // 🚨 3. EL LLAMADO AL PADRE: Disparamos el evento al instante con el arreglo actualizado
        this.guardar.emit(this.pestanasSeleccionadas);
    }
}
