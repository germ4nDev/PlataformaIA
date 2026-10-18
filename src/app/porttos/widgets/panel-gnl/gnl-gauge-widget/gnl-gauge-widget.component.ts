// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - GNL Gauge Presión y Temperatura (Consumo Autónomo SCADA)
// */
// import {
//     Component,
//     Input,
//     OnInit,
//     OnChanges,
//     OnDestroy,
//     SimpleChanges,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

// @Component({
//     selector: 'app-gnl-gauge-widget',
//     standalone: true,
//     imports: [CommonModule, DecimalPipe, WidgetShellComponent],
//     templateUrl: './gnl-gauge-widget.component.html',
//     styleUrls: ['./gnl-gauge-widget.component.scss']
// })
// export class GnlGaugeWidgetComponent implements OnInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo para hidratación inmediata al abrir el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     public presionActual: number = 0;
//     public temperaturaActual: number = 0;
//     public alarmaActiva: boolean = false;
//     public tipoEvento: string = 'normal';
//     public segmentoActivo: string = 'TODOS';
//     public presionMaxima: number = 120;
//     public tieneTelemetria: boolean = false;
//     public cargando: boolean = true;
//     arcoDashOffset: number = 0;
//     private readonly destroy$ = new Subject<void>();
//     public longitudTotalArco: number = 110;
//     // Ahora el array tendrá dos valores: la porción pintada y la porción vacía
//     public arcoDashArray: string = '0, 999';
//     public anguloAguja: number = -90;

//     constructor(
//         private _gnlState: GnlStateService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque, aplicamos el snapshot inicial
//         if (this.datosVivos) {
//             this.aplicarLecturaTelemetria(this.datosVivos);
//         }

//         this._gnlState.telemetriaFiltrada$
//             .pipe(takeUntil(this.destroy$))
//             .subscribe((telemetria: any) => {
//                 if (telemetria) {
//                     // Extraemos los valores normalizados que provee el servicio
//                     this.presionActual = Number(telemetria.presion_psi ?? telemetria.presion ?? 74.82);
//                     this.temperaturaActual = Number(telemetria.temp_ducto ?? telemetria.temperatura ?? -163.45);

//                     // Calculamos el ángulo de rotación de la aguja (asumiendo escala de 0 a 150 PSI)
//                     // 0 PSI = -90deg (izq), 150 PSI = +90deg (der) o la fórmula que use tu CSS
//                     this.anguloAguja = this.calcularAnguloAguja(this.presionActual);
//                     this.longitudTotalArco = this.calcularAnguloGauge(this.presionActual);
//                     this.aplicarLecturaTelemetria(telemetria);

//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (changes['datosVivos'] && this.datosVivos) {
//             this.aplicarLecturaTelemetria(this.datosVivos);
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     /**
//      * Homologa lecturas provenientes de GnlStateService, del socket o directamente de scada_pipeline.csv
//      */
//     private aplicarLecturaTelemetria(lectura: any): void {
//         if (!lectura) return;

//         // Soporta estado hidratado desde Modo Enfoque o trama viva SCADA
//         const presion =
//             lectura.presionActual ??
//             lectura.presion_psi ??
//             lectura.pressure;

//         if (presion === undefined && lectura.temperaturaActual === undefined) return;

//         this.presionActual = Number(presion ?? 0);
//         this.temperaturaActual = Number(
//             lectura.temperaturaActual ??
//             lectura.temperatura_celsius ??
//             lectura.temp_ducto ??
//             lectura.temperature ??
//             0
//         );

//         this.segmentoActivo = String(
//             lectura.segmentoActivo ??
//             lectura.codigo_segmento ??
//             (lectura.segment_id !== undefined ? `SEG-${lectura.segment_id}` : 'TODOS')
//         );

//         this.tipoEvento = String(lectura.event_type || lectura.tipoEvento || 'normal');

//         const alarmaExplicita = Boolean(
//             lectura.alarmaActiva ||
//             lectura.alarma_activa ||
//             Number(lectura.alarm_triggered) === 1
//         );

//         this.alarmaActiva = alarmaExplicita || this.presionActual >= 100;
//         this.tieneTelemetria = true;
//         this.cdr.detectChanges();
//     }

