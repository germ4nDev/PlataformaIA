import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';
import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { PTLSuscriptoresService, NavigationService, LocalStorageService, UploadFilesService, PTLUsuariosService, PtlusuariosScService, PTLPaquetesService, PTLPaquetesSCService, PTLHistorialFacturacionService, PtllogActividadesService, SwalAlertService } from 'src/app/theme/shared/service';
import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
import { PTLTiposPaqueteService } from 'src/app/theme/shared/service/ptltipos-paquete.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-gestion-paquete-suscriptor',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent],
    templateUrl: './gestion-paquete-suscriptor.component.html',
    styleUrl: './gestion-paquete-suscriptor.component.scss'
})
export class GestionPaqueteSuscriptorComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    FormRegistro: PTLPaquetesSCModel = new PTLPaquetesSCModel();
    isSubmit: boolean;
    suscriptor: string = '';
    paqueteSuscriptor: string = '';
    tipoEditorTexto = 'basica';

    classList!: { toggle: (arg0: string) => void };
    menuItems!: Observable<NavigationItem[]>;
    gradientConfig: any;
    windowWidth: number = 0;
    form: undefined;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';

    paquetes: PTLPaqueteModel[] = [];
    paquetesSusc: PTLPaquetesSCModel[] = [];
    tiposPaquete: PTLTipoPaqueteModel[] = [];
    tiposPago: PTLTipoPagoModel[] = [];
    paquetesSC: PTLPaquetesSCModel[] = [];
    historiales: PTLHistorialFacturacionModel[] = [];


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _paquetesService: PTLPaquetesService,
        private _tiposPaqueteService: PTLTiposPaqueteService,
        private _tiposPagoService: PTLTiposPagoService,
        private _paquetesSCService: PTLPaquetesSCService,
        private _historialFacturacionService: PTLHistorialFacturacionService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService
    ) {
        this.isSubmit = false;
        this.suscriptor = this._localStorageService.getObject<string>('regId') || ''
        this.paqueteSuscriptor = this._localStorageService.getObject<string>('paqId') || ''
        console.log('codigo suscriptor', this.suscriptor);
        console.log('codigo paquete suscriptor', this.paqueteSuscriptor);

        // this.route.queryParams.subscribe((params) => {
        //     const id = params['regId'];
        //     console.log('me llena el Id', id);
        //     if (id != 'nuevo') {
        //         this.modoEdicion = true;
        //         this.verificarHabilitado = false;
        //         // this._suscriptoresService.getSuscriptorById(id).subscribe({
        //         //     next: (resp: any) => {
        //         //         this.FormRegistro = resp.suscriptor;
        //         //         this.dataSuscriptor = resp.suscriptor;

        //         //         const pqtsSuscriptor = this.paquetesSC.filter(x => x.codigoSuscriptor == this.dataSuscriptor.codigoSuscriptor);


        //         //         this.userPhotoUrl = resp.suscriptor.logoSuscriptor;
        //         //         this.selectedFileUrl = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', resp.suscriptor.logoSuscriptor)

        //         //         console.log('respuesta componente', this.FormRegistro);
        //         //         console.log('paquetes SC', this.paquetesSC);
        //         //     },
        //         //     error: () => {
        //         //         Swal.fire('Error', 'No se pudo obtener el suscriptor', 'error');
        //         //     }
        //         // });
        //         this._suscriptoresService.getSuscriptorById(id).subscribe({
        //             next: (resp: any) => {
        //                 this.FormRegistro = resp.suscriptor;
        //                 this.dataSuscriptor = resp.suscriptor;

        //                 const pqtsSuscriptor = this.paquetesSC.filter(x => x.codigoSuscriptor == this.dataSuscriptor.codigoSuscriptor);

        //                 this.paquetes.forEach(paqueteGlobal => {
        //                     const tieneElPaquete = pqtsSuscriptor.some(miPqt => miPqt.codigoPaquete === paqueteGlobal.codigoPaquete);
        //                     paqueteGlobal.checked = tieneElPaquete;
        //                 });

        //                 this.paquetesSC = pqtsSuscriptor;
        //                 this.userPhotoUrl = resp.suscriptor.logoSuscriptor;
        //                 this.selectedFileUrl = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', resp.suscriptor.logoSuscriptor)

        //                 console.log('respuesta componente', this.FormRegistro);
        //                 console.log('paquetes SC del suscriptor', pqtsSuscriptor);
        //                 console.log('paquetes globales listos para HTML', this.paquetes);
        //             },
        //             error: () => {
        //                 Swal.fire('Error', 'No se pudo obtener el suscriptor', 'error');
        //             }
        //         });
        //     } else {
        //         this.verificarHabilitado = true;
        //         this.modoEdicion = false;
        //         this.FormRegistro.codigoSuscriptor = uuidv4();
        //         this.paquetes.forEach(p => p.checked = false);
        //     }
        // });
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro);
                this.isLocked = true;
                this.lockMessage = message;
            },
            error: (err) => console.error('Error al suscribirse al evento de bloqueo:', err)
        });
        const form = this._localStorageService.getFormRegistro();
        if (form != undefined) {
            this.FormRegistro = form;
            this._localStorageService.removeFormRegistro();
            this.FormRegistro.codigoSuscriptorPaquete = uuidv4()
            this.FormRegistro.codigoSuscriptor = this.suscriptor
            this.FormRegistro.codigoLicencia = ''
            this.FormRegistro.codigoTipoPaquete = ''
            this.FormRegistro.codigoPaquete = ''
            this.FormRegistro.tipoPago = ''
        }
        this.paquetes = this._paquetesService.getPaquetesActuales();
        this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
        this.paquetesSusc = this.paquetesSC.filter(x => x.codigoSuscriptor == this.suscriptor)

        this.historiales = this._historialFacturacionService.getHistorialesActuales();
        this.tiposPaquete = this._tiposPaqueteService.getTiposPaqueteActuales();
        this.tiposPago = this._tiposPagoService.getTiposPagoActuales();
    }

    onPaqueteChangeClick(event: any) {
        const pqtIx = this.paquetesSusc.findIndex(x => x.codigoPaquete == event.target.value && x.codigoSuscriptor == this.suscriptor)
        console.log('traer datos de paquete', event.target.value);
        console.log('indice paquete', pqtIx);
        if (pqtIx == -1) {
            console.log('traer datos de paquete', event.target.value);
            const paquete = this.paquetes.find(x => x.codigoPaquete == event.target.value);
            this.FormRegistro.codigoLicencia = uuidv4()
            this.FormRegistro.descripcionPaquete = paquete?.descripcionPaquete
            this.FormRegistro.precioPaquete = paquete?.precioPaquete || 0
            console.log('datos del paquete', paquete);
        } else {
            this._swalAlertService.getAlertConfirmError('El Paquete seleccionado ya esta asociado al Suscriptor')
        }
    }

    onTipoPagoChangeClick(event: any) {
        console.log('asi va el form', this.FormRegistro);
        this.FormRegistro.codigoTipoPago = event.target.value;
    }

    onTipoPaqueteChangeClick(event: any) {
        const tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete == event.target.value);

        this.FormRegistro.descuentoMeses = tipoPaquete?.descuentoMeses || 0
        this.FormRegistro.mesesCobertura = tipoPaquete?.numMeses || 0
        const precio = this.FormRegistro.precioPaquete || 0
        const numMeses = tipoPaquete?.numMeses || 0
        const desc = tipoPaquete?.descuentoMeses || 0

        const valorDescuento = (precio * desc) / 100;
        const precioFinalPorMes = precio - valorDescuento;
        const valorFactura = precioFinalPorMes * numMeses;

        this.FormRegistro.valorMes = precioFinalPorMes
        this.FormRegistro.valorPago = valorFactura

        const fechaVencimiento = new Date();
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Number(numMeses));
        const fechaVencimientoStr = fechaVencimiento.toISOString();

        this.FormRegistro.fechaProximoPagoDate = fechaVencimiento.toLocaleDateString();
        this.FormRegistro.fechaProximoPago = fechaVencimientoStr

        console.log('datos del formregistro', this.FormRegistro);
    }

    btnGestionarRegistroClick(form: any) {
        console.log('gestionar formulario paquete sc', this.FormRegistro);
        const historial = this.historiales.filter(x => x.codigoSuscriptor == this.FormRegistro.codigoSuscriptor && x.codigoPaquete == this.FormRegistro.codigoPaquete)
        const ultimHistorial = historial[historial.length - 1];
        console.log('ultimHistorial', ultimHistorial);
        let numeroCuota = 0;
        let numeroFactura = '';
        if (ultimHistorial) {
            numeroFactura = '002'
            numeroCuota = ultimHistorial.numeroCuota || 0
        } else {
            numeroFactura = '001';
            numeroCuota = 1
        }

        const objHistorial: PTLHistorialFacturacionModel = {
            codigoHistorial: uuidv4(),
            codigoSuscriptor: this.suscriptor,
            codigoLicencia: this.FormRegistro.codigoLicencia,
            codigoTipoPago: this.FormRegistro.codigoTipoPago,
            codigoPaquete: this.FormRegistro.codigoPaquete,
            fechaPago: new Date().toISOString(),
            numFactura: numeroFactura,
            numeroCuota: numeroCuota,
            montoPagado: this.FormRegistro.valorPago,
            estadoPago: true,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
            fechaCreacion: new Date().toISOString()
        }
        console.log('historial facturacion:', objHistorial);

        this._historialFacturacionService.postCrearRegistroManual(objHistorial).subscribe({
            next: (data: any) => {
                console.log('historial CREADO', data.historial);
                const dataHistorial = data.historial
                this.gestionarPaqueteSuscriptor();
            },
            error: (err) => {
                const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
            }
        });

    }

    private gestionarPaqueteSuscriptor() {
        const pqtIdx = this.paquetesSC.findIndex(x => x.codigoPaquete == this.FormRegistro.codigoPaquete);
        let numRen = 0;
        let fechaInicio = new Date().toISOString();
        if (pqtIdx == -1) {
            numRen = 1;
        } else {
            let num = this.paquetesSC[pqtIdx].numRenovaciones || 0;
            numRen = num++;
            fechaInicio = this.paquetesSC[pqtIdx].fechaInicio || new Date().toISOString();
        }

        const paqueteSuscriptor: PTLPaquetesSCModel = {
            codigoSuscriptorPaquete: uuidv4(),
            codigoSuscriptor: this.FormRegistro.codigoSuscriptor,
            codigoPaquete: this.FormRegistro.codigoPaquete,
            codigoTipoPaquete: this.FormRegistro.codigoTipoPaquete,
            codigoLicencia: this.FormRegistro.codigoLicencia,
            fechaInicio: fechaInicio,
            fechaProximoPago: this.FormRegistro.fechaProximoPago,
            fechaRenovacion: new Date().toISOString(),
            numRenovaciones: numRen,
            estadoLicencia: true,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
            fechaCreacion: new Date().toISOString()
        };

        console.log('nueva paquete', paqueteSuscriptor);
        this._paquetesSCService.postCrearRegistro(paqueteSuscriptor).subscribe({
            next: (data: any) => {
                console.log('paqueteSC CREADO', data.paqueteSC);
                this._localStorageService.setObject('regId', this.FormRegistro.codigoSuscriptor)
                this.router.navigate(['/suscriptor/paquetes-suscriptor']);
            },
            error: (err) => {
                const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
            }
        });
    }

    btnRegresarClick() {
        this._localStorageService.setObject('regId', this.FormRegistro.codigoSuscriptor)
        this.router.navigate(['/suscriptor/paquetes-suscriptor']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}


