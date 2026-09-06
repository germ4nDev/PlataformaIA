/* eslint-disable @typescript-eslint/no-explicit-any */
// angular import
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerModule } from 'ngx-color-picker';
import { Subscription } from 'rxjs';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { FullScreenSliderComponent } from 'src/app/theme/shared/components/fullscreen-slider/fullscreen-slider.component';
import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component';
import {
    UploadFilesService,
    LocalStorageService,
    PTLPaquetesService
} from 'src/app/theme/shared/service';
import { CurrentUserModel } from 'src/app/theme/shared/_helpers/models/CurrentUser.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';

@Component({
    selector: 'app-inicio-suscriptores',
    standalone: true,
    imports: [NgbDropdownModule, RouterModule, ColorPickerModule, SharedModule, LanguageSelectorComponent, FullScreenSliderComponent],
    templateUrl: './inicio-paquetes.component.html',
    styleUrl: './inicio-paquetes.component.scss'
})
export class InicioPaquetesComponent implements OnInit, OnDestroy {
    currentUser: CurrentUserModel = new CurrentUserModel();

    public suscCode: string = '';
    suscriptores: PTLSuscriptorModel[] = [];
    suscriptor: string = '';
    suscriptorActivo: any;
    subscriptions = new Subscription();
    paquetesSC: any[] = [];
    paquetes: PTLPaqueteModel[] = [];

    constructor(
        private _paquetesService: PTLPaquetesService,
        private _permisosService: PtlPermisosService,
        private _uploadService: UploadFilesService,
        private _localStorageService: LocalStorageService,
        private router: Router
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        this.suscriptores = [];
        this.paquetes = this._paquetesService.getPaquetesActuales();
        this.currentUser = this._localStorageService.getCurrentUserLocalStorage();
        this.suscriptorActivo = this._localStorageService.getObject<any>('suscriptor')
        this.suscriptorActivo.paquetesActivos.forEach((paquete: any) => {
            const pak = this.paquetes.find(x => x.codigoPaquete == paquete.codigoPaquete)
            const imagen = pak?.imagenPaquete || 'no_imagen.png';
            paquete.imagenPaquete = this._uploadService.getFilePath(this.suscriptor, 'paquetes', imagen)
            paquete.nombrePaquete = pak?.nombrePaquete
            paquete.descripcionPaquete = pak?.descripcionPaquete
        });
        this.paquetesSC = this.suscriptorActivo.paquetesActivos;
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    ingresarPlataforma(pak: any) {
        const current = this._localStorageService.getCurrentUserLocalStorage();

        const contexto = {
            codigoSuscriptor: this.suscriptorActivo.codigoSuscriptor,
            codigoPaquete: pak.codigoPaquete,
            codigoUsuarioSC: current.usuariosSC[0]?.codigoUsuarioSC,
            codigoEmpresaSC: current.usuariosSC[0].empresasAsignadas[0]?.codigoEmpresaSC
        };

        this._localStorageService.setObject('contexto', contexto)
        // this._permisosService.cargarPermisosUsuario(current.usuariosSC[0]?.codigoUsuarioSC)
        //     .subscribe(() => {
        //         this.router.navigate(['/starter/inicio-aplicaciones']);
        //     });
    }
}
