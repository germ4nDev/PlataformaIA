/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Angular Service Pattern - GNL State & SCADA CSV Telemetry Brain
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ITelemetriaGNL {
    id_puerto?: string;
    codigo_segmento: string;
    flujo_m3: number;
    temp_ducto: number;
    presion_psi: number;
    valve_status: number;
    pump_state: number;
    pump_speed: number;
    compressor_state: number;
    energy_consumption: number;
    alarm_triggered: number;
    event_type: string;
    timestamp: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class GnlStateService {
    // BehaviorSubjects: conservan el último pulso para que cualquier Smart Widget o Modal se hidrate al instante
    public telemetriaFiltrada$ = new BehaviorSubject<ITelemetriaGNL | null>(null);
    public brazoSeleccionado$ = new BehaviorSubject<string>('TODOS');
    public brazosActivos$ = new BehaviorSubject<string[]>([]);

    private puertoActual: string = 'BUENAVENTURA';
    private brazosSet: Set<string> = new Set();
    private ultimoEstadoBrazos: Map<string, ITelemetriaGNL> = new Map();
    private contadorAlarmasScada: number = 0;

    // Base oficial de los 6 KPIs de GNL
    private readonly kpisBaseGNL = [
        {
            codigo: 'PTT_GNL_KPI_VOLUMEN',
            titulo: 'VOLUMEN ALMACENADO',
            valor: '142.5K',
            subtitulo: '85% Ocupación · 2 Tanques',
            colorBorde: 'borde-cyan'
        },
        {
            codigo: 'PTT_GNL_KPI_DESCARGA',
            titulo: 'CAUDAL EN DUCTO',
            valor: '4.36 m³/h',
            subtitulo: 'Promedio SCADA · 50 Segmentos',
            colorBorde: 'borde-green'
        },
        {
            codigo: 'PTT_GNL_KPI_INYECCION',
            titulo: 'PRESIÓN DE LÍNEA',
            valor: '76.2 PSI',
            subtitulo: 'Rango operativo: 43 - 115 PSI',
            colorBorde: 'borde-amarillo'
        },
        {
            codigo: 'PTT_GNL_KPI_BOG',
            titulo: 'TEMPERATURA DUCTO',
            valor: '32.1 °C',
            subtitulo: 'Monitoreo térmico en línea',
            colorBorde: 'borde-naranja'
        },
        {
            codigo: 'PTT_GNL_KPI_CALORIFICO',
            titulo: 'CONSUMO ENERGÍA',
            valor: '26.85 kWh',
            subtitulo: 'Bombas y compresores activos',
            colorBorde: 'borde-teal'
        },
        {
            codigo: 'PTT_GNL_KPI_ALERTAS',
            titulo: 'ALERTAS SCADA',
            valor: '0',
            subtitulo: 'Sistemas operando normal',
            colorBorde: 'borde-purple'
        }
    ];

    public reiniciarEstadoPuerto(nuevoPuerto: string): void {
        this.puertoActual = (nuevoPuerto || 'BUENAVENTURA').trim().toUpperCase();
        this.brazosSet.clear();
        this.ultimoEstadoBrazos.clear();
        this.contadorAlarmasScada = 0;
        this.brazoSeleccionado$.next('TODOS');
        this.brazosActivos$.next([]);
        this.telemetriaFiltrada$.next(null);
    }

    /**
     * Homologa cada registro proveniente de scada_pipeline.csv (vía Socket o API)
     */
    public procesarPulsoSocket(payload: any, puertoActivo: string): void {
        if (!payload) return;

        const puertoPayload = (payload.id_puerto || '').trim().toUpperCase();
        const puertoEsperado = (puertoActivo || this.puertoActual || '').trim().toUpperCase();

        if (puertoPayload && puertoEsperado && puertoPayload !== puertoEsperado) {
            return;
        }

        // Homologación 1:1 entre columnas de scada_pipeline.csv y propiedades del Frontend
        const segmento = String(
            payload.codigo_segmento ??
            (payload.segment_id !== undefined ? `SEG-${payload.segment_id}` : 'SEG-1')
        );

        const lecturaNormalizada: ITelemetriaGNL = {
            ...payload,
            codigo_segmento: segmento,
            flujo_m3: Number(payload.flujo_m3 ?? payload.flow_rate ?? 0),
            temp_ducto: Number(payload.temp_ducto ?? payload.temperature ?? 0),
            presion_psi: Number(payload.presion_psi ?? payload.pressure ?? 0),
            valve_status: Number(payload.valve_status ?? 1),
            pump_state: Number(payload.pump_state ?? 1),
            pump_speed: Number(payload.pump_speed ?? 0),
            compressor_state: Number(payload.compressor_state ?? 1),
            energy_consumption: Number(payload.energy_consumption ?? 0),
            alarm_triggered: Number(payload.alarm_triggered ?? 0),
            event_type: String(payload.event_type || 'normal'),
            timestamp: payload.timestamp || new Date().toISOString()
        };

        if (lecturaNormalizada.alarm_triggered === 1) {
            this.contadorAlarmasScada++;
        }

        this.brazosSet.add(segmento);
        this.ultimoEstadoBrazos.set(segmento, lecturaNormalizada);
        this.emitirBrazosOrdenados();

        const filtroActual = this.brazoSeleccionado$.getValue();
        if (filtroActual === 'TODOS') {
            this.calcularConsolidado(lecturaNormalizada.timestamp);
        } else if (filtroActual === segmento) {
            this.telemetriaFiltrada$.next(lecturaNormalizada);
        }
    }

    public seleccionarBrazo(brazo: string): void {
        this.brazoSeleccionado$.next(brazo);

        if (brazo === 'TODOS') {
            this.calcularConsolidado();
        } else {
            const datosBrazo = this.ultimoEstadoBrazos.get(brazo);
            if (datosBrazo) {
                this.telemetriaFiltrada$.next(datosBrazo);
            }
        }
    }

    private calcularConsolidado(timestamp?: string): void {
        const total = this.ultimoEstadoBrazos.size;
        if (total === 0) return;

        let sFlujo = 0;
        let sTemp = 0;
        let sPresion = 0;
        let sEnergia = 0;
        let sPumpSpeed = 0;
        let alarmasActivas = 0;
        let ultimoEventoCritico = 'normal';

        this.ultimoEstadoBrazos.forEach((d) => {
            sFlujo += d.flujo_m3;
            sTemp += d.temp_ducto;
            sPresion += d.presion_psi;
            sEnergia += d.energy_consumption;
            sPumpSpeed += d.pump_speed;
            if (d.alarm_triggered === 1) {
                alarmasActivas++;
                if (d.event_type && d.event_type !== 'normal') {
                    ultimoEventoCritico = d.event_type;
                }
            }
        });

        const consolidado: ITelemetriaGNL = {
            codigo_segmento: 'TODOS',
            flujo_m3: Number((sFlujo / total).toFixed(2)), // Promedio por segmento (rango 1.01 - 7.53)
            flujo_total_m3: Number(sFlujo.toFixed(2)),      // Suma total de segmentos activos
            temp_ducto: Number((sTemp / total).toFixed(2)),
            presion_psi: Number((sPresion / total).toFixed(2)),
            valve_status: 1,
            pump_state: 1,
            pump_speed: Number((sPumpSpeed / total).toFixed(1)),
            compressor_state: 1,
            energy_consumption: Number((sEnergia / total).toFixed(2)),
            alarm_triggered: alarmasActivas > 0 ? 1 : 0,
            alarmas_activas_count: alarmasActivas,
            event_type: ultimoEventoCritico,
            timestamp: timestamp || new Date().toISOString()
        };

        this.telemetriaFiltrada$.next(consolidado);
    }

    private emitirBrazosOrdenados(): void {
        const ordenados = Array.from(this.brazosSet).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
        this.brazosActivos$.next(ordenados);
    }

    /**
     * Entrega los datos reactivos para los 6 KPIs de GNL alimentados desde scada_pipeline.csv
     */
    public obtenerDatosKpiGnl(codigoWidget: string, kpiIndex: number = 0): Observable<any> {
        const codigo = (codigoWidget || '').trim().toUpperCase();

        return this.telemetriaFiltrada$.pipe(
            map((telemetria) => {
                const idx = kpiIndex % this.kpisBaseGNL.length;
                const kpiBase =
                    this.kpisBaseGNL.find((k) => k.codigo === codigo) ||
                    this.kpisBaseGNL[idx];

                if (!telemetria) return { ...kpiBase };

                switch (idx) {
                    case 1: // Caudal / Flujo (flow_rate)
                        return {
                            ...kpiBase,
                            valor: `${telemetria.flujo_m3.toFixed(2)} m³/h`,
                            subtitulo: `Segmento: ${telemetria.codigo_segmento} · Bomba ${Math.round(telemetria.pump_speed)} RPM`
                        };
                    case 2: // Presión (pressure)
                        return {
                            ...kpiBase,
                            valor: `${telemetria.presion_psi.toFixed(1)} PSI`,
                            subtitulo: `Segmento: ${telemetria.codigo_segmento} · Válvula Est. ${telemetria.valve_status}`
                        };
                    case 3: // Temperatura (temperature)
                        return {
                            ...kpiBase,
                            valor: `${telemetria.temp_ducto.toFixed(1)} °C`,
                            subtitulo: `Compresor: ${telemetria.compressor_state === 1 ? 'ACTIVO' : 'INACTIVO'}`
                        };
                    case 4: // Energía (energy_consumption)
                        return {
                            ...kpiBase,
                            valor: `${telemetria.energy_consumption.toFixed(1)} kWh`,
                            subtitulo: `Consumo instantáneo (${telemetria.codigo_segmento})`
                        };
                    case 5: // Alertas SCADA (alarm_triggered + event_type)
                        return {
                            ...kpiBase,
                            valor: String(telemetria['alarmas_activas_count'] ?? telemetria.alarm_triggered ?? 0),
                            subtitulo:
                                telemetria.event_type && telemetria.event_type !== 'normal'
                                    ? `Evento: ${telemetria.event_type.toUpperCase()}`
                                    : 'Sistemas operando normal',
                            colorBorde:
                                telemetria.alarm_triggered === 1 ? 'borde-rojo' : 'borde-purple'
                        };
                    default:
                        return { ...kpiBase };
                }
            })
        );
    }
}