//     // get cargando(): boolean {
//     //     return !this.tieneTelemetria;
//     // }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Presión de Descarga',
//             subtitulo:
//                 this.widgetConfig?.descripcionWidget ||
//                 this.widgetConfig?.data?.subtitulo ||
//                 'Telemetría de Brazo / Segmento SCADA',
//             presionActual: this.presionActual,
//             temperaturaActual: this.temperaturaActual,
//             alarmaActiva: this.alarmaActiva,
//             tipoEvento: this.tipoEvento,
//             segmentoActivo: this.segmentoActivo
//         };
//     }

//     /**
//      * Convierte el rango 0..120 PSI al ángulo -90°..+90° de la aguja semicircular
//      */
//     // get calcularAnguloAguja(): number {
//     //     let porcentaje = this.presionActual / this.presionMaxima;
//     //     if (porcentaje > 1) porcentaje = 1;
//     //     if (porcentaje < 0) porcentaje = 0;
//     //     return porcentaje * 180 - 90;
//     // }

//     private calcularAnguloAguja(valor: number): number {
//         const min = 0;
//         const max = 100; // Si tu escala máxima es 150 o 200, cámbialo aquí

//         const clamped = Math.min(Math.max(valor, min), max);
//         const porcentaje = (clamped - min) / (max - min);

//         // Si el tacómetro abre de izquierda (-90°) a derecha (+90°):
//         // -90° es el extremo izquierdo (0 PSI) y +90° es el extremo derecho (100 PSI)
//         const anguloMinimo = -90;
//         const anguloMaximo = 90;

//         return anguloMinimo + (porcentaje * (anguloMaximo - anguloMinimo));
//     }



//     // private calcularAnguloGauge(valor: number): number {
//     //     const min = 0;
//     //     const max = 100; // O tu valor máximo esperado
//     //     const clamped = Math.min(Math.max(valor, min), max);
//     //     const porcentaje = (clamped - min) / (max - min);

//     //     // 🟢 CORRECCIÓN: Invertimos el offset para que el arco azul crezca proporcionalmente al valor (ej. 74.71%)
//     //     this.arcoDashOffset = this.longitudTotalArco * (1 - porcentaje);

//     //     // Retorno del ángulo de la aguja (-90° a +90°)
//     //     return -90 + (porcentaje * 180);
//     // }
//     private calcularAnguloGauge(valor: number): number {
//         const min = 0;
//         const max = 100; // O el máximo de tu escala
//         const clamped = Math.min(Math.max(valor, min), max);
//         const porcentaje = (clamped - min) / (max - min);

//         // 🟢 EL TRUCO DEL ESPACIO INFINITO:
//         // Pintamos la porción exacta (sobre los 110px del arco) y dejamos 999px vacíos.
//         // Esto asegura que NUNCA se vuelva a repetir el trazo.
//         const porcionPintada = 110 * porcentaje;
//         this.arcoDashArray = `${porcionPintada}, 999`;

//         // La aguja rota desde -90 grados (izquierda) hasta +90 grados (derecha)
//         return -90 + (porcentaje * 180);
//     }

//     /**
//      * Evalúa correctamente el color de la temperatura tanto en escala criogénica (< 0 °C)
//      * como en la escala positiva de scada_pipeline.csv (25.92 °C - 38.52 °C)
//      */
//     get claseTemperatura(): string {
//         if (this.temperaturaActual < 0) {
//             if (this.temperaturaActual > -150) return 'text-danger';
//             if (this.temperaturaActual > -155) return 'text-warning';
//             return 'text-info';
//         }
//         // Rango positivo de scada_pipeline.csv (Media: 32.1 °C, P90: 34.67 °C, P95: 35.35 °C)
//         if (this.temperaturaActual >= 35.5) return 'text-danger';
//         if (this.temperaturaActual >= 34.5) return 'text-warning';
//         return 'text-info';
//     }

