/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Utilidad común de la vista ampliada: descarga filas como CSV (separador ';' y BOM, para que Excel en español lo
    abra con tildes y columnas bien separadas). La usan tabla-tcl y cualquier widget con detalle exportable.
*/
export interface ColumnaCsv { campo: string; titulo: string }

const celda = (v: any): string => {
    if (v === null || v === undefined) return '';
    const t = Array.isArray(v) ? v.join(', ') : v instanceof Date ? v.toISOString() : String(v);
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function filasACsv(columnas: ColumnaCsv[], filas: any[]): string {
    const encabezado = columnas.map((c) => celda(c.titulo)).join(';');
    const cuerpo = (filas || []).map((f) => columnas.map((c) => celda(f?.[c.campo])).join(';'));
    return [encabezado, ...cuerpo].join('\r\n');
}

export function exportarCsv(nombreArchivo: string, columnas: ColumnaCsv[], filas: any[]): void {
    const blob = new Blob(['﻿' + filasACsv(columnas, filas)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    a.href = url;
    a.download = `${(nombreArchivo || 'detalle').replace(/[^\w-]+/g, '_')}_${fecha}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
