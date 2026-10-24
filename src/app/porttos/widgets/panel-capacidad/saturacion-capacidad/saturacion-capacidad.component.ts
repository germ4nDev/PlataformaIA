/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_CAP_CHRT_SATURACION · 📊 Saturación por categoría
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets y PorttosChartHelper.
*/
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroCapacidad } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';

@Component({
    selector: 'app-saturacion-capacidad',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent, TablaTclComponent],
    templateUrl: './saturacion-capacidad.component.html',
    styleUrls: ['./saturacion-capacidad.component.scss']
})
export class SaturacionCapacidadComponent extends WidgetTableroBase<TableroCapacidad> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'capacidad';
    readonly tituloDefecto = '📊 Saturación por categoría';
    override readonly subtituloDefecto = 'Ocupación promedio de cada tipo de nodo';
    override readonly iconoDefecto = 'feather icon-bar-chart-2';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin nodos con ocupación reportada.';
    private readonly color = (v: number) => (v >= 85 ? '#bd362f' : v >= 70 ? '#f89406' : '#51a351');

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    // Vista ampliada (2026-10-24): por categoría, promedio simple frente a ponderado por capacidad y cobertura
    public readonly columnasCategorias: ColumnaTabla[] = [
        { campo: 'nombre', titulo: 'Categoría', tipo: 'principal' },
        { campo: 'nodos', titulo: 'Nodos', tipo: 'numero' },
        { campo: 'conDato', titulo: 'Con dato', tipo: 'numero' },
        { campo: 'promedio', titulo: 'Promedio simple', tipo: 'numero', decimales: 1, unidad: '%' },
        { campo: 'ponderado', titulo: 'Ponderado por capacidad', tipo: 'numero', decimales: 1, unidad: '%' },
        { campo: 'criticos', titulo: 'Críticos', tipo: 'numero' }
    ];
    public readonly columnasNodos: ColumnaTabla[] = [
        { campo: 'nombre', titulo: 'Nodo', tipo: 'principal' },
        { campo: 'operador', titulo: 'Operador' },
        { campo: 'capacidadTexto', titulo: 'Capacidad' },
        { campo: 'ocupacionPct', titulo: 'Ocupación', tipo: 'numero', decimales: 1, unidad: '%' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
        { campo: 'fechaDato', titulo: 'Dato de', tipo: 'fecha' }
    ];
    public filasCategorias: any[] = [];
    public categoriaElegida: string | null = null;
    public nodosCategoria: any[] = [];
    public cobertura: { conDato: number; total: number } | null = null;
    private todosNodos: any[] = [];

    protected alRecibir(d: TableroCapacidad | null): void {
        const valores = d?.saturacion.valores || [];
        this.labels = d?.saturacion.labels || [];
        this.series = [{ label: 'Ocupación promedio', data: valores, color: valores.map(this.color) }];
        this.todosNodos = d?.nodos || [];
        this.cobertura = d?.cobertura || null;
        this.filasCategorias = (d?.categorias || []).map((c) => {
            const nodos = this.todosNodos.filter((n) => n.categoria === c.codigo);
            const con = nodos.filter((n) => n.ocupacionPct !== null);
            const cap = con.reduce((a, n) => a + (n.capacidad || 0), 0);
            return {
                id: c.codigo, codigo: c.codigo, nombre: c.nombre, nodos: nodos.length, conDato: con.length,
                promedio: con.length ? con.reduce((a, n) => a + n.ocupacionPct, 0) / con.length : null,
                ponderado: cap > 0 ? con.reduce((a, n) => a + n.ocupacionPct * (n.capacidad || 0), 0) / cap : null,
                criticos: nodos.filter((n) => n.estado === 'CRÍTICO').length
            };
        });
        if (!this.categoriaElegida || !this.filasCategorias.some((c) => c.codigo === this.categoriaElegida)) {
            this.categoriaElegida = this.filasCategorias[0]?.codigo ?? null;
        }
        this.elegirCategoria(this.categoriaElegida);
    }

    elegirCategoria(codigo: string | null): void {
        this.categoriaElegida = codigo;
        this.nodosCategoria = this.todosNodos.filter((n) => n.categoria === codigo);
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
