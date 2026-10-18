// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Angular Service Pattern - GNL State & SCADA CSV Telemetry Brain
// */
// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// export interface ITelemetriaGNL {
//     id_puerto?: string;
//     codigo_segmento: string;
//     flujo_m3: number;
//     temp_ducto: number;
//     presion_psi: number;
//     valve_status: number;
//     pump_state: number;
//     pump_speed: number;
//     compressor_state: number;
//     energy_consumption: number;
//     alarm_triggered: number;
//     event_type: string;
//     timestamp: string;
//     [key: string]: any;
// }

// @Injectable({
//     providedIn: 'root'
// })
// export class GnlStateService {
//     // BehaviorSubjects: conservan el último pulso para que cualquier Smart Widget o Modal se hidrate al instante
//     public telemetriaFiltrada$ = new BehaviorSubject<ITelemetriaGNL | null>(null);
//     public brazoSeleccionado$ = new BehaviorSubject<string>('TODOS');
//     public brazosActivos$ = new BehaviorSubject<string[]>([]);

//     private puertoActual: string = 'BUENAVENTURA';
//     private brazosSet: Set<string> = new Set();
//     private ultimoEstadoBrazos: Map<string, ITelemetriaGNL> = new Map();
//     private contadorAlarmasScada: number = 0;

//     // Base oficial de los 6 KPIs de GNL
//     private readonly kpisBaseGNL = [
//         {
//             codigo: 'PTT_GNL_KPI_VOLUMEN',
//             titulo: 'VOLUMEN ALMACENADO',
//             valor: '142.5K',
//             subtitulo: '85% Ocupación · 2 Tanques',
//             colorBorde: 'borde-cyan'
//         },
//         {
//             codigo: 'PTT_GNL_KPI_DESCARGA',
//             titulo: 'CAUDAL EN DUCTO',
//             valor: '4.36 m³/h',
//             subtitulo: 'Promedio SCADA · 50 Segmentos',
//             colorBorde: 'borde-green'
//         },
//         {
//             codigo: 'PTT_GNL_KPI_INYECCION',
//             titulo: 'PRESIÓN DE LÍNEA',
//             valor: '76.2 PSI',
//             subtitulo: 'Rango operativo: 43 - 115 PSI',
//             colorBorde: 'borde-amarillo'
//         },
//         {
//             codigo: 'PTT_GNL_KPI_BOG',
//             titulo: 'TEMPERATURA DUCTO',
//             valor: '32.1 °C',
//             subtitulo: 'Monitoreo térmico en línea',
//             colorBorde: 'borde-naranja'
//         },
//         {
//             codigo: 'PTT_GNL_KPI_CALORIFICO',
//             titulo: 'CONSUMO ENERGÍA',
//             valor: '26.85 kWh',
//             subtitulo: 'Bombas y compresores activos',
//             colorBorde: 'borde-teal'
//         },
//         {
//             codigo: 'PTT_GNL_KPI_ALERTAS',
//             titulo: 'ALERTAS SCADA',
//             valor: '0',
//             subtitulo: 'Sistemas operando normal',
//             colorBorde: 'borde-purple'
//         }
//     ];

//     public reiniciarEstadoPuerto(nuevoPuerto: string): void {
//         this.puertoActual = (nuevoPuerto || 'BUENAVENTURA').trim().toUpperCase();
//         this.brazosSet.clear();
//         this.ultimoEstadoBrazos.clear();
//         this.contadorAlarmasScada = 0;
//         this.brazoSeleccionado$.next('TODOS');
//         this.brazosActivos$.next([]);
//         this.telemetriaFiltrada$.next(null);
//     }

//     /**
//      * Homologa cada registro proveniente de scada_pipeline.csv (vía Socket o API)
//      */
//     public procesarPulsoSocket(payload: any, puertoActivo: string): void {
//         if (!payload) return;

//         const puertoPayload = (payload.id_puerto || '').trim().toUpperCase();
//         const puertoEsperado = (puertoActivo || this.puertoActual || '').trim().toUpperCase();

