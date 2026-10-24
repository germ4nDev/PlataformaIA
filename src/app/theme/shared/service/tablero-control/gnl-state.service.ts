/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Reactive State Service - Telemetría SCADA GNL
    Description: Orquesta el estado de brazos de carga, filtrado desde el TcHeaderComponent
                 y consolidación de telemetría en tiempo real para Smart Widgets.
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

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

    /**
     * Origen del dato de la telemetría GNL (Fase 1, 2026-10-23) para el pie de la vista ampliada de los widgets.
     * Cambia solo cuando cambia si es simulada (no en cada pulso).
     */
    public readonly origen$: Observable<{ fuente: string; simulado: boolean; periodo: string; nota: string | null } | null> =
        this._telemetriaFiltrada.pipe(
            map((t: any) => (t ? !!t.simulado : null)),
            distinctUntilChanged(),
            map((simulado) => simulado === null ? null : {
                fuente: 'Telemetría SCADA por socket',
                simulado,
                periodo: 'En vivo',
                nota: simulado ? 'Lecturas de demostración: descarga, inyección, BOG, tanque y poder calorífico se derivan con fórmulas fijas' : null
            })
        );

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
        // Corregido 2026-10-23: el nivel del tanque es un porcentaje; sumarlo entre brazos daba miles de %
        const volumenAlmacenado = promediar('volumen_almacenado', 'volumen_tanque_m3', 'volumen');
        const inyeccionTotal = Number(sumar('inyeccion', 'inyeccion_red').toFixed(2));
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
        // Corregido 2026-10-23: los pulsos no traen 'alertas'; en modo TODOS el KPI de alarmas daba siempre 0.
        // Ahora cuenta los brazos con alarma activa en su último pulso.
        const brazosEnAlarma = lecturas.filter((l: any) => l.alarma_activa);
        if (!alertasConsolidadas.length) {
            brazosEnAlarma.forEach((l: any) => alertasConsolidadas.push({
                brazo: l.brazo_id || l.codigo_segmento, tipo: l.event_type || 'ALARMA', timestamp: l.timestamp
            }));
        }

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

            inyeccion: inyeccionTotal || num((ultimaLectura as any).inyeccion),
            alarma_activa: brazosEnAlarma.length > 0,
            simulado: lecturas.some((l: any) => l.simulado),
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
