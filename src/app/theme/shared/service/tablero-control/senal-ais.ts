/*
    Author: German Valencia
    Señal AIS del puerto (OT-007, 2026-10-29): lo que devuelve el API en GET /mapa-general/naves → `senal`
    (utils/senal-ais.js). El mapa la convierte en un aviso en lugar de quedar vacío sin explicación (datos honestos).
*/
export interface SenalAis {
    estado: 'en_vivo' | 'sin_senal' | 'sin_registro';
    ultima: string | null;
    horasSinSenal: number | null;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Texto del aviso del mapa, o null cuando la señal está en vivo o no se conoce. */
export function textoSenalAis(s: SenalAis | null | undefined): string | null {
    if (!s || s.estado === 'en_vivo') return null;
    if (s.estado === 'sin_registro' || !s.ultima) {
        return 'Sin señal AIS: la fuente no ha reportado posiciones de buques en este puerto.';
    }
    const fecha = FORMATO_FECHA.format(new Date(s.ultima));
    const horas = s.horasSinSenal ?? 0;
    const hace = horas >= 48 ? `${Math.floor(horas / 24)} días` : `${horas} h`;
    return `Sin señal AIS desde el ${fecha} (hace ${hace}): la fuente no reporta posiciones en este puerto y por eso no se ven buques.`;
}
