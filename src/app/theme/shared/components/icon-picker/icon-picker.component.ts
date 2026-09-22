/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Ambas listas importadas
import { FEATHER_ICONS_LIST } from '../../constants/feather-icons.const';
import { TABLER_ICONS_LIST } from '../../constants/tabler-icons.const';

const ICON_PICKER_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => IconPickerComponent),
    multi: true
};

@Component({
    selector: 'app-icon-picker',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './icon-picker.component.html',
    styleUrl: './icon-picker.component.scss',
    providers: [ICON_PICKER_VALUE_ACCESSOR]
})
export class IconPickerComponent implements ControlValueAccessor {

    // 🟢 Unimos ambas listas para tener el catálogo definitivo
    @Input() catalogoIconos: string[] = [...FEATHER_ICONS_LIST, ...TABLER_ICONS_LIST];

    valorSeleccionado: string = '';
    isDisabled: boolean = false;
    mostrarModal: boolean = false;

    onChange = (value: string) => { };
    onTouched = () => { };

    // ==========================================
    // LÓGICA DE CLASES DINÁMICAS (Feather vs Tabler)
    // ==========================================
    obtenerClaseIcono(icono: string, clasesExtra: string = ''): string {
        if (!icono) {
            // Ícono por defecto cuando el input está vacío
            return `feather icon-more-horizontal ${clasesExtra}`.trim();
        }

        let claseBase = '';

        // Detecta si es Tabler (ej: 'ti ti-brand-aws')
        if (icono.startsWith('ti')) {
            claseBase = icono;
        }
        // Detecta si es Feather (ej: 'icon-server')
        else if (icono.startsWith('icon-')) {
            claseBase = `feather ${icono}`;
        }
        // Respaldo
        else {
            claseBase = icono;
        }

        return `${claseBase} ${clasesExtra}`.trim();
    }

    // ==========================================
    // MANEJO DEL MODAL
    // ==========================================
    abrirModal() {
        if (!this.isDisabled) {
            this.mostrarModal = true;
            document.body.classList.add('modal-open');
        }
    }

    cerrarModal() {
        this.mostrarModal = false;
        document.body.classList.remove('modal-open');
    }

    seleccionarIcono(icono: string) {
        if (this.isDisabled) return;
        this.valorSeleccionado = icono;
        this.cerrarModal();
        this.onChange(this.valorSeleccionado);
        this.onTouched();
    }

    // ==========================================
    // CONTROL VALUE ACCESSOR
    // ==========================================
    writeValue(value: any): void {
        this.valorSeleccionado = value || '';
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }
}
