/*
    Author: German Valencia
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy } from '@angular/core';
import { ThemeService } from './theme.service';
import Swal, { SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';
import { Observable, Subscription, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class SwalAlertService implements OnDestroy {
    private isDarkTheme: boolean = false;
    private themeSub: Subscription;

    // ========================================================================
    // 🟢 CONFIGURACIÓN BASE PARA TOASTS (Notificaciones no bloqueantes)
    // ========================================================================
    private Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    constructor(
        private themeService: ThemeService,
        private translate: TranslateService
    ) {
        this.themeSub = this.themeService.isDarkTheme$.subscribe((isDark) => {
            this.isDarkTheme = isDark;
        });
    }

    ngOnDestroy(): void {
        this.themeSub.unsubscribe();
    }

    private getSwalCustomClass() {
        if (!this.isDarkTheme) {
            return {
                container: 'swal2-light-theme-container',
                popup: 'custom-popup-class swal2-light-mode-custom',
                confirmButton: 'btn btn-NuevoRegistro',
                denyButton: 'btn btn-secondary btn-secondary',
                cancelButton: 'btn btn-NuevoRegistro',
                input: 'form-input',
                validationMessage: 'bg-transparent text-danger',
                title: 'titulo-panel',
                htmlContainer: 'text-muted fs-6'
            };
        } else {
            return {
                container: 'swal2-dark-theme-container',
                popup: 'custom-popup-class swal2-dark-mode-custom',
                confirmButton: 'btn btn-NuevoRegistro',
                cancelButton: 'btn btn-NuevoRegistro',
                denyButton: 'btn btn-secondary btn-secondary',
                input: 'form-input',
                validationMessage: 'bg-transparent text-danger',
                title: 'titulo-panel',
                htmlContainer: 'text-muted fs-6'
            };
        }
    }

    private fireSwal(options: SweetAlertOptions) {
        return Swal.fire({
            position: 'center',
            showConfirmButton: true,
            customClass: this.getSwalCustomClass(),
            buttonsStyling: false,
            target: 'body',
            ...options
        });
    }

    // ==========================================
    // MÉTODOS PARA TOASTS (Notificaciones sutiles)
    // ==========================================
    getToastSuccess(titulo: string, timer: number = 3500): void {
        this.Toast.fire({
            icon: 'success',
            title: titulo,
            timer: timer,
            customClass: { popup: this.isDarkTheme ? 'swal2-dark-mode-custom' : '' }
        });
    }

    getToastInfo(titulo: string, timer: number = 3500): void {
        this.Toast.fire({
            icon: 'info',
            title: titulo,
            timer: timer,
            customClass: { popup: this.isDarkTheme ? 'swal2-dark-mode-custom' : '' }
        });
    }

    getToastWarning(titulo: string, timer: number = 3500): void {
        this.Toast.fire({
            icon: 'warning',
            title: titulo,
            timer: timer,
            customClass: { popup: this.isDarkTheme ? 'swal2-dark-mode-custom' : '' }
        });
    }

    getToastError(titulo: string, timer: number = 3500): void {
        this.Toast.fire({
            icon: 'error',
            title: titulo,
            timer: timer,
            customClass: { popup: this.isDarkTheme ? 'swal2-dark-mode-custom' : '' }
        });
    }

    // ==========================================
    // ALERTAS BÁSICAS SIN TIMER
    // ==========================================
    getAlertConfirmError(descripcion: string) {
        this.fireSwal({
            icon: 'error',
            title: 'Error',
            text: descripcion,
        });
    }

    getAlertConfirmSuccess(descripcion: string) {
        this.fireSwal({
            icon: 'success',
            title: 'Éxito',
            text: descripcion,
        });
    }

    // ==========================================
    // ALERTAS CON LISTADOS HTML
    // ==========================================
    getAlertConfirmWarning(descripcion: string) {
        const listadoIncidencias = descripcion
            .split('\n')
            .map((incidencia) => `<li>${incidencia}</li>`)
            .join('');

        this.fireSwal({
            icon: 'warning',
            title: 'Advertencia',
            html: `<ul style="list-style-type: disc; margin: 0; padding-left: 20px; text-align: left;">${listadoIncidencias}</ul>`,
        });
    }

    getAlertConfirmWithTextarea(
        titulo: string,
        htmlBody: string,
        inputPlaceholder: string,
        confirmText: string,
        cancelText: string,
        errorobs: string
    ): Promise<any> {
        return this.fireSwal({
            title: titulo,
            html: htmlBody,
            icon: 'warning',
            input: 'textarea',
            inputPlaceholder: inputPlaceholder,
            inputAttributes: {
                'aria-label': inputPlaceholder
            },
            showCancelButton: true,
            reverseButtons: true,
            buttonsStyling: false,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return errorobs;
                }
                return null;
            }
        });
    }

    // ==========================================
    // ALERTAS CON TIMER (Se cierran solas)
    // ==========================================
    private fireSwalWithTimer(icon: SweetAlertIcon, title: string, text: string) {
        this.fireSwal({
            icon,
            title,
            text,
            timer: 9000,
            timerProgressBar: true
        });
    }

    getAlertError(descripcion: string) {
        this.fireSwalWithTimer('error', 'Error', descripcion);
    }

    getAlertSuccess(descripcion: string) {
        this.fireSwalWithTimer('success', 'Éxito', descripcion);
    }

    getAlertInfo(descripcion: string) {
        this.fireSwalWithTimer('info', 'Información', descripcion);
    }

    getAlertWarning(descripcion: string) {
        this.fireSwalWithTimer('warning', 'Advertencia', descripcion);
    }

    getAlertQuestion(descripcion: string) {
        this.fireSwalWithTimer('question', 'Pregunta', descripcion);
    }

    // ==========================================
    // PROCESOS REACTIVOS Y DE ESPERA
    // ==========================================
    getAlertQuestionRequest(
        descripcion: string,
        title?: string,
        confirmButtonText?: string,
        cancelButtonText?: string
    ): Observable<boolean> {
        const finalTitle = title || this.translate.instant('USUARIOS.USUARIOS.ELIMINARTITULO');
        const finalConfirm = confirmButtonText || this.translate.instant('PLATAFORMA.ACEPTAR');
        const finalCancel = cancelButtonText || this.translate.instant('PLATAFORMA.CANCEL');

        return from(
            this.fireSwal({
                title: finalTitle,
                text: descripcion,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: finalConfirm,
                cancelButtonText: finalCancel,
                reverseButtons: true
            })
        ).pipe(
            map(result => result.isConfirmed)
        );
    }

    showLoading(title: string, text: string = 'Procesando...'): void {
        this.fireSwal({
            title,
            text,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    close(): void {
        Swal.close();
    }
}
