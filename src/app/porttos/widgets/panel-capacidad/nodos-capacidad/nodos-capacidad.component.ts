import { traducir } from '../../../../theme/shared/i18n/traducir';
import { TranslateModule } from '@ngx-translate/core';
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_CAP_TAB_NODOS · 🗺 Catálogo de nodos operativos
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, SerieNodo, TablerosPestanasService, TableroCapacidad } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { TablaTclComponent, ColumnaTabla } from '../../shared/tabla-tcl/tabla-tcl.component';

import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';
import { RangoTclComponent } from '../../shared/rango-tcl/rango-tcl.component';
@Component({
    selector: 'app-nodos-capacidad',
    standalone: true,
    imports: [TranslateModule, CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent, GraficaTclComponent, RangoTclComponent],
    templateUrl: './nodos-capacidad.component.html',
    styleUrls: ['./nodos-capacidad.component.scss']
})
export class NodosCapacidadComponent extends WidgetTableroBase<TableroCapacidad> {
    readonly modulo: ModuloTablero = 'capacidad';
    readonly tituloDefecto = '🗺 Catálogo de nodos operativos';
    override readonly subtituloDefecto = 'Capacidad, ocupación, operaciones y tráfico';
    override readonly iconoDefecto = 'feather icon-list';
    public todos: any[] = [];
    public filas: any[] = [];
    public categorias: Array<{ codigo: string; nombre: string; nodos: number }> = [];
    public categoria: string | null = null;
    public readonly mensajeVacio = 'No hay nodos en el catálogo de capacidad de este puerto.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'nombre', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODE', tipo: 'principal' },
        { campo: 'categoriaNombre', titulo: 'PORTTOS.CATEGORY' },
        { campo: 'operador', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.OPERATOR' },
        { campo: 'capacidadTexto', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.CAPACITY' },
        { campo: 'ocupacionPct', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.OCCUPANCY', tipo: 'numero', decimales: 1, unidad: '%' },
        { campo: 'operaciones', titulo: 'COMMON.OPERATIONS', tipo: 'lista' },
        { campo: 'ingresosH', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.IN_H', tipo: 'numero' },
        { campo: 'salidasH', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.OUT_H', tipo: 'numero' },
        { campo: 'esperaMin', titulo: 'PORTTOS.WIDGETS.WAIT', tipo: 'numero', unidad: 'min' },
        { campo: 'estado', titulo: 'COMMON.STATUS', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'capacidad', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.CAPACITY_NO', tipo: 'numero' },
        { campo: 'unidad', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.UNIT' },
        { campo: 'fechaDato', titulo: 'PORTTOS.WIDGETS.PANEL_CAPACIDAD.DATA_FROM', tipo: 'fecha' },
        { campo: 'simulado', titulo: 'COMMON.SIMULATED_2', tipo: 'si-no' }
    ];
    get criticos(): number { return this.todos.filter((n) => n.estado === 'CRÍTICO').length; }

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCapacidad | null): void {
        this.todos = d?.nodos || [];
        this.categorias = d?.categorias || [];
        this.aplicarFiltro();
    }
    filtrar(categoria: string | null): void {
        this.categoria = categoria;
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        this.filas = this.categoria ? this.todos.filter((n) => n.categoria === this.categoria) : this.todos;
    }

    // ---------------------------------------------------------------- vista ampliada: serie del nodo elegido (Fase 3)
    public nodoElegido: any = null;
    public horas: 24 | 72 | 168 = 24;
    public serie: SerieNodo | null = null;
    public seriesOcupacion: SerieGrafica[] = [];
    public seriesTrafico: SerieGrafica[] = [];
    public errorSerie: string | null = null;

    seleccionar(n: any): void {
        this.nodoElegido = n;
        this.cargarSerie();
    }

    cambiarHoras(h: 24 | 72 | 168): void {
        this.horas = h;
        this.cargarSerie();
    }

    private cargarSerie(): void {
        if (!this.nodoElegido) return;
        this.tableros.serieNodo(this.puerto, this.nodoElegido.id, this.horas).subscribe({
            next: (s) => {
                this.serie = s;
                this.seriesOcupacion = [
                    { label: traducir('PORTTOS.WIDGETS.PANEL_CAPACIDAD.OCCUPANCY'), data: s.ocupacionPct, color: '#2f96b4', relleno: true },
                    { label: traducir('PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.WARNING_70'), data: s.labels.map(() => 70), color: '#f89406' },
                    { label: traducir('PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.CRITICAL_85'), data: s.labels.map(() => 85), color: '#bd362f' }
                ];
                this.seriesTrafico = [
                    { label: traducir('PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.IN_H'), data: s.ingresosH, color: '#51a351' },
                    { label: traducir('PORTTOS.WIDGETS.PANEL_CAPACIDAD.NODOS_CAPACIDAD.OUT_H'), data: s.salidasH, color: '#2f96b4' }
                ];
                this.errorSerie = null;
                this.cdr.detectChanges();
            },
            error: (e) => {
                this.errorSerie = e?.error?.msg || 'No se pudo consultar la serie del nodo';
                this.cdr.detectChanges();
            }
        });
    }
}