//         if (puertoPayload && puertoEsperado && puertoPayload !== puertoEsperado) {
//             return;
//         }

//         // Homologación 1:1 entre columnas de scada_pipeline.csv y propiedades del Frontend
//         const segmento = String(
//             payload.codigo_segmento ??
//             (payload.segment_id !== undefined ? `SEG-${payload.segment_id}` : 'SEG-1')
//         );

//         const lecturaNormalizada: ITelemetriaGNL = {
//             ...payload,
//             codigo_segmento: segmento,
//             flujo_m3: Number(payload.flujo_m3 ?? payload.flow_rate ?? 0),
//             temp_ducto: Number(payload.temp_ducto ?? payload.temperature ?? 0),
//             presion_psi: Number(payload.presion_psi ?? payload.pressure ?? 0),
//             valve_status: Number(payload.valve_status ?? 1),
//             pump_state: Number(payload.pump_state ?? 1),
//             pump_speed: Number(payload.pump_speed ?? 0),
//             compressor_state: Number(payload.compressor_state ?? 1),
//             energy_consumption: Number(payload.energy_consumption ?? 0),
//             alarm_triggered: Number(payload.alarm_triggered ?? 0),
//             event_type: String(payload.event_type || 'normal'),
//             timestamp: payload.timestamp || new Date().toISOString()
//         };

//         if (lecturaNormalizada.alarm_triggered === 1) {
//             this.contadorAlarmasScada++;
//         }

//         this.brazosSet.add(segmento);
//         this.ultimoEstadoBrazos.set(segmento, lecturaNormalizada);
//         this.emitirBrazosOrdenados();

//         const filtroActual = this.brazoSeleccionado$.getValue();
//         if (filtroActual === 'TODOS') {
//             this.calcularConsolidado(lecturaNormalizada.timestamp);
//         } else if (filtroActual === segmento) {
//             this.telemetriaFiltrada$.next(lecturaNormalizada);
//         }
//     }

//     public seleccionarBrazo(brazo: string): void {
//         this.brazoSeleccionado$.next(brazo);

//         if (brazo === 'TODOS') {
//             this.calcularConsolidado();
//         } else {
//             const datosBrazo = this.ultimoEstadoBrazos.get(brazo);
//             if (datosBrazo) {
//                 this.telemetriaFiltrada$.next(datosBrazo);
//             }
//         }
//     }

//     private calcularConsolidado(timestamp?: string): void {
//         const total = this.ultimoEstadoBrazos.size;
//         if (total === 0) return;

//         let sFlujo = 0;
//         let sTemp = 0;
//         let sPresion = 0;
//         let sEnergia = 0;
//         let sPumpSpeed = 0;
//         let alarmasActivas = 0;
//         let ultimoEventoCritico = 'normal';

//         this.ultimoEstadoBrazos.forEach((d) => {
//             sFlujo += d.flujo_m3;
//             sTemp += d.temp_ducto;
//             sPresion += d.presion_psi;
//             sEnergia += d.energy_consumption;
//             sPumpSpeed += d.pump_speed;
//             if (d.alarm_triggered === 1) {
//                 alarmasActivas++;
//                 if (d.event_type && d.event_type !== 'normal') {
//                     ultimoEventoCritico = d.event_type;
//                 }
//             }
//         });

//         const consolidado: ITelemetriaGNL = {
//             codigo_segmento: 'TODOS',
//             flujo_m3: Number((sFlujo / total).toFixed(2)), // Promedio por segmento (rango 1.01 - 7.53)
//             flujo_total_m3: Number(sFlujo.toFixed(2)),      // Suma total de segmentos activos
//             temp_ducto: Number((sTemp / total).toFixed(2)),
//             presion_psi: Number((sPresion / total).toFixed(2)),
//             valve_status: 1,
//             pump_state: 1,
//             pump_speed: Number((sPumpSpeed / total).toFixed(1)),
//             compressor_state: 1,
//             energy_consumption: Number((sEnergia / total).toFixed(2)),
//             alarm_triggered: alarmasActivas > 0 ? 1 : 0,
//             alarmas_activas_count: alarmasActivas,
//             event_type: ultimoEventoCritico,
//             timestamp: timestamp || new Date().toISOString()
//         };

