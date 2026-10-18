/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Helper: PORTTOS / QPLUS Chart Style Factory (CSS-Variables & Theme Overload Ready)
    Description: Centraliza el diseño de gráficas Chart.js leyendo las variables de styles.scss
                 y actualiza automáticamente los colores al alternar entre Modo Claro y Modo Oscuro.
*/
import { ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ILeyendaDonaItem {
    label: string;
    valor: number;
    porcentaje: number;
    color: string;
}

export interface IDatasetBarra {
    label: string;
    data: number[];
    color?: string | string[];
}

export interface IOpcionesBarraPorttos {
    labels: string[];
    datasets: IDatasetBarra[];
    unidad?: string;
    apilado?: boolean;
    horizontal?: boolean;
    mostrarLeyenda?: boolean;
    isEnfoque?: boolean;
    esStacked?: boolean
}

export interface IOpcionesLineaPorttos {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        color?: string;
        relleno?: boolean;
    }>;
    unidad?: string;
    isEnfoque?: boolean;
}

export class PorttosChartHelper {
    private static observadorIniciado: boolean = false;

    /**
     * Lee una variable CSS desde body o :root.
     * Permite pasar una variable de respaldo de tu styles.scss (ej. '--widget-subtitle')
     * antes de usar el fallback hexadecimal.
     */
    public static cssVar(
        nombreVariable: string,
        fallback: string,
        variableRespaldo?: string
    ): string {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return fallback;
        }

        const leerPropiedad = (varName: string): string => {
            const valBody = getComputedStyle(document.body).getPropertyValue(varName).trim();
            if (valBody) return valBody;
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };

        let valor = leerPropiedad(nombreVariable);

        // Si la variable apunta a otra con var(--nombre) sin resolver, la resolvemos
        if (valor.startsWith('var(')) {
            const match = valor.match(/var\(\s*(--[^,\s)]+)/);
            if (match && match[1]) {
                valor = leerPropiedad(match[1]);
            }
        }

        if (!valor && variableRespaldo) {
            valor = leerPropiedad(variableRespaldo);
        }

