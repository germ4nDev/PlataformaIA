/*
    Utilidades de presentación para los widgets marítimos en vivo.
*/

/** 95 → "1 h 35 min" · 3000 → "2 d 2 h" · null → "—" */
export function formatoDuracion(minutos: number | null | undefined): string {
    if (minutos == null || !Number.isFinite(minutos)) return '—';
    const m = Math.max(0, Math.round(minutos));
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h} h ${m % 60} min`;
    return `${Math.floor(h / 24)} d ${h % 24} h`;
}

/** Minutos hasta la ETA → "en 5 h" / "hace 3 h" */
export function formatoRelativo(minutos: number | null | undefined): string {
    if (minutos == null || !Number.isFinite(minutos)) return '—';
    const texto = formatoDuracion(Math.abs(minutos));
    return minutos >= 0 ? `en ${texto}` : `hace ${texto}`;
}

export type Semaforo = 'ok' | 'alerta' | 'critico';

/** Umbrales por defecto para espera en fondeo: 12 h alerta, 24 h crítico (configurables por widget). */
export const UMBRALES_FONDEO = { alertaMin: 12 * 60, criticoMin: 24 * 60 };

export function semaforo(minutos: number | null | undefined, umbrales = UMBRALES_FONDEO): Semaforo {
    if (minutos == null) return 'ok';
    if (minutos >= umbrales.criticoMin) return 'critico';
    if (minutos >= umbrales.alertaMin) return 'alerta';
    return 'ok';
}

export const CLASE_SEMAFORO: Record<Semaforo, string> = { ok: 'badge-success', alerta: 'badge-warning', critico: 'badge-danger' };

export const CLASE_SITUACION: Record<string, string> = {
    'EN PUERTO': 'badge-success',
    'EN RADAR': 'badge-info',
    'ATRASADA': 'badge-danger',
    'SIN AIS': 'badge-secondary'
};

/** Mensaje claro para el usuario según el error HTTP del API. */
export function mensajeError(error: unknown): string {
    const e = error as { status?: number; error?: { msg?: string } } | null;
    if (e?.status === 0) return 'El API no responde. Revise la conexión o que el servicio esté arriba.';
    if (e?.error?.msg) return e.error.msg;
    return 'No se pudieron cargar los datos.';
}
