import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'kpiFormat',
    standalone: true
})
export class KpiFormatPipe implements PipeTransform {
    transform(value: any, decimales: number = 1): string | number {
        // Si viene nulo o indefinido, devolvemos un 0
        if (value === null || value === undefined) return '0';

        // Si es un string que ya tiene letras (ej: "72%"), lo devolvemos tal cual
        if (typeof value === 'string' && /[a-zA-Z%]/.test(value)) {
            return value;
        }

        // Convertimos a número, limpiando posibles puntos de miles que vengan en el string
        let num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : Number(value);

        // Si después de todo no es un número válido, devolvemos el valor original
        if (isNaN(num)) return value;

        // Formateo para Millones (M)
        if (num >= 1000000) {
            return (num / 1000000).toFixed(decimales).replace(/\.0$/, '') + 'M';
        }
        // Formateo para Miles (K) - Opcional: puedes subir el límite si quieres que 2,200 siga normal y empiece en 10k
        else if (num >= 1000) {
            return (num / 1000).toFixed(decimales).replace(/\.0$/, '') + 'K';
        }

        // Si es menor a 1000, lo devolvemos tal cual
        return num.toString();
    }
}
