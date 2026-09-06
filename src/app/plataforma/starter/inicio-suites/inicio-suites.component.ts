/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { ColorPickerModule } from 'ngx-color-picker'
import { Subscription, tap, catchError, of } from 'rxjs'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service'
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component'
import { FullScreenSliderComponent } from 'src/app/theme/shared/components/fullscreen-slider/fullscreen-slider.component'
import { ThemeService, UploadFilesService } from 'src/app/theme/shared/service'
import { NavSettings } from 'src/app/theme/shared/_helpers/models/navSettings.model'
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
@Component({
    selector: 'app-inicio-suites',
    standalone: true,
    imports: [NgbDropdownModule, RouterModule, ColorPickerModule, SharedModule, LanguageSelectorComponent, FullScreenSliderComponent],
    templateUrl: './inicio-suites.component.html',
    styleUrl: './inicio-suites.component.scss'
})
export class InicioSuitesComponent implements OnInit {
    nomAplicacion: string = ''
    app: PTLAplicacionModel = new PTLAplicacionModel()
    suitesSub?: Subscription
    suites: PTLSuiteAPModel[] = []
    suscriptor: string = ''
    suscImagenes: string = ''
    navSettings: NavSettings = new NavSettings()

    constructor(
        private router: Router,
        private _localStorageService: LocalStorageService,
        private _themeStorage: ThemeService,
        private _suitesService: PtlSuitesAPService,
        private _uploadService: UploadFilesService,
        private _permisosService: PtlPermisosService
    ) {
        this.suscImagenes = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        const suites = this._suitesService.getSuitesActuales()
        const navSetts = this._localStorageService.getObject<any>('navsettings');
        const app = navSetts.aplicacion;
        this.nomAplicacion = app.nombreAplicacion || ''
        const suits: any[] = []
        navSetts.aplicacion.modulos.forEach((item: any) => {
            if (item.codigoSuite) {
                const idx = suits.findIndex(x => x.codigoSuite == item.codigoSuite)
                if (idx == -1) {
                    const suite = suites.find(x => x.codigoSuite == item.codigoSuite) || {}
                    const imagen = suite.imagenInicio || 'no-imagen.png'
                    suite.imagenInicio = this._uploadService.getFilePath(this.suscImagenes, 'suites', imagen)
                    suits.push(suite)
                }
            }
        });

        this.suites = suits;
    }

    ingresaSuiteaplicacion(suite: PTLSuiteAPModel) {
        // const navSett = this._localStorageService.getObject<any>('navsettings');

        // const navsettings = {
        //     aplicacion: navSett.aplicacion,
        //     suite: suite,
        //     modulo: {},
        //     contexto: navSett.contexto,
        //     suscriptor: navSett.suscriptor,
        //     aplicaciones: navSett.aplicaciones
        // }
        this._permisosService.inicializarPermisosPorDefecto().subscribe({
            next: (permisosCargados) => {

                console.log('✅ Permisos listos para la aplicación. Navegando...');

                this._localStorageService.setSuiteLocalStorage(suite);
                this._themeStorage.saveThemeSettings()
                this.router.navigate([suite.rutaInicio])
            }
        });

    }
}