        return valor || fallback;
    }

    /**
     * Lee una variable numérica (px, %, rem o decimal) desde styles.scss
     */
    public static cssNum(nombreVariable: string, fallback: number): number {
        const raw = PorttosChartHelper.cssVar(nombreVariable, String(fallback));
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Aplica transparencia segura tanto a colores Hex (#009ef7) como RGB/HSL
     */
    public static aplicarOpacidad(color: string, opacidad: number = 0.15): string {
        const c = (color || '#009ef7').trim();
        if (c.startsWith('#')) {
            let hex = c.slice(1);
            if (hex.length === 3) {
                hex = hex
                    .split('')
                    .map((ch) => ch + ch)
                    .join('');
            }
            if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacidad})`;
            }
        }
        if (c.startsWith('rgb(')) {
            return c.replace('rgb(', 'rgba(').replace(')', `, ${opacidad})`);
        }
        if (c.startsWith('hsl(')) {
            return c.replace('hsl(', 'hsla(').replace(')', `, ${opacidad})`);
        }
        return c;
    }

    /**
     * Paleta dinámica conectada a --chart-color-1..8 y a las variables base de styles.scss
     */
    public static get PALETA_DEFAULT(): string[] {
        return [
            PorttosChartHelper.cssVar('--chart-color-1', '#009ef7', '--gauge-needle-color'),
            PorttosChartHelper.cssVar('--chart-color-2', '#10b981'),
            PorttosChartHelper.cssVar('--chart-color-3', '#f59e0b'),
            PorttosChartHelper.cssVar('--chart-color-4', '#8b5cf6'),
            PorttosChartHelper.cssVar('--chart-color-5', '#ec4899'),
            PorttosChartHelper.cssVar('--chart-color-6', '#0d6efd', '--primary-color'),
            PorttosChartHelper.cssVar('--chart-color-7', '#14b8a6'),
            PorttosChartHelper.cssVar('--chart-color-8', '#ef4444')
        ];
    }

    /**
     * Semáforo operativo conectado al tema activo
     */
    public static get SEMAFORO(): { ok: string; alerta: string; critico: string } {
        return {
            ok: PorttosChartHelper.cssVar('--chart-semaforo-ok', '#009ef7', '--gauge-needle-color'),
            alerta: PorttosChartHelper.cssVar('--chart-semaforo-alerta', '#f59e0b'),
            critico: PorttosChartHelper.cssVar('--chart-semaforo-critico', '#ef4444')
        };
    }

    /**
     * Configuración estandarizada de Tooltips vinculada a --widget-background, --widget-text y --widget-border
     */
    private static obtenerTooltipBase(formatterCallback?: (context: any) => string): any {
        const fontFamily = PorttosChartHelper.cssVar(
            '--chart-font-family',
            "'Inter', 'Roboto', sans-serif"
        );
        return {
            backgroundColor: PorttosChartHelper.cssVar(
                '--chart-tooltip-bg',
                '#ffffff',
                '--widget-background'
            ),
            titleColor: PorttosChartHelper.cssVar(
                '--chart-tooltip-title',
                '#212529',
                '--widget-text'
            ),
            bodyColor: PorttosChartHelper.cssVar(
                '--chart-tooltip-body',
                '#464e57',
                '--widget-subtitle'
            ),
            borderColor: PorttosChartHelper.cssVar(
                '--chart-tooltip-border',
                '#cecdcd',
                '--widget-border'
            ),
            borderWidth: 1,
            padding: PorttosChartHelper.cssNum('--chart-tooltip-padding', 10),
            cornerRadius: PorttosChartHelper.cssNum('--chart-tooltip-radius', 6),
            titleFont: { family: fontFamily, weight: 'bold' },
            bodyFont: { family: fontFamily },
            displayColors: true,
            boxPadding: 4,
            ...(formatterCallback ? { callbacks: { label: formatterCallback } } : {})
        };
    }

    /**
     * 1. CALCULADOR DE LEYENDA LATERAL Y TOTAL PARA DONAS
     */
    public static calcularLeyendaDona(
        labels: string[],
        valores: number[],
        paleta: string[] = PorttosChartHelper.PALETA_DEFAULT
    ): { total: number; items: ILeyendaDonaItem[] } {
        const valoresNumericos = (valores || []).map((v) => Number(v || 0));
        const total = valoresNumericos.reduce((acc, v) => acc + v, 0);
        const coloresActivos =
            paleta && paleta.length > 0 ? paleta : PorttosChartHelper.PALETA_DEFAULT;

        const items: ILeyendaDonaItem[] = (labels || []).map((label, idx) => {
            const valor = valoresNumericos[idx] || 0;
            const porcentaje = total > 0 ? Number(((valor / total) * 100).toFixed(1)) : 0;
            return {
                label: String(label),
                valor,
                porcentaje,
                color: coloresActivos[idx % coloresActivos.length]
            };
        });

        return { total, items };
    }

    /**
     * 2. FACTORY PARA GRÁFICAS DE DONA MODERNAS
     */
    public static renderizarDona(
        canvasRef: ElementRef<HTMLCanvasElement> | undefined,
        instanciaPrevia: Chart | undefined,
        labels: string[],
        valores: number[],
        unidad: string = 'Ton',
        paleta: string[] = PorttosChartHelper.PALETA_DEFAULT
    ): Chart | undefined {
        PorttosChartHelper.iniciarObservadorDeTema();

        if (instanciaPrevia) {
            instanciaPrevia.destroy();
        }
        const ctx = canvasRef?.nativeElement?.getContext('2d');
        if (!ctx || !labels || labels.length === 0) return undefined;

        const total = valores.reduce((acc, v) => acc + Number(v || 0), 0);
        const coloresActivos =
            paleta && paleta.length > 0 ? paleta : PorttosChartHelper.PALETA_DEFAULT;

        const config: ChartConfiguration<'doughnut'> = {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data: valores,
                        backgroundColor: labels.map(
                            (_, i) => coloresActivos[i % coloresActivos.length]
                        ),
                        borderWidth: 0,
                        spacing: PorttosChartHelper.cssNum('--chart-dona-spacing', 3),
                        borderRadius: PorttosChartHelper.cssNum('--chart-dona-radius', 4),
                        hoverOffset: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: PorttosChartHelper.cssVar('--chart-dona-cutout', '72%'),
                plugins: {
                    legend: { display: false },
                    tooltip: PorttosChartHelper.obtenerTooltipBase((context) => {
                        const val = Number(context.parsed || 0);
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                        const sufijo = unidad ? ` ${unidad}` : '';
                        return ` ${context.label}: ${val.toLocaleString('es-CO')}${sufijo} (${pct}%)`;
                    })
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * 3. FACTORY PARA GRÁFICAS DE BARRAS (Verticales, Horizontales, Agrupadas o Apiladas)
     */
    public static renderizarBarras(
        canvasRef: ElementRef<HTMLCanvasElement> | undefined,
        instanciaPrevia: Chart | undefined,
        opciones: IOpcionesBarraPorttos
    ): Chart | undefined {
        PorttosChartHelper.iniciarObservadorDeTema();

        if (instanciaPrevia) {
            instanciaPrevia.destroy();
        }
        const ctx = canvasRef?.nativeElement?.getContext('2d');
        if (!ctx || !opciones.labels || opciones.labels.length === 0) return undefined;

        const {
            labels,
            datasets,
            unidad = '',
            apilado = false,
            horizontal = false,
            mostrarLeyenda = true,
            isEnfoque = false
        } = opciones;

        const paleta = PorttosChartHelper.PALETA_DEFAULT;
        const fontFamily = PorttosChartHelper.cssVar(
            '--chart-font-family',
            "'Inter', 'Roboto', sans-serif"
        );
        const axisTextColor = PorttosChartHelper.cssVar(
            '--chart-axis-text-color',
            '#464e57',
            '--widget-subtitle'
        );
        const gridColor = PorttosChartHelper.cssVar(
            '--chart-grid-line-color',
            'rgba(148, 163, 184, 0.16)'
        );
        const tickSize = PorttosChartHelper.cssNum(
            isEnfoque ? '--chart-font-size-tick-enfoque' : '--chart-font-size-tick',
            isEnfoque ? 12 : 10
        );
        const legendSize = PorttosChartHelper.cssNum(
            isEnfoque ? '--chart-font-size-legend-enfoque' : '--chart-font-size-legend',
            isEnfoque ? 13 : 11
        );
        const barRadius = PorttosChartHelper.cssNum(
            apilado ? '--chart-bar-radius-stacked' : '--chart-bar-radius',
            apilado ? 2 : 4
        );

        const config: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels,
                datasets: datasets.map((ds, idx) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: ds.color || paleta[idx % paleta.length],
                    borderRadius: barRadius,
                    barPercentage: 0.65,
                    categoryPercentage: 0.72
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: horizontal ? 'y' : 'x',
                interaction: apilado
                    ? { mode: 'index', intersect: false }
                    : { mode: 'nearest', intersect: true },
                plugins: {
                    legend: {
                        display: mostrarLeyenda && datasets.length > 1,
                        position: 'top',
                        labels: {
                            color: axisTextColor,
                            boxWidth: 10,
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            font: { family: fontFamily, size: legendSize, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        ...PorttosChartHelper.obtenerTooltipBase((context) => {
                            const valorEje = horizontal ? context.parsed.x : context.parsed.y;
                            const sufijo = unidad ? ` ${unidad}` : '';
                            return ` ${context.dataset.label}: ${Number(valorEje || 0).toLocaleString('es-CO')}${sufijo}`;
                        }),
                        ...(apilado ? { mode: 'index', intersect: false } : {})
                    }
                },
                // scales: {
                //     x: {
                //         stacked: apilado,
                //         grid: {
                //             display: horizontal,
                //             color: gridColor
                //         },
                //         border: { display: false },
                //         ticks: {
                //             color: axisTextColor,
                //             font: { family: fontFamily, size: tickSize }
                //         }
                //     },
                //     y: {
                //         stacked: apilado,
                //         beginAtZero: true,
                //         grid: {
                //             display: !horizontal,
                //             color: gridColor
                //         },
                //         border: { display: false },
                //         ticks: {
                //             color: axisTextColor,
                //             font: { family: fontFamily, size: tickSize },
                //             callback: (val) => {
                //                 if (horizontal) return val;
                //                 const num = Number(val);
                //                 if (!isNaN(num)) {
                //                     if (Math.abs(num) >= 1_000_000) {
                //                         return (
                //                             (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
                //                         );
                //                     }
                //                     if (Math.abs(num) >= 10_000) {
                //                         return (num / 1_000).toFixed(0) + 'K';
                //                     }
                //                 }
                //                 const sufijoCorto = unidad
                //                     ? ` ${unidad.toLowerCase().slice(0, 3)}`
                //                     : '';
                //                 return `${val}${sufijoCorto}`;
                //             }
                //         }
                //     }
                // },
                scales: {
                    x: {
                        stacked: apilado, // 🟢 Chart.js apilará en X
                        grid: {
                            display: horizontal,
                            color: gridColor
                        },
                        border: { display: false },
                        ticks: {
                            color: axisTextColor,
                            font: { family: fontFamily, size: tickSize }
                        }
                    },
                    y: {
                        stacked: apilado, // 🟢 Chart.js sumará los valores en Y
                        beginAtZero: true,
                        grid: {
                            display: !horizontal,
                            color: gridColor
                        },
                        border: { display: false },
                        ticks: {
                            color: axisTextColor,
                            font: { family: fontFamily, size: tickSize },
                            // 🟢 IMPORTANTE PARA STACKED: Agregamos un stepSize dinámico solo si los números son muy pequeños
                            // para evitar que Chart.js intente apilar decimales (ej. 0.5 camiones)
                            stepSize: apilado ? 1 : undefined,

                            callback: (val) => {
                                if (horizontal) return val;
                                const num = Number(val);
                                if (!isNaN(num)) {
                                    if (Math.abs(num) >= 1_000_000) {
                                        return (
                                            (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
                                        );
                                    }
                                    if (Math.abs(num) >= 10_000) {
                                        return (num / 1_000).toFixed(0) + 'K';
                                    }
                                }
                                const sufijoCorto = unidad
                                    ? ` ${unidad.toLowerCase().slice(0, 3)}`
                                    : '';
                                return `${val}${sufijoCorto}`;
                            }
                        }
                    }
                }

            }
        };

        return new Chart(ctx, config);
    }

    /**
     * 4. FACTORY PARA GRÁFICAS DE LÍNEA / TENDENCIA
     */
    public static renderizarLinea(
        canvasRef: ElementRef<HTMLCanvasElement> | undefined,
        instanciaPrevia: Chart | undefined,
        opciones: IOpcionesLineaPorttos
    ): Chart | undefined {
        PorttosChartHelper.iniciarObservadorDeTema();

        if (instanciaPrevia) {
            instanciaPrevia.destroy();
        }
        const ctx = canvasRef?.nativeElement?.getContext('2d');
        if (!ctx || !opciones.labels || opciones.labels.length === 0) return undefined;

        const { labels, datasets, unidad = '', isEnfoque = false } = opciones;

        const paleta = PorttosChartHelper.PALETA_DEFAULT;
        const fontFamily = PorttosChartHelper.cssVar(
            '--chart-font-family',
            "'Inter', 'Roboto', sans-serif"
        );
        const axisTextColor = PorttosChartHelper.cssVar(
            '--chart-axis-text-color',
            '#464e57',
            '--widget-subtitle'
        );
        const gridColor = PorttosChartHelper.cssVar(
            '--chart-grid-line-color',
            'rgba(148, 163, 184, 0.16)'
        );
        const tickSize = PorttosChartHelper.cssNum(
            isEnfoque ? '--chart-font-size-tick-enfoque' : '--chart-font-size-tick',
            isEnfoque ? 12 : 10
        );
        const legendSize = PorttosChartHelper.cssNum(
            isEnfoque ? '--chart-font-size-legend-enfoque' : '--chart-font-size-legend',
            isEnfoque ? 13 : 11
        );
        const lineTension = PorttosChartHelper.cssNum('--chart-line-tension', 0.35);
        const lineWidth = PorttosChartHelper.cssNum('--chart-line-width', 2.5);

        const config: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels,
                datasets: datasets.map((ds, idx) => {
                    const colorBase = ds.color || paleta[idx % paleta.length];
                    return {
                        label: ds.label,
                        data: ds.data,
                        borderColor: colorBase,
                        backgroundColor: ds.relleno
                            ? PorttosChartHelper.aplicarOpacidad(colorBase, 0.15)
                            : colorBase,
                        fill: Boolean(ds.relleno),
                        tension: lineTension,
                        borderWidth: lineWidth,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    };
                })
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        position: 'top',
                        labels: {
                            color: axisTextColor,
                            boxWidth: 10,
                            usePointStyle: true,
                            font: { family: fontFamily, size: legendSize, weight: 'bold' }
                        }
                    },
                    tooltip: PorttosChartHelper.obtenerTooltipBase((context) => {
                        const sufijo = unidad ? ` ${unidad}` : '';
                        return ` ${context.dataset.label}: ${Number(context.parsed.y || 0).toLocaleString('es-CO')}${sufijo}`;
                    })
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            color: axisTextColor,
                            font: { family: fontFamily, size: tickSize }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        border: { display: false },
                        ticks: {
                            color: axisTextColor,
                            font: { family: fontFamily, size: tickSize }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * 5. SOBRECARGA DE TEMA EN CALIENTE (Modo Claro <-> Modo Oscuro)
     * Recorre todas las instancias de Chart.js activas en pantalla y actualiza
     * colores de ejes, grillas, leyendas y tooltips leyendo el styles.scss actual.
     */
    public static actualizarTemaEnGraficasActivas(): void {
        if (typeof window === 'undefined') return;

        const axisTextColor = PorttosChartHelper.cssVar(
            '--chart-axis-text-color',
            '#464e57',
            '--widget-subtitle'
        );
        const gridColor = PorttosChartHelper.cssVar(
            '--chart-grid-line-color',
            'rgba(148, 163, 184, 0.16)'
        );
        const tooltipBg = PorttosChartHelper.cssVar(
            '--chart-tooltip-bg',
            '#ffffff',
            '--widget-background'
        );
        const tooltipTitle = PorttosChartHelper.cssVar(
            '--chart-tooltip-title',
            '#212529',
            '--widget-text'
        );
        const tooltipBody = PorttosChartHelper.cssVar(
            '--chart-tooltip-body',
            '#464e57',
            '--widget-subtitle'
        );
        const tooltipBorder = PorttosChartHelper.cssVar(
            '--chart-tooltip-border',
            '#cecdcd',
            '--widget-border'
        );

        const instancias = Object.values(Chart.instances || {});

        instancias.forEach((chart: Chart) => {
            if (!chart || !chart.options) return;

            const scales = chart.options.scales as any;
            if (scales?.x) {
                if (scales.x.ticks) scales.x.ticks.color = axisTextColor;
                if (scales.x.grid) scales.x.grid.color = gridColor;
            }
            if (scales?.y) {
                if (scales.y.ticks) scales.y.ticks.color = axisTextColor;
                if (scales.y.grid) scales.y.grid.color = gridColor;
            }

            const plugins = chart.options.plugins as any;
            if (plugins?.legend?.labels) {
                plugins.legend.labels.color = axisTextColor;
            }
            if (plugins?.tooltip) {
                plugins.tooltip.backgroundColor = tooltipBg;
                plugins.tooltip.titleColor = tooltipTitle;
                plugins.tooltip.bodyColor = tooltipBody;
                plugins.tooltip.borderColor = tooltipBorder;
            }

            chart.update('none');
        });
    }

    /**
     * 6. OBSERVADOR AUTOMÁTICO DE CAMBIO DE TEMA EN EL DOM
     * Se suscribe una única vez a los cambios de clase/atributo en <body> y <html>
     * para disparar actualizarTemaEnGraficasActivas() sin intervención manual.
     */
    public static iniciarObservadorDeTema(): void {
        if (
            PorttosChartHelper.observadorIniciado ||
            typeof window === 'undefined' ||
            typeof MutationObserver === 'undefined'
        ) {
            return;
        }

        PorttosChartHelper.observadorIniciado = true;

        const observer = new MutationObserver(() => {
            requestAnimationFrame(() => {
                PorttosChartHelper.actualizarTemaEnGraficasActivas();
            });
        });

        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'data-theme', 'data-bs-theme', 'style']
            });
        }

        if (document.documentElement) {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme', 'data-bs-theme', 'style']
            });
        }
    }
}
