/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Componente de presentación: tabla de los widgets de pestaña. Columnas declarativas (texto, número, estado con
    color, barra de avance, fecha, hora, lista) y encabezado fijo; colores del tema (claro/oscuro).
    Con [ampliada]="true" (vista ampliada) suma búsqueda, orden por columna, paginación y exportación a CSV.
*/
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { exportarCsv } from '../exportar-csv';

export interface ColumnaTabla {
    campo: string;
    titulo: string;
    tipo?: 'texto' | 'principal' | 'numero' | 'estado' | 'avance' | 'fecha' | 'hora' | 'lista' | 'si-no';
    decimales?: number;
    unidad?: string;
    alinear?: 'izq' | 'der' | 'centro';
    ancho?: string;
}

/** Tono del estado (colores de toastr) según palabras clave. */
export function tonoEstado(estado: string | null | undefined): 'info' | 'exito' | 'atencion' | 'peligro' | 'neutro' {
    const e = String(estado || '').toUpperCase();
    if (/SUSPEND|MANTEN|CR[IÍ]TIC|CERRAD|RESTRING|ROJO|FALL|RECHAZ|RETEN/.test(e)) return 'peligro';
    if (/FONDE|PROGRAM|ESPERA|ATENCI|EN_RUTA|EN RUTA|PRECAUC|AMARILLO/.test(e)) return 'atencion';
    if (/OPERAND|DESCARG|CARGUE|CARGANDO/.test(e)) return 'info';
    if (/TERMIN|DESPACH|LIBRE|PATIO|NORMAL|HABILIT|VERDE|APROBAD|VALIDAD/.test(e)) return 'exito';
    return 'neutro';
}

@Component({
    selector: 'app-tabla-tcl',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './tabla-tcl.component.html',
    styleUrls: ['./tabla-tcl.component.scss']
})
export class TablaTclComponent implements OnChanges {
    @Input() columnas: ColumnaTabla[] = [];
    @Input() filas: any[] = [];
    @Input() campoId = 'id';
    /** Vista ampliada: búsqueda, orden, paginación y CSV. */
    @Input() ampliada = false;
    /** Columnas extra que solo se muestran en la vista ampliada (detalle completo). */
    @Input() columnasAmpliadas: ColumnaTabla[] = [];
    @Input() nombreArchivo = 'detalle';
    @Input() tamanoPagina = 25;
    /** Si alguien escucha, las filas se pueden pulsar (p. ej. volar a la posición en el mapa). */
    @Output() filaClick = new EventEmitter<any>();
    /** Permite apagar el clic (p. ej. solo en la vista ampliada). */
    @Input() seleccionable = true;
    /** Id de la fila resaltada (la elegida). */
    @Input() idSeleccionado: any = null;

    busqueda = '';
    orden: { campo: string; dir: 1 | -1 } | null = null;
    pagina = 0;

    ngOnChanges(): void {
        if (this.pagina * this.tamanoPagina >= this.filtradas.length) this.pagina = 0;
    }

    get columnasVista(): ColumnaTabla[] {
        return this.ampliada && this.columnasAmpliadas.length ? [...this.columnas, ...this.columnasAmpliadas] : this.columnas;
    }

    /** Filas buscadas y ordenadas (sin paginar). */
    get filtradas(): any[] {
        let lista = this.filas || [];
        if (!this.ampliada) return lista;
        const q = this.normalizar(this.busqueda);
        if (q) {
            const cols = this.columnasVista;
            lista = lista.filter((f) => cols.some((c) => this.normalizar(Array.isArray(f?.[c.campo]) ? f[c.campo].join(' ') : f?.[c.campo]).includes(q)));
        }
        if (this.orden) {
            const { campo, dir } = this.orden;
            lista = [...lista].sort((a, b) => this.comparar(a?.[campo], b?.[campo]) * dir);
        }
        return lista;
    }

    get vista(): any[] {
        const lista = this.filtradas;
        if (!this.ampliada || lista.length <= this.tamanoPagina) return lista;
        return lista.slice(this.pagina * this.tamanoPagina, (this.pagina + 1) * this.tamanoPagina);
    }

    get paginas(): number {
        return Math.max(1, Math.ceil(this.filtradas.length / this.tamanoPagina));
    }

    buscar(texto: string): void {
        this.busqueda = texto;
        this.pagina = 0;
    }

    ordenarPor(c: ColumnaTabla): void {
        if (!this.ampliada) return;
        this.orden = this.orden?.campo !== c.campo ? { campo: c.campo, dir: 1 } : this.orden.dir === 1 ? { campo: c.campo, dir: -1 } : null;
        this.pagina = 0;
    }

    irA(p: number): void {
        this.pagina = Math.min(Math.max(0, p), this.paginas - 1);
    }

    exportar(): void {
        exportarCsv(this.nombreArchivo, this.columnasVista, this.filtradas);
    }

    private normalizar(v: any): string {
        return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    private comparar(a: any, b: any): number {
        const vacioA = a === null || a === undefined || a === '';
        const vacioB = b === null || b === undefined || b === '';
        if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1;
        const na = Number(a), nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        const fa = Date.parse(a), fb = Date.parse(b);
        if (typeof a === 'string' && /\d{4}-\d{2}-\d{2}/.test(a) && Number.isFinite(fa) && Number.isFinite(fb)) return fa - fb;
        return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
    }

    tono = tonoEstado;

    texto(valor: any): string {
        return valor === null || valor === undefined || valor === '' ? '—' : String(valor);
    }

    estadoTexto(valor: any): string {
        const t = String(valor || '').replace(/_/g, ' ').toLowerCase();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—';
    }

    formato(c: ColumnaTabla): string {
        const d = c.decimales ?? 0;
        return `1.${d}-${d}`;
    }

    porId = (i: number, f: any): any => f?.[this.campoId] ?? i;
}
