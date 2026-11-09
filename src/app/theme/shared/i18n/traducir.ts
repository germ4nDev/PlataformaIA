/*
    Author: German Valencia
    Regla 22 (OT-025): traducción de una llave i18n fuera de las plantillas (etiquetas de chart.js, avisos, encabezados del CSV).
    Usa el mismo TranslateService de las plantillas: AppComponent lo registra al arrancar con registrarTraductor().
    Sin traductor registrado (pruebas, arranque) o sin traducción, devuelve la llave o el texto tal como llegó, igual que el pipe.
*/
export type Traductor = (llave: string, params?: Record<string, unknown>) => string;

let traductor: Traductor | null = null;

export function registrarTraductor(fn: Traductor | null): void {
    traductor = fn;
}

export function traducir(llave: string, params?: Record<string, unknown>): string {
    if (!llave || typeof llave !== 'string' || !traductor) return llave;
    const valor = traductor(llave, params);
    return typeof valor === 'string' && valor ? valor : llave;
}
