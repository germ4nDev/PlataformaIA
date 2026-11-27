import { Pipe, PipeTransform } from '@angular/core';

/**
 * CC-316 · Número de un texto de tablero en español o inglés: «19.440,5» → 19440.5 · «1.234» y «1,234» → 1234 ·
 * «0.4295» → 0.4295 · «1234.567» → 1234.567. Un separador es de miles solo si arma grupos completos de 3 cifras.
 */
export function aNumeroKpi(texto: string): number {
    const t = String(texto ?? '').trim();
    if (/,\d{1,2}$/.test(t) || /\.\d{3}.*,\d+$/.test(t)) return parseFloat(t.replace(/\./g, '').replace(',', '.'));
    if (/^[+-]?\d{1,3}([.,]\d{3})+$/.test(t)) return parseFloat(t.replace(/[.,]/g, ''));
    if (/,\d{3}.*\.\d+$/.test(t)) return parseFloat(t.replace(/,/g, ''));
    return parseFloat(t.replace(',', '.'));
}

@Pipe({
    name: 'kpiFormat',
    standalone: true
})
export class KpiFormatPipe implements PipeTransform {
    transform(value: any, decimales: number = 1, mostrarUnidad: boolean = false): string | number {
        if (value === null || value === undefined || value === '') return '0';

        if (typeof value === 'string') {
            const texto = value.trim();

            // 1. Si es un porcentaje (ej: "80%"), lo devolvemos tal cual
            if (texto.includes('%')) {
                return texto;
            }

            // 2. Ya viene compacto desde el backend (ej: "14.5K", "1.2M", "8K"): se respeta tal cual.
            //    Corregido 2026-10-17: antes se quitaba el punto como si fuera de miles y "14.5K" salía como "145".
            if (/^[+-]?\d+(?:[.,]\d+)?\s*[KkMm]$/.test(texto)) {
                return texto.replace(/\s+/g, '').toUpperCase();
            }

            // 3. Extraemos posible unidad al final (ej: "19.440,5 Ton" -> numStr: "19.440,5", unidad: "Ton")
            const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
            if (!match) {
                return texto; // Si es un texto alfanumérico que no empieza por número, se devuelve igual
            }

            const numStr = match[1];
            const unidad = match[2] || '';

            // CC-316: el punto solo es de miles en grupos completos («19.440,5», «1.234»); «0.4295» es decimal (antes salía 4.3K)
            const num = aNumeroKpi(numStr);
            if (isNaN(num)) return value;

            const sufijoUnidad = mostrarUnidad && unidad ? ` ${unidad}` : '';
            return this.formatearMagnitud(num, decimales) + sufijoUnidad;
        }

        const num = Number(value);
        if (isNaN(num)) return value;

        return this.formatearMagnitud(num, decimales);
    }

    private formatearMagnitud(num: number, decimales: number): string {
        if (Math.abs(num) >= 1000000) {
            return (num / 1000000).toFixed(decimales).replace(/\.0$/, '') + 'M';
        }
        if (Math.abs(num) >= 1000) {
            return (num / 1000).toFixed(decimales).replace(/\.0$/, '') + 'K';
        }
        // CC-311: sin el ruido del punto flotante (14.360000000000001 → 14.36); no cambia ningún otro valor
        return String(parseFloat(num.toPrecision(12)));
    }
}