//         this.telemetriaFiltrada$.next(consolidado);
//     }

//     private emitirBrazosOrdenados(): void {
//         const ordenados = Array.from(this.brazosSet).sort((a, b) => {
//             const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
//             const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
//             return numA - numB;
//         });
//         this.brazosActivos$.next(ordenados);
//     }

//     /**
//      * Entrega los datos reactivos para los 6 KPIs de GNL alimentados desde scada_pipeline.csv
//      */
//     public obtenerDatosKpiGnl(codigoWidget: string, kpiIndex: number = 0): Observable<any> {
//         const codigo = (codigoWidget || '').trim().toUpperCase();

//         return this.telemetriaFiltrada$.pipe(
//             map((telemetria) => {
//                 const idx = kpiIndex % this.kpisBaseGNL.length;
//                 const kpiBase =
//                     this.kpisBaseGNL.find((k) => k.codigo === codigo) ||
//                     this.kpisBaseGNL[idx];

//                 if (!telemetria) return { ...kpiBase };

//                 switch (idx) {
//                     case 1: // Caudal / Flujo (flow_rate)
//                         return {
//                             ...kpiBase,
//                             valor: `${telemetria.flujo_m3.toFixed(2)} m³/h`,
//                             subtitulo: `Segmento: ${telemetria.codigo_segmento} · Bomba ${Math.round(telemetria.pump_speed)} RPM`
//                         };
//                     case 2: // Presión (pressure)
//                         return {
//                             ...kpiBase,
//                             valor: `${telemetria.presion_psi.toFixed(1)} PSI`,
//                             subtitulo: `Segmento: ${telemetria.codigo_segmento} · Válvula Est. ${telemetria.valve_status}`
//                         };
//                     case 3: // Temperatura (temperature)
//                         return {
//                             ...kpiBase,
//                             valor: `${telemetria.temp_ducto.toFixed(1)} °C`,
//                             subtitulo: `Compresor: ${telemetria.compressor_state === 1 ? 'ACTIVO' : 'INACTIVO'}`
//                         };
//                     case 4: // Energía (energy_consumption)
//                         return {
//                             ...kpiBase,
//                             valor: `${telemetria.energy_consumption.toFixed(1)} kWh`,
//                             subtitulo: `Consumo instantáneo (${telemetria.codigo_segmento})`
//                         };
//                     case 5: // Alertas SCADA (alarm_triggered + event_type)
//                         return {
//                             ...kpiBase,
//                             valor: String(telemetria['alarmas_activas_count'] ?? telemetria.alarm_triggered ?? 0),
//                             subtitulo:
//                                 telemetria.event_type && telemetria.event_type !== 'normal'
//                                     ? `Evento: ${telemetria.event_type.toUpperCase()}`
//                                     : 'Sistemas operando normal',
//                             colorBorde:
//                                 telemetria.alarm_triggered === 1 ? 'borde-rojo' : 'borde-purple'
//                         };
//                     default:
//                         return { ...kpiBase };
//                 }
//             })
//         );
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Reactive State Service - Telemetría SCADA GNL
    Description: Orquesta el estado de brazos de carga, filtrado desde el TcHeaderComponent
                 y consolidación de telemetría en tiempo real para Smart Widgets.
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ITelemetriaGNL {
    id_puerto?: string;
    puerto?: string;
    codigo_segmento: string;
    segmento?: string;
    brazo_id?: string;
    id_brazo?: string;
    brazo?: string;

    // Variables principales requeridas por los Smart Widgets
    flujo_m3: number;
    flujo?: number;
    flujo_m3h?: number;
    caudal_m3h?: number;
    caudal?: number;
    inyeccion_red?: number;

    temp_ducto: number;
    temperatura?: number;
    temperatura_c?: number;

    presion_psi: number;
    presion?: number;
    presion_bar?: number;

    // Variables operativas complementarias declaradas explícitamente para evitar TS4111
    bog?: number;
    bog_m3h?: number;
    bog_kg_h?: number;
    evaporacion?: number;
    volumen_almacenado?: number;
    volumen_tanque_m3?: number;
    volumen?: number;
    descarga_buque?: number;
    tasa_descarga_m3h?: number;
    descarga?: number;
    poder_calorifico?: number;
    poder_calorifico_btu?: number;
    btu_scf?: number;
    indice_wobbe?: number;
    wobbe?: number;
    metano_pct?: number;
    metano?: number;
    ch4?: number;

    // Metadatos y alertas
    timestamp: string;
    fecha_hora?: string;
    esConsolidado?: boolean;
    cantidadBrazosActivos?: number;
    brazosDetalle?: ITelemetriaGNL[];
    alertas?: any[];
    eventos?: any[];
    bitacora?: any[];

    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class GnlStateService {
    private estadoBrazos = new Map<string, ITelemetriaGNL>();
    private puertoActual: string = 'BUENAVENTURA';

    // 1. Brazo actualmente seleccionado en el Header ('TODOS' por defecto)
    private readonly _brazoSeleccionado = new BehaviorSubject<string>('TODOS');
    public readonly brazoSeleccionado$: Observable<string> = this._brazoSeleccionado.asObservable();

    // 2. Lista reactiva de brazos detectados en el puerto activo
    private readonly _brazosActivos = new BehaviorSubject<string[]>([]);
    public readonly brazosActivos$: Observable<string[]> = this._brazosActivos.asObservable();
    public readonly brazosDisponibles$: Observable<string[]> = this.brazosActivos$;

    // 3. Flujo principal de telemetría filtrada para los Smart Widgets de GNL
    private readonly _telemetriaFiltrada = new BehaviorSubject<ITelemetriaGNL | null>(null);
    public readonly telemetriaFiltrada$: Observable<ITelemetriaGNL | null> =
        this._telemetriaFiltrada.asObservable();

    constructor() { }

    public get brazoActual(): string {
        return this._brazoSeleccionado.getValue();
    }

    public get listaBrazosActual(): string[] {
        return this._brazosActivos.getValue();
    }

    public seleccionarBrazo(brazo: string): void {
        const normalizado = (brazo || 'TODOS').trim().toUpperCase();
        this._brazoSeleccionado.next(normalizado);
        this.emitirSegunFiltro();
    }

    public actualizarBrazosDisponibles(brazos: string[]): void {
        if (!Array.isArray(brazos)) return;
        const ordenados = this.ordenarCodigosBrazos(brazos);
        this._brazosActivos.next(ordenados);
    }

    public procesarPulsoSocket(pulso: any, puertoFiltro?: string): void {
        if (!pulso) return;

        if (Array.isArray(pulso)) {
            pulso.forEach((item) => this.procesarPulsoIndividual(item, puertoFiltro));
            this.actualizarListaBrazosSiCambio();
            this.emitirSegunFiltro();
            return;
        }

        if (Array.isArray(pulso.brazos) || Array.isArray(pulso.segmentos)) {
            const lista = pulso.brazos || pulso.segmentos;
            lista.forEach((item: any) =>
                this.procesarPulsoIndividual(
                    { ...pulso, ...item, puerto: item.puerto || pulso.puerto },
                    puertoFiltro
                )
            );
            this.actualizarListaBrazosSiCambio();
            this.emitirSegunFiltro();
            return;
        }

        const procesado = this.procesarPulsoIndividual(pulso, puertoFiltro);
        if (procesado) {
            this.actualizarListaBrazosSiCambio();
            this.emitirSegunFiltro();
        }
    }

    private procesarPulsoIndividual(pulso: any, puertoFiltro?: string): boolean {
        const puertoObjetivo = (puertoFiltro || this.puertoActual || 'BUENAVENTURA')
            .trim()
            .toUpperCase();
        const puertoPulso = String(pulso.id_puerto || pulso.puerto || puertoObjetivo)
            .trim()
            .toUpperCase();

        if (puertoPulso && puertoPulso !== puertoObjetivo) {
            return false;
        }

        const idBrazo = String(
            pulso.codigo_segmento ||
            pulso.brazo_id ||
            pulso.id_brazo ||
            pulso.segmento ||
            pulso.brazo ||
            'BRAZO-01'
        )
            .trim()
            .toUpperCase();

        const previo = this.estadoBrazos.get(idBrazo) || ({} as ITelemetriaGNL);

        const num = (val: any, fallback: number = 0): number => {
            const n = parseFloat(val);
            return isNaN(n) ? fallback : n;
        };

        const flujoNorm = num(
            pulso.flujo_m3 ?? pulso.flujo_m3h ?? pulso.caudal_m3h ?? pulso.flujo ?? previo.flujo_m3
        );
        const tempNorm = num(
            pulso.temp_ducto ?? pulso.temperatura_c ?? pulso.temperatura ?? previo.temp_ducto
        );
        const presionNorm = num(
            pulso.presion_psi ?? pulso.presion_bar ?? pulso.presion ?? previo.presion_psi
        );

        const registroNormalizado: ITelemetriaGNL = {
            ...previo,
            ...pulso,
            id_puerto: puertoObjetivo,
            puerto: puertoObjetivo,
            codigo_segmento: idBrazo,
            segmento: idBrazo,
            brazo_id: idBrazo,
            flujo_m3: flujoNorm,
            flujo: flujoNorm,
            flujo_m3h: flujoNorm,
            // Corregido 2026-10-17: el KPI de caudal lee caudal_m3h; por brazo no existía y marcaba 0
            caudal_m3h: flujoNorm,
            temp_ducto: tempNorm,
            temperatura: tempNorm,
            temperatura_c: tempNorm,
            presion_psi: presionNorm,
            presion: presionNorm,
            presion_bar: presionNorm,
            timestamp: pulso.timestamp || pulso.fecha_hora || new Date().toISOString()
        };

        this.estadoBrazos.set(idBrazo, registroNormalizado);
        return true;
    }

    public emitirSegunFiltro(): void {
        if (this.estadoBrazos.size === 0) {
            this._telemetriaFiltrada.next(null);
            return;
        }

        const filtro = this._brazoSeleccionado.getValue();

        if (!filtro || filtro === 'TODOS') {
            const consolidado = this.calcularConsolidado();
            this._telemetriaFiltrada.next(consolidado);
        } else {
            const datosBrazo = this.estadoBrazos.get(filtro) || null;
            this._telemetriaFiltrada.next(datosBrazo ? { ...datosBrazo } : null);
        }
    }

    private calcularConsolidado(): ITelemetriaGNL | null {
        const lecturas = Array.from(this.estadoBrazos.values());
        const totalBrazos = lecturas.length;

        if (totalBrazos === 0) return null;

        const num = (val: any): number => {
            const n = parseFloat(val);
            return isNaN(n) ? 0 : n;
        };

        const sumar = (...claves: string[]): number =>
            lecturas.reduce((acc, item) => {
                const claveEncontrada = claves.find(
                    (k) => item[k] !== undefined && item[k] !== null
                );
                return acc + (claveEncontrada ? num(item[claveEncontrada]) : 0);
            }, 0);

        const promediar = (...claves: string[]): number => {
            const suma = sumar(...claves);
            return totalBrazos > 0 ? Number((suma / totalBrazos).toFixed(2)) : 0;
        };

        const ultimaLectura = lecturas[lecturas.length - 1] || ({} as ITelemetriaGNL);

        const flujoTotal = Number(
            sumar('flujo_m3', 'flujo_m3h', 'caudal_m3h', 'flujo', 'caudal', 'inyeccion_red').toFixed(2)
        );
        const presionPromedio = promediar('presion_psi', 'presion_bar', 'presion');
        const tempPromedio = promediar('temp_ducto', 'temperatura_c', 'temperatura');
        const bogTotal = Number(sumar('bog_m3h', 'bog_kg_h', 'bog', 'evaporacion').toFixed(2));
        const volumenAlmacenado = Number(
            sumar('volumen_almacenado', 'volumen_tanque_m3', 'volumen').toFixed(2)
        );
        const descargaBuque = Number(
            sumar('descarga_buque', 'tasa_descarga_m3h', 'descarga').toFixed(2)
        );
        const poderCalorifico = promediar('poder_calorifico', 'poder_calorifico_btu', 'btu_scf');
        const indiceWobbe = promediar('indice_wobbe', 'wobbe');
        const metanoPct = promediar('metano_pct', 'metano', 'ch4');

        const alertasConsolidadas = lecturas.reduce((acc: any[], curr: ITelemetriaGNL) => {
            const arr = curr.alertas || curr.eventos || curr.bitacora || [];
            return Array.isArray(arr) ? [...acc, ...arr] : acc;
        }, []);

        return {
            ...ultimaLectura,
            esConsolidado: true,
            id_puerto: this.puertoActual,
            puerto: this.puertoActual,
            codigo_segmento: 'TODOS',
            brazo_id: 'TODOS',
            segmento: `CONSOLIDADO (${totalBrazos} BRAZOS)`,
            cantidadBrazosActivos: totalBrazos,
            brazosDetalle: lecturas,

            flujo_m3: flujoTotal,
            flujo: flujoTotal,
            flujo_m3h: flujoTotal,
            caudal_m3h: flujoTotal,

            presion_psi: presionPromedio,
            presion: presionPromedio,
            presion_bar: presionPromedio,

            temp_ducto: tempPromedio,
            temperatura: tempPromedio,
            temperatura_c: tempPromedio,

            bog: bogTotal,
            bog_m3h: bogTotal,

            volumen_almacenado: volumenAlmacenado || num(ultimaLectura.volumen_almacenado),
            descarga_buque: descargaBuque || num(ultimaLectura.descarga_buque),
            poder_calorifico: poderCalorifico || num(ultimaLectura.poder_calorifico),
            indice_wobbe: indiceWobbe || num(ultimaLectura.indice_wobbe),
            metano_pct: metanoPct || num(ultimaLectura.metano_pct),

            alertas: alertasConsolidadas.slice(0, 25),
            timestamp: new Date().toISOString()
        };
    }

    public reiniciarEstadoPuerto(nuevoPuerto?: string): void {
        if (nuevoPuerto) {
            this.puertoActual = nuevoPuerto.trim().toUpperCase();
        }
        this.estadoBrazos.clear();
        this._brazosActivos.next([]);
        this._brazoSeleccionado.next('TODOS');
        this._telemetriaFiltrada.next(null);
    }

    public limpiarEstado(): void {
        this.reiniciarEstadoPuerto();
    }

    private actualizarListaBrazosSiCambio(): void {
        const brazosEnMapa = this.ordenarCodigosBrazos(Array.from(this.estadoBrazos.keys()));
        const actuales = this._brazosActivos.getValue();

        const cambio =
            brazosEnMapa.length !== actuales.length ||
            brazosEnMapa.some((b, i) => b !== actuales[i]);

        if (cambio) {
            this._brazosActivos.next(brazosEnMapa);
        }
    }

    private ordenarCodigosBrazos(codigos: string[]): string[] {
        return Array.from(new Set(codigos.map((c) => String(c).trim().toUpperCase()))).sort(
            (a, b) => {
                const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                return numA !== numB ? numA - numB : a.localeCompare(b);
            }
        );
    }
}
