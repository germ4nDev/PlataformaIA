/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class UtilidadesService {
    constructor(private translate: TranslateService) { }

    public getGUID(): string {
        return uuidv4();
    }

    public getAniosGeneral() {
        const anios = [];
        const anioActual = new Date().getFullYear();
        const anioFinal = anioActual + 3;
        const anioInicial = anioActual - 5;
        for (let index = anioInicial; index <= anioFinal; index++) {
            anios.push(index);
        }
        return anios;
    }

    public getMesesAnio() {
        const meses = [
            this.translate.instant('PLATAFORMA.ENERO'),
            this.translate.instant('PLATAFORMA.FEBRERO'),
            this.translate.instant('PLATAFORMA.MARZO'),
            this.translate.instant('PLATAFORMA.ABRIL'),
            this.translate.instant('PLATAFORMA.MAYO'),
            this.translate.instant('PLATAFORMA.JUNIO'),
            this.translate.instant('PLATAFORMA.JULIO'),
            this.translate.instant('PLATAFORMA.AGOSTO'),
            this.translate.instant('PLATAFORMA.SEPTIEMBRE'),
            this.translate.instant('PLATAFORMA.OCTUBRE'),
            this.translate.instant('PLATAFORMA.NOVIEMBRE'),
            this.translate.instant('PLATAFORMA.DICIEMBRE')
        ];
        return meses;
    }

    public getDias() {
        const dias = [];
        for (let index = 1; index <= 31; index++) {
            dias.push(index);
        }
        return dias;
    }

    public getRelacional(items: any[], itemsToCompare: any[], relationKey: string): any[] {
        const relationValuesSet = new Set(itemsToCompare.map((item) => item[relationKey]));
        const commonElements = items.filter((item) => relationValuesSet.has(item[relationKey]));
        return commonElements;
    }

    generarCadenaAleatoria(longitud: number = 10): string {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let resultado = '';
        const caracteresLength = caracteres.length;

        for (let i = 0; i < longitud; i++) {
            resultado += caracteres.charAt(Math.floor(Math.random() * caracteresLength));
        }

        return resultado;
    }

    generarClaveSegura(longitud: number = 10): string {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let resultado = '';

        // Creamos un array tipado para almacenar los números aleatorios seguros
        const valoresAleatorios = new Uint32Array(longitud);
        window.crypto.getRandomValues(valoresAleatorios);

        for (let i = 0; i < longitud; i++) {
            // Usamos el módulo (%) para seleccionar un carácter del string
            resultado += caracteres[valoresAleatorios[i] % caracteres.length];
        }

        return resultado;
    }

    formatearMoneda(valor: number | string, decimales: number = 0): string {
        // Validación de seguridad por si el backend envía null, undefined o texto
        if (valor === null || valor === undefined || isNaN(Number(valor))) {
            return '$ 0';
        }

        const monto = Number(valor);
        const formateador = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        });

        return formateador.format(monto);
    }
}
