/*
    Author: German Valencia
    Funciones puras del modo reproducir del mapa (sin MapLibre ni Angular; se pueden probar solas).
    A partir del recorrido del API (GET /api/recorrido-mapa/:puerto) arman el "fotograma" de un segundo dado:
      - naves y camiones en su posición interpolada, con las mismas propiedades que usan las capas en vivo
        (naves-individual pinta por estado_inferido y rota por rumbo; terrestre-individual pinta por estado);
      - estelas: el camino de los últimos minutos de cada objeto.
    Un hueco entre dos puntos más largo que huecoMaxSeg es "salió del radar": no se inventa el trayecto.
*/
import { rumboEntre } from './mapa-animacion';
import { EventoRecorrido, ObjetoRecorrido, PuntoRecorrido, RecorridoMapa } from 'src/app/theme/shared/service/tablero-control/recorrido-mapa.service';

export interface FotogramaRecorrido {
    naves: GeoJSON.FeatureCollection;
    camiones: GeoJSON.FeatureCollection;
    estelas: GeoJSON.FeatureCollection;
}

export const VACIO: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Velocidades de reproducción: segundos del recorrido por segundo real. */
export const VELOCIDADES_RECORRIDO = [
    { valor: 60, etiqueta: '1 min/s' },
    { valor: 300, etiqueta: '5 min/s' },
    { valor: 900, etiqueta: '15 min/s' }
];
export const VENTANAS_RECORRIDO = [6, 12, 24];

/** Índice del último punto con segundo <= seg (-1 si seg es anterior al primero). Búsqueda binaria. */
export function indicePunto(p: PuntoRecorrido[], seg: number): number {
    let lo = 0, hi = p.length - 1, r = -1;
    while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (p[m][0] <= seg) { r = m; lo = m + 1; } else hi = m - 1;
    }
    return r;
}

export interface PosicionRecorrido { lon: number; lat: number; rumbo: number | null; velocidad: number | null; iEstado: number }

/** Posición del objeto en el segundo dado, o null si en ese momento no estaba en el radar. */
export function posicionEn(o: ObjetoRecorrido, seg: number, huecoMaxSeg: number): PosicionRecorrido | null {
    const i = indicePunto(o.p, seg);
    if (i < 0) return null;
    const a = o.p[i];
    const b = o.p[i + 1];
    const silencio = huecoMaxSeg / 2.5;   // el muestreo deja al menos un punto cada "silencio" segundos
    if (!b || b[0] - a[0] > huecoMaxSeg) {
        // Último punto conocido o hueco: se muestra quieto un rato y luego desaparece
        return seg - a[0] <= silencio ? { lon: a[1], lat: a[2], rumbo: a[3], velocidad: a[4], iEstado: a[5] } : null;
    }
    const f = b[0] === a[0] ? 0 : (seg - a[0]) / (b[0] - a[0]);
    return {
        lon: a[1] + (b[1] - a[1]) * f,
        lat: a[2] + (b[2] - a[2]) * f,
        rumbo: rumboEntre(a[3], b[3], f),
        velocidad: a[4],
        iEstado: a[5]
    };
}

/** Camino reciente (puntos de los últimos estelaSeg más la posición actual), cortado en los huecos. */
function estela(o: ObjetoRecorrido, seg: number, actual: PosicionRecorrido, estelaSeg: number, huecoMaxSeg: number): number[][] {
    const coords: number[][] = [[actual.lon, actual.lat]];
    let siguiente = seg;
    for (let i = indicePunto(o.p, seg); i >= 0; i--) {
        const p = o.p[i];
        if (p[0] < seg - estelaSeg || siguiente - p[0] > huecoMaxSeg) break;
        if (p[1] !== coords[0][0] || p[2] !== coords[0][1]) coords.unshift([p[1], p[2]]);   // sin puntos repetidos
        siguiente = p[0];
    }
    return coords;
}

/** Fotograma completo del segundo dado. */
export function fotogramaRecorrido(r: RecorridoMapa, seg: number, estelaSeg = 900): FotogramaRecorrido {
    const naves: GeoJSON.Feature[] = [];
    const camiones: GeoJSON.Feature[] = [];
    const estelas: GeoJSON.Feature[] = [];
    for (const o of r.objetos) {
        const pos = posicionEn(o, seg, r.huecoMaxSeg);
        if (!pos) continue;
        const estado = pos.iEstado >= 0 ? r.estados[pos.iEstado] : null;
        const geometry: GeoJSON.Point = { type: 'Point', coordinates: [pos.lon, pos.lat] };
        if (o.tipo === 'NAVE') {
            naves.push({ type: 'Feature', geometry, properties: {
                mmsi: o.id, nombre_motonave: o.nombre || o.id, estado_inferido: estado, rumbo: pos.rumbo ?? 0,
                velocidad: pos.velocidad, recorrido: true } });
        } else {
            camiones.push({ type: 'Feature', geometry, properties: {
                placa: o.id, estado: estado || 'DETENIDO', rumbo: pos.rumbo ?? 0, recorrido: true } });
        }
        const camino = estela(o, seg, pos, estelaSeg, r.huecoMaxSeg);
        if (camino.length > 1) {
            estelas.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: camino }, properties: { tipo: o.tipo } });
        }
    }
    return {
        naves: { type: 'FeatureCollection', features: naves },
        camiones: { type: 'FeatureCollection', features: camiones },
        estelas: { type: 'FeatureCollection', features: estelas }
    };
}

/** Eventos que ocurrieron en (desdeSeg, hastaSeg]: los que la reproducción acaba de pasar. */
export function eventosEntre(r: RecorridoMapa, desdeSeg: number, hastaSeg: number): EventoRecorrido[] {
    return r.eventos.filter((e) => e.seg > desdeSeg && e.seg <= hastaSeg);
}

/** Fecha y hora (Colombia) del segundo dado del recorrido. */
export function fechaDelSegundo(r: RecorridoMapa, seg: number): Date {
    return new Date(Date.parse(r.desde) + seg * 1000);
}
