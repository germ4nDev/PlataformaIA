/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // 🟢 Importación clave para Standalone
import { HttpClient } from '@angular/common/http';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

declare global {
    interface Window { MercadoPago: any; }
}

@Component({
    selector: 'app-pago-modal',
    standalone: true, // 🟢 Declaración Standalone
    imports: [CommonModule], // 🟢 Importamos dependencias directamente aquí
    templateUrl: './pago-modal.component.html',
    styleUrls: ['./pago-modal.component.scss']
})
export class PagoModalComponent implements OnDestroy {
    mostrarModal = false;
    cargandoBrick = false;
    brickController: any;

    montoAPagar: number = 0;
    datosFacturaBase: any = {};

    @Output() onCerrar = new EventEmitter<void>();
    @Output() onPagoExitoso = new EventEmitter<any>();

    constructor(private http: HttpClient) { }

    abrirModal(monto: number, datosBase: any) {
        this.montoAPagar = monto;
        this.datosFacturaBase = datosBase;
        this.mostrarModal = true;

        setTimeout(() => {
            this.inicializarBrick();
        }, 100);
    }

    async inicializarBrick() {
        this.cargandoBrick = true;

        await loadMercadoPago();

        // ⚠️ Reemplaza con tu Llave Pública de Prueba de Mercado Pago
        const mp = new window.MercadoPago('TEST-TU-LLAVE-PUBLICA-AQUI');
        const bricksBuilder = mp.bricks();

        const settings = {
            initialization: {
                amount: this.montoAPagar,
            },
            customization: {
                visual: {
                    style: {
                        theme: 'default',
                        customVariables: {
                            formBackgroundColor: '#ffffff',
                            baseColor: '#007bff',
                            textPrimaryColor: '#333333',
                            borderRadiusFull: '8px'
                        }
                    }
                },
                paymentMethods: {
                    creditCard: 'all',
                    debitCard: 'all',
                    bankTransfer: 'all'
                }
            },
            callbacks: {
                onReady: () => {
                    this.cargandoBrick = false;
                },
                onSubmit: (formData: any) => {
                    return new Promise<void>((resolve, reject) => {
                        this.procesarPagoNode(formData)
                            .then(() => resolve())
                            .catch(() => reject());
                    });
                },
                onError: (error: any) => {
                    console.error('Error en el Brick de MP:', error);
                    Swal.fire('Aviso', 'Ocurrió un error al cargar la pasarela segura.', 'warning');
                }
            }
        };

        this.brickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
    }

    private procesarPagoNode(formData: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const nuevoCodigoHistorial = uuidv4();

            const payload = {
                facturaData: {
                    ...this.datosFacturaBase,
                    codigoHistorial: nuevoCodigoHistorial,
                    montoPagado: this.montoAPagar,
                    fechaPago: new Date().toISOString()
                },
                formData: formData
            };

            const url = `${environment.apiUrl}/facturacion/procesar-y-crear`;

            this.http.post(url, payload).subscribe({
                next: (resp: any) => {
                    Swal.fire('¡Pago Exitoso!', 'Tu transacción fue procesada y aprobada correctamente.', 'success');
                    this.onPagoExitoso.emit(resp);
                    this.cerrar();
                    resolve();
                },
                error: (err) => {
                    Swal.fire('Pago Rechazado', err.error?.msg || 'Error procesando el pago con el banco.', 'error');
                    reject();
                }
            });
        });
    }

    cerrar() {
        this.mostrarModal = false;
        if (this.brickController) {
            this.brickController.unmount();
        }
        this.onCerrar.emit();
    }

    ngOnDestroy() {
        if (this.brickController) {
            this.brickController.unmount();
        }
    }
}
