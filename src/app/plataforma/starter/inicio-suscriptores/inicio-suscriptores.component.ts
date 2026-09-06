/* eslint-disable @typescript-eslint/no-explicit-any */
// angular import
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerModule } from 'ngx-color-picker';
import { Subscription } from 'rxjs';
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLUsuaioEmpresasSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioEmpresaSC.model';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { FullScreenSliderComponent } from 'src/app/theme/shared/components/fullscreen-slider/fullscreen-slider.component';
import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component';
import {
    UploadFilesService,
    LocalStorageService
} from 'src/app/theme/shared/service';
import { CurrentUserModel } from 'src/app/theme/shared/_helpers/models/CurrentUser.model';

@Component({
    selector: 'app-inicio-suscriptores',
    standalone: true,
    imports: [NgbDropdownModule, RouterModule, ColorPickerModule, SharedModule, LanguageSelectorComponent, FullScreenSliderComponent],
    templateUrl: './inicio-suscriptores.component.html',
    styleUrl: './inicio-suscriptores.component.scss'
})
export class InicioSuscriptoresComponent implements OnInit, OnDestroy {
    currentUser: CurrentUserModel = new CurrentUserModel();

    public suscCode: string = '';
    suscriptores: PTLSuscriptorModel[] = [];
    suscriptor: string = '';
    subscriptions = new Subscription();
    usuariosSC: PTLUsuarioSCModel[] = [];
    empresasSC: PTLEmpresaSCModel[] = [];
    usuariosEmpresas: PTLUsuaioEmpresasSCModel[] = [];
    usuarioSC: PTLUsuarioSCModel = {} as PTLUsuarioSCModel;
    usuarioEmpresaSC: PTLUsuaioEmpresasSCModel = {} as PTLUsuaioEmpresasSCModel;

    constructor(
        private _uploadService: UploadFilesService,
        private _localStorageService: LocalStorageService,
        private router: Router
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        console.log('no hay suscriptor suscriptor');
    }

    ngOnInit(): void {
        this.suscriptores = [];
        console.log('ingresa a la plataforma');
        this.currentUser = this._localStorageService.getCurrentUserLocalStorage();
        console.log('currentUser', this.currentUser);
        const usuariosSC = this.currentUser.usuariosSC;
        usuariosSC.forEach((user: any) => {
            user.suscriptores.forEach((susc: any) => {
                susc.logo = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', susc.logoSuscriptor)
                this.suscriptores.push(susc)
            });
        });

        console.log('suscriptores', this.suscriptores);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    ingresarPlataforma(susc: PTLSuscriptorModel) {
        const current = this._localStorageService.getCurrentUserLocalStorage();
        this._localStorageService.setObject('suscriptor', susc)
        this.router.navigate(['/starter/inicio-aplicaciones']);
    }
}
