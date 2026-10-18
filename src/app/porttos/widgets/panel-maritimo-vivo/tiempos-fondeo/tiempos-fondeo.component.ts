/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Espera en fondeo por día
    Código: PTT_MAE_VIVO_TIEMPOS
    Gráfica: PorttosChartHelper (Chart.js, claro/oscuro). Días configurables en widgetConfig.dias (30).
*/
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { PorttosChartHelper } from 'src/app/theme/shared/_helpers/chart.helper';
import { TiemposMaritimos } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { formatoDuracion } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-tiempos-fondeo',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './tiempos-fondeo.component.html',
    styleUrls: ['../shared/maritimo-vivo.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiemposFondeoComponent extends WidgetMaritimoVivoBase<TiemposMaritimos> implements AfterViewInit, OnDestroy {
    protected readonly codigo = 'PTT_MAE_VIVO_TIEMPOS';
    protected override intervaloMs = 300_000; // historial: basta cada 5 min
    protected override escucharAis = false;
    public readonly duracion = formatoDuracion;

    @ViewChild('lienzo') lienzo?: ElementRef<HTMLCanvasElement>;
    private grafica?: Chart;
    private vistaLista = false;

    get dias(): number {
        return Number(this.widgetConfig?.dias) || 30;
    }

    protected consultar(puerto: string): Observable<TiemposMaritimos> {
        return this.core.tiempos(puerto, this.dias);
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.dibujar();
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.grafica?.destroy();
    }

    protected override alActualizar(): void {
        // El canvas aparece tras el cambio de detección: se dibuja en el siguiente ciclo
        setTimeout(() => this.dibujar(), 0);
    }

    private dibujar(): void {
        const porDia = this.datos?.fondeo.porDia || [];
        if (!this.vistaLista || porDia.length === 0 || !this.lienzo) return;
        const horas = (m: number | null) => (m == null ? 0 : Math.round((m / 60) * 10) / 10);
        const paleta = PorttosChartHelper.PALETA_DEFAULT;
        this.grafica = PorttosChartHelper.renderizarBarras(this.lienzo, this.grafica, {
            labels: porDia.map((d) => d.dia.slice(5).split('-').reverse().join('/')),
            datasets: [
                { label: 'Promedio (h)', data: porDia.map((d) => horas(d.promedioMin)), color: paleta[0] },
                { label: 'P90 (h)', data: porDia.map((d) => horas(d.p90Min)), color: PorttosChartHelper.SEMAFORO.alerta }
            ],
            unidad: 'h',
            mostrarLeyenda: true,
            isEnfoque: this.isEnfoque
        });
    }
}
