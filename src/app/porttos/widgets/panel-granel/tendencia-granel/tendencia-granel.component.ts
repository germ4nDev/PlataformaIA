/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_CHRT_TENDENCIA · 📈 Tendencia de granel · 24 h
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets y PorttosChartHelper.
*/
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { AvanceOperacion, ModuloTablero, TablerosPestanasService, TableroGranel } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';

import { RangoTclComponent } from '../../shared/rango-tcl/rango-tcl.component';
@Component({
    selector: 'app-tendencia-granel',
    standalone: true,
    imports: [RangoTclComponent, CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './tendencia-granel.component.html',
    styleUrls: ['./tendencia-granel.component.scss']
})
export class TendenciaGranelComponent extends WidgetTableroBase<TableroGranel> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '📈 Tendencia de granel · 24 h';
    override readonly subtituloDefecto = 'Toneladas operadas por hora';
    override readonly iconoDefecto = 'feather icon-trending-up';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public pico: { hora: string; tmh: number } | null = null;
    public total = 0;
    public readonly mensajeVacio = 'Sin toneladas operadas en las últimas 24 horas.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.labels = d?.tendencia.labels || [];
        this.series = [{ label: 'Toneladas por hora', data: d?.tendencia.valores || [], color: '#51a351', relleno: true }];
        this.pico = d?.tendencia.pico || null;
        this.total = d?.tendencia.total24h || 0;
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }


    // ---------------------------------------------------------------- vista ampliada: por tipo y por rango (Fase 3)
    public horas: 24 | 72 | 168 = 24;
    public porTipo: AvanceOperacion | null = null;
    public seriesTipo: SerieGrafica[] = [];
    public errorTipo: string | null = null;

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.isEnfoque) this.cargarPorTipo();
    }

    cambiarHoras(h: 24 | 72 | 168): void {
        this.horas = h;
        this.cargarPorTipo();
    }

    private cargarPorTipo(): void {
        const colores: Record<string, string> = { AGRICOLA: '#51a351', MINERAL: '#f89406', LIQUIDO: '#2f96b4' };
        const nombres: Record<string, string> = { AGRICOLA: 'Agrícola', MINERAL: 'Mineral', LIQUIDO: 'Líquido' };
        this.tableros.avanceGranel(this.puerto, this.horas).subscribe({
            next: (a) => {
                this.porTipo = a;
                this.seriesTipo = Object.entries(a.series || {}).map(([t, data]) => ({ label: nombres[t] || t, data, color: colores[t] }));
                this.errorTipo = null;
                this.cdr.detectChanges();
            },
            error: (e) => {
                this.errorTipo = e?.error?.msg || 'No se pudo consultar la tendencia';
                this.cdr.detectChanges();
            }
        });
    }
}
