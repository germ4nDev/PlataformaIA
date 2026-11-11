/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente compartido - Selector de fecha (usuario, 2026-11-10; reemplaza a <input type="date">)
    Description: Campo dd/mm/aaaa con un calendario propio que toma los colores del tema (claro u oscuro) y el idioma del usuario.
      Entradas: contexto (prefijo del id del campo, p. ej. 'listaInicio'), etiqueta (llave i18n del label, opcional), placeholder (llave),
                min / max (fecha en cualquier formato que lea leerFecha: no deja elegir fuera del rango), requerido, deshabilitado,
                limpiable (muestra «Limpiar»; por defecto true).
      Salida:   fechaCambio  → la fecha elegida como toISOString() de la medianoche UTC ('2026-01-01T00:00:00.000Z'), o null al limpiar.
      También funciona con [(ngModel)] y formularios reactivos (ControlValueAccessor): el valor es el mismo texto ISO.
*/
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Celda, Dia, aIso, igual, leerFecha, mostrar, moverMes, permitido, semanas } from './selector-fecha.util';

let siguiente = 0;

@Component({
    selector: 'app-selector-fecha',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './selector-fecha.component.html',
    styleUrl: './selector-fecha.component.scss',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorFechaComponent), multi: true }]
})
export class SelectorFechaComponent implements ControlValueAccessor, OnDestroy {
    @Input() contexto = `fecha${++siguiente}`;
    @Input() etiqueta = '';
    @Input() placeholder = 'SHARED.SELECTOR_FECHA.DD_MM_YYYY';
    @Input() requerido = false;
    @Input() deshabilitado = false;
    @Input() limpiable = true;
    @Input() set min(v: unknown) { this.minimo = leerFecha(v); }
    @Input() set max(v: unknown) { this.maximo = leerFecha(v); }
    /** Valor directo sin formulario: [valor]="lista.fechaInicio" (fechaCambio)="..." */
    @Input() set valor(v: unknown) { this.writeValue(v); }
    @Output() fechaCambio = new EventEmitter<string | null>();

    abierto = false;
    elegida: Dia | null = null;
    vista = { y: new Date().getFullYear(), m: new Date().getMonth() };
    minimo: Dia | null = null;
    maximo: Dia | null = null;
    tocado = false;
    /** Posición fija en la ventana: así ningún card con overflow lo recorta; se abre arriba si abajo no cabe. */
    posicion: { top: number; left: number } = { top: 0, left: 0 };
    private alCambiar: (v: string | null) => void = () => {};
    private alTocar: () => void = () => {};

    // scroll de cualquier contenedor (captura): el card-body de los formularios también se desplaza
    private readonly alDesplazar = (e: Event) => { if (this.abierto && !this.host.nativeElement.contains(e.target as Node)) this.abierto = false; };

    constructor(private readonly host: ElementRef<HTMLElement>, private readonly translate: TranslateService) {
        window.addEventListener('scroll', this.alDesplazar, true);
    }

    ngOnDestroy(): void { window.removeEventListener('scroll', this.alDesplazar, true); }

    get texto(): string { return mostrar(this.elegida); }
    get idioma(): string { return this.translate.currentLang || this.translate.defaultLang || 'es'; }
    get filas(): Celda[][] { return semanas(this.vista.y, this.vista.m, 1); }
    get invalido(): boolean { return this.requerido && this.tocado && !this.elegida; }

    get nombreMes(): string {
        return new Intl.DateTimeFormat(this.idioma, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(this.vista.y, this.vista.m, 1)));
    }

    /** Lunes a domingo, abreviados en el idioma del usuario (5 de enero de 2026 es lunes). */
    get diasSemana(): string[] {
        const f = new Intl.DateTimeFormat(this.idioma, { weekday: 'short', timeZone: 'UTC' });
        return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2026, 0, 5 + i))).replace('.', ''));
    }

    get meses(): string[] {
        const f = new Intl.DateTimeFormat(this.idioma, { month: 'long', timeZone: 'UTC' });
        return Array.from({ length: 12 }, (_, i) => f.format(new Date(Date.UTC(2026, i, 1))));
    }

    get anios(): number[] {
        const base = this.vista.y;
        return Array.from({ length: 21 }, (_, i) => base - 10 + i);
    }

    esHoy(c: Dia): boolean { const h = new Date(); return igual(c, { y: h.getFullYear(), m: h.getMonth(), d: h.getDate() }); }
    esElegida(c: Dia): boolean { return igual(c, this.elegida); }
    sePuede(c: Dia): boolean { return permitido(c, this.minimo, this.maximo); }

    alternar(): void {
        if (this.deshabilitado) return;
        this.abierto = !this.abierto;
        if (this.abierto) {
            const base = this.elegida || this.minimo || (() => { const h = new Date(); return { y: h.getFullYear(), m: h.getMonth(), d: h.getDate() }; })();
            this.vista = { y: base.y, m: base.m };
            this.ubicar();
        } else this.marcarTocado();
    }

    private ubicar(): void {
        const campo = this.host.nativeElement.querySelector('.campo') as HTMLElement | null;
        if (!campo) return;
        const r = campo.getBoundingClientRect();
        const alto = 340, ancho = 296;
        const abajo = window.innerHeight - r.bottom;
        const top = abajo < alto + 8 && r.top > alto + 8 ? r.top - alto - 4 : r.bottom + 4;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8));
        this.posicion = { top, left };
    }

    /** Al desplazar o cambiar el tamaño de la ventana el calendario se cierra (quedaría separado del campo). */
    @HostListener('window:resize')
    alMoverVentana(): void { if (this.abierto) this.abierto = false; }

    mover(n: number): void { this.vista = moverMes(this.vista.y, this.vista.m, n); }
    irAMes(e: Event): void { this.vista = { ...this.vista, m: Number((e.target as HTMLSelectElement).value) }; }
    irAAnio(e: Event): void { this.vista = { ...this.vista, y: Number((e.target as HTMLSelectElement).value) }; }

    elegir(c: Dia): void {
        if (!this.sePuede(c)) return;
        this.elegida = { y: c.y, m: c.m, d: c.d };
        this.emitir();
        this.abierto = false;
        this.marcarTocado();
    }

    hoy(): void { const h = new Date(); this.elegir({ y: h.getFullYear(), m: h.getMonth(), d: h.getDate() }); }

    limpiar(): void {
        this.elegida = null;
        this.emitir();
        this.abierto = false;
        this.marcarTocado();
    }

    private emitir(): void {
        const v = this.elegida ? aIso(this.elegida) : null;
        this.alCambiar(v);
        this.fechaCambio.emit(v);
    }

    private marcarTocado(): void { this.tocado = true; this.alTocar(); }

    @HostListener('document:click', ['$event'])
    alClicFuera(e: MouseEvent): void {
        if (this.abierto && !this.host.nativeElement.contains(e.target as Node)) { this.abierto = false; this.marcarTocado(); }
    }

    @HostListener('keydown.escape')
    alEscape(): void { this.abierto = false; }

    // ControlValueAccessor
    writeValue(v: unknown): void {
        this.elegida = leerFecha(v);
        if (this.elegida) this.vista = { y: this.elegida.y, m: this.elegida.m };
    }
    registerOnChange(fn: (v: string | null) => void): void { this.alCambiar = fn; }
    registerOnTouched(fn: () => void): void { this.alTocar = fn; }
    setDisabledState(d: boolean): void { this.deshabilitado = d; }
}