//     public maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_GNL_GAUGE_PRESION',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Tacómetro (Consumo Autónomo SCADA / WebSocket)
*/
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-gnl-gauge-widget',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gnl-gauge-widget.component.html',
    styleUrls: ['./gnl-gauge-widget.component.scss']
})
export class GnlGaugeWidgetComponent implements OnInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public presionActual: number = 0;
    public temperaturaActual: number = 0;

    // Constantes matemáticas para el SVG
    public longitudTotalArco: number = 110;
    public arcoDashArray: string = '0, 999';
    public anguloAguja: number = -90;
    public ultimoBrazo: string = 'TODOS LOS BRAZOS';

    public cargando: boolean = true;

    // 🟢 VARIABLE PARA EL SEMÁFORO REAL (Sincronizada con la bitácora)
    public alarmaActiva: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private cdr: ChangeDetectorRef
    ) { }

    // 🟢 CEREBRO DEL SEMÁFORO: Retorna el código de color exacto
    get colorEstado(): string {
        // 1. ROJO (Peligro o Alarma SCADA activada)
        if (this.alarmaActiva || this.presionActual >= 75) {
            return '#ff4757';
        }
        // 2. AMARILLO / NARANJA (Advertencia)
        if (this.presionActual >= 72 && this.presionActual < 75) {
            return '#ff9800';
        }
        // 3. AZUL MENTA / CRIOGÉNICO (Estable)
        return '#00d4ff';
    }

    // ngOnInit(): void {
    //     this._gnlState.telemetriaFiltrada$
    //         .pipe(takeUntil(this.destroy$))
    //         .subscribe((telemetria: any) => {
    //             if (telemetria) {
    //                 // Extraemos los valores
    //                 this.presionActual = Number(telemetria.presion_psi ?? telemetria.presion ?? this.presionActual);
    //                 this.temperaturaActual = Number(telemetria.temp_ducto ?? telemetria.temperatura ?? this.temperaturaActual);

    //                 // 🟢 LEEMOS EL ESTADO DE EMERGENCIA DIRECTO DEL SCADA
    //                 this.alarmaActiva = telemetria.alarm_triggered === 1 || telemetria.alarmas_activas_count > 0;

    //                 // Calculamos la rotación matemática y la longitud del trazo azul
    //                 this.anguloAguja = this.calcularAnguloGauge(this.presionActual);

    //                 this.cargando = false;
    //                 this.cdr.detectChanges();
    //             }
    //         });
    // }
    ngOnInit(): void {
        // 🟢 1. ESCUCHAMOS EL CAMBIO DE BRAZO PARA REINICIAR EL TACÓMETRO
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.ultimoBrazo !== nuevoBrazo) {
                    this.ultimoBrazo = nuevoBrazo;
                    this.limpiarTacometro();
                }
            });

        // 2. Escuchamos la telemetría
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((telemetria: any) => {
                if (telemetria) {
                    this.presionActual = Number(telemetria.presion_psi ?? telemetria.presion ?? this.presionActual);
                    this.temperaturaActual = Number(telemetria.temp_ducto ?? telemetria.temperatura ?? this.temperaturaActual);

                    // Corregido 2026-10-17: el backend envía alarma_activa (alarm_triggered / alarmas_activas_count no existen)
                    this.alarmaActiva = telemetria.alarma_activa === true || telemetria.alarm_triggered === 1 || telemetria.alarmas_activas_count > 0;
                    this.ultimoBrazo = telemetria.esConsolidado ? 'TODOS' : (telemetria.codigo_segmento || 'GENERAL');

                    this.anguloAguja = this.calcularAnguloGauge(this.presionActual);

                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Calcula el ángulo de la aguja y la longitud del trazo de progreso del SVG
     * Asumiendo un rango visual operativo de 0 a 100 PSI (Ajustable)
     */
    private calcularAnguloGauge(valor: number): number {
        const min = 0;
        const max = 100; // Si la presión sube más de 100 en tu sistema, aumenta este valor (ej. 150)

        // Evitamos que el valor se salga del rango visual del dibujo (Clamp)
        const clamped = Math.min(Math.max(valor, min), max);
        const porcentaje = (clamped - min) / (max - min);

        // 🟢 CÁLCULO DEL RELLENO AZUL (Stroke Dasharray)
        // Pintamos 'porcionPintada' (sobre los 110px del arco) y dejamos '999px' invisibles
        // para que jamás se repita el patrón.
        const porcionPintada = this.longitudTotalArco * porcentaje;
        this.arcoDashArray = `${porcionPintada}, 999`;

        // 🟢 CÁLCULO DE LA AGUJA
        // Rota desde -90° (extremo izquierdo) hasta +90° (extremo derecho)
        return -90 + (porcentaje * 180);
    }

    private limpiarTacometro(): void {
        // 🟢 REGRESAMOS TODO A CERO
        this.presionActual = 0;
        this.temperaturaActual = 0;
        this.alarmaActiva = false;

        // Devolvemos la aguja al extremo izquierdo y borramos la línea de color
        this.anguloAguja = -90;
        this.arcoDashArray = '0, 999';

        this.cargando = true;
        this.cdr.detectChanges();
    }

    maximizarDesdeShell(): void {
        // Lógica de maximización si el tacómetro lo requiere
    }
}
