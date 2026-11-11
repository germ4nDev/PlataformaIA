/*
    Author: German Valencia
    Núcleo puro del selector de fecha (sin Angular; probado en _pruebas/selector-fecha.test.js).
    Una fecha sin hora viaja como medianoche UTC en ISO ('2026-01-01T00:00:00.000Z'): así el día no se corre por la zona horaria
    (toISOString de la medianoche local en Colombia daría 05:00Z y, recortada mal, el día anterior en otras zonas).
*/
export interface Dia { y: number; m: number; d: number }   // m: 0-11
export interface Celda extends Dia { delMes: boolean }

const valido = (y: number, m: number, d: number): boolean => {
    const f = new Date(Date.UTC(y, m, d));
    return f.getUTCFullYear() === y && f.getUTCMonth() === m && f.getUTCDate() === d;
};

/** Acepta 'aaaa-mm-dd', ISO ('…T…Z', se toma su fecha UTC), 'dd/mm/aaaa' o Date (sus partes locales). */
export function leerFecha(v: unknown): Dia | null {
    if (v === null || v === undefined || v === '') return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : { y: v.getFullYear(), m: v.getMonth(), d: v.getDate() };
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(s);
    if (m) {
        if (s.length > 10 && /[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
            const f = new Date(s);
            if (!isNaN(f.getTime())) return { y: f.getUTCFullYear(), m: f.getUTCMonth(), d: f.getUTCDate() };
        }
        const [y, mes, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
        return valido(y, mes, d) ? { y, m: mes, d } : null;
    }
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (m) {
        const [d, mes, y] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
        return valido(y, mes, d) ? { y, m: mes, d } : null;
    }
    return null;
}

/** Medianoche UTC en ISO. */
export const aIso = (f: Dia): string => new Date(Date.UTC(f.y, f.m, f.d)).toISOString();

/** dd/mm/aaaa */
export const mostrar = (f: Dia | null): string =>
    f ? `${String(f.d).padStart(2, '0')}/${String(f.m + 1).padStart(2, '0')}/${f.y}` : '';

export const comparar = (a: Dia, b: Dia): number => (a.y - b.y) || (a.m - b.m) || (a.d - b.d);
export const igual = (a: Dia | null, b: Dia | null): boolean => !!a && !!b && comparar(a, b) === 0;

/** ¿Se puede elegir? (min y max incluidos; cualquiera puede faltar) */
export function permitido(f: Dia, min: Dia | null, max: Dia | null): boolean {
    return !(min && comparar(f, min) < 0) && !(max && comparar(f, max) > 0);
}

/** 6 semanas del mes; la semana empieza el lunes (inicio = 1) o el domingo (0). */
export function semanas(y: number, m: number, inicio = 1): Celda[][] {
    const primero = new Date(Date.UTC(y, m, 1)).getUTCDay();
    const corrimiento = (primero - inicio + 7) % 7;
    const filas: Celda[][] = [];
    for (let s = 0; s < 6; s++) {
        const fila: Celda[] = [];
        for (let i = 0; i < 7; i++) {
            const f = new Date(Date.UTC(y, m, 1 - corrimiento + s * 7 + i));
            fila.push({ y: f.getUTCFullYear(), m: f.getUTCMonth(), d: f.getUTCDate(), delMes: f.getUTCMonth() === m });
        }
        filas.push(fila);
    }
    return filas;
}

/** Suma meses al mes visible (sin depender del día). */
export function moverMes(y: number, m: number, n: number): { y: number; m: number } {
    const t = y * 12 + m + n;
    return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}
