/* eslint-disable @typescript-eslint/no-explicit-any */
// angular import
import { Component, OnDestroy, OnInit } from '@angular/core'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { RouterModule } from '@angular/router'
import { Router, ActivatedRoute } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { ColorPickerModule } from 'ngx-color-picker';
import { PtlactividadesRolesService, PtlActividadesService, PtlAplicacionesService, PTLRolesAPService, PtlusuariosRolesApService, PtlusuariosScService, UploadFilesService, UtilidadesService } from 'src/app/theme/shared/service';
import { Subscription } from 'rxjs';
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component';
import { environment } from 'src/environments/environment';
import { FullScreenSliderComponent } from 'src/app/theme/shared/components/fullscreen-slider/fullscreen-slider.component';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model';
import { PTLActividadModel } from 'src/app/theme/shared/_helpers/models/PTLActividades.model'
import { PTLActividadRoleModel } from 'src/app/theme/shared/_helpers/models/PTLActividadesRoles.model'
import { PTLModulosPaqueteService } from 'src/app/theme/shared/service/ptlmodulos-paquete.service'
import { PTLModuloAP } from 'src/app/theme/shared/_helpers/models/PTLModuloAP.model'
import { PTLModuloPQModel } from 'src/app/theme/shared/_helpers/models/PTLModuloPQ.model'
import { PtlmodulosApService } from '../../../theme/shared/service/ptlmodulos-ap.service';

const base_url = environment.apiUrl

@Component({
    selector: 'app-inicio-aplicaciones',
    standalone: true,
    imports: [NgbDropdownModule, RouterModule, ColorPickerModule, SharedModule, LanguageSelectorComponent, FullScreenSliderComponent],
    templateUrl: './inicio-aplicaciones.component.html',
    styleUrl: './inicio-aplicaciones.component.scss'
})
export class InicioAplicacionesComponent implements OnInit, OnDestroy {
    public appCode: string = '';
    aplicacionesSub?: Subscription;
    aplicaciones: PTLAplicacionModel[] = [];
    suscriptor: string = '';
    subscriptions = new Subscription();
    roles: PTLRoleAPModel[] = [];
    usuariosRoles: PTLUsuarioRoleAPModel[] = [];
    usuariosSC: PTLUsuarioSCModel[] = [];
    usuarioSC: PTLUsuarioSCModel = {} as PTLUsuarioSCModel;
    actividades: PTLActividadModel[] = []
    actividadesRoles: PTLActividadRoleModel[] = []
    ModulosPQ: PTLModuloPQModel[] = []
    retorno: number = 0
    modulos: PTLModuloAP[] = []

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private _aplicacionesService: PtlAplicacionesService,
        private _modulosService: PtlmodulosApService,
        private _modulosPaqueteService: PTLModulosPaqueteService,
        private _localStorageService: LocalStorageService,
        private _utilidadesService: UtilidadesService,
        private _uploadService: UploadFilesService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        console.log('no hay suscriptor suscriptor')
    }

    ngOnInit(): void {
        this._localStorageService.removeObject('navsettings');
        let aplicaciones = this._aplicacionesService.getBAplicacionesActuales()
        this.ModulosPQ = this._modulosPaqueteService.getModulosPQActuales()
        this.modulos = this._modulosService.getModulosActuales()
        let contexto = this._localStorageService.getObject<any>('contexto');
        let apps: any[] = [];
        let modsPq = this.ModulosPQ.filter(x => x.codigoPaquete == contexto.codigoPaquete);
        modsPq.forEach((item: any) => {
            if (item.codigoAplicacion) {
                const idx = apps.findIndex(x => x.codigoAplicacion == item.codigoAplicacion)
                if (idx == -1) {
                    const aplicacion = aplicaciones.find(x => x.codigoAplicacion == item.codigoAplicacion) || {}
                    const imagen = aplicacion.imagenInicio || 'no-imagen.png'
                    aplicacion.imagenInicio = this._uploadService.getFilePath(this.suscriptor, 'aplicaciones', imagen)
                    const modsApp = modsPq.filter(x => x.codigoAplicacion == item.codigoAplicacion);
                    modsApp.forEach(mod => {
                        const modData = this.modulos.find(x => x.codigoModulo == mod.codigoModulo)
                        const modSubs = this.modulos.filter(x => x.codigoPadre == mod.codigoModulo)
                        mod.modulo = modData
                        mod.submodulos = modSubs
                    });
                    aplicacion.modulos = modsApp
                    apps.push(aplicacion)
                }
            }
        });
        this._localStorageService.setObject('aplicaciones', apps);
        this.aplicaciones = apps;
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    ingresarPlataforma(app: PTLAplicacionModel) {
        //TODO Validar las aplicaciones y los roles
        const apps = this._localStorageService.getObject<any>('aplicaciones');
        const appSeleccionada = apps.find((x: { codigoAplicacion: string | undefined }) => x.codigoAplicacion == app.codigoAplicacion)
        console.log('aplicacion seleccionada', appSeleccionada);
        const navsettings = {
            aplicacion: appSeleccionada,
            sute: {},
            modulo: {}
        }
        this._localStorageService.setObject('navsettings', navsettings);
        this.router.navigate(['/starter/inicio-suites'])
    }
}
