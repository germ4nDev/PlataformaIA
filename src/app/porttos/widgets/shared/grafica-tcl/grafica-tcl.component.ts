/*
    Author: German Valencia
    Componente de presentación: gráfica de los widgets de pestaña (dona, barras o línea) con PorttosChartHelper,
    así todas las gráficas comparten estilo, tooltips y tema claro/oscuro. La dona trae su leyenda con porcentajes.
*/
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { ILeyendaDonaItem, PorttosChartHelper } from 'src/app/theme/shared/_helpers/chart.helper';

/** color: uno por serie, o uno por barra (p. ej. semáforo) en gráficas de barras. */
export interface SerieGrafica { label: string; data: Array<number | null>; color?: string | string[]; relleno?: boolean }

@Component({
    selector: 'app-grafica-tcl',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './grafica-tcl.component.html',
    styleUrls: ['./grafica-tcl.component.scss']
})
export class GraficaTclComponent implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('lienzo') lienzo?: ElementRef<HTMLCanvasElement>;
    @Input() tipo: 'dona' | 'barras' | 'linea' = 'barras';
    @Input() labels: string[] = [];
    /** Barras y línea */
    @Input() series: SerieGrafica[] = [];
    /** Dona */
    @Input() valores: number[] = [];
    @Input() unidad = '';
    @Input() apilado = false;
    @Input() horizontal = false;
    @Input() isEnfoque = false;

    public leyenda: ILeyendaDonaItem[] = [];
    private chart?: Chart;
    private vistaLista = false;

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.dibujar();
    }

    ngOnChanges(): void {
        // La leyenda se calcula aquí (antes de pintar la vista) para no cambiarla después de revisada
        this.leyenda = this.tipo === 'dona' ? PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores).items : [];
        this.dibujar();
    }

    ngOnDestroy(): void {
        this.chart?.destroy();
    }

    /** Redibuja (al cambiar de tamaño, p. ej. al entrar al modo enfoque). */
    redibujar(): void {
        this.chart?.resize();
    }

    private dibujar(): void {
        if (!this.vistaLista) return;
        if (this.tipo === 'dona') {
            this.chart = PorttosChartHelper.renderizarDona(this.lienzo, this.chart, this.labels, this.valores, this.unidad);
        } else if (this.tipo === 'linea') {
            this.chart = PorttosChartHelper.renderizarLinea(this.lienzo, this.chart, {
                labels: this.labels, unidad: this.unidad, isEnfoque: this.isEnfoque,
                datasets: this.series.map((s) => ({ label: s.label, data: s.data as number[], color: Array.isArray(s.color) ? s.color[0] : s.color, relleno: s.relleno }))
            });
        } else {
            this.chart = PorttosChartHelper.renderizarBarras(this.lienzo, this.chart, {
                labels: this.labels, unidad: this.unidad, apilado: this.apilado, horizontal: this.horizontal, isEnfoque: this.isEnfoque,
                mostrarLeyenda: this.series.length > 1,
                datasets: this.series.map((s) => ({ label: s.label, data: s.data.map((v) => v ?? 0), color: s.color }))
            });
        }
    }
}
