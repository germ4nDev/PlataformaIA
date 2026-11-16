/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Tipos de pestaña › gestión (CC-203; regla 19)
    Description: código (no cambia al editar), estrategia del motor de tableros (una por tipo), descripción y estado. Se envía el registro
    completo armado por el núcleo (camposDeTipo); el API dice si la estrategia ya es de otro tipo o si el tipo tiene pestañas activas.
*/
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { PtlPestanasAdminService } from 'src/app/theme/shared/service/ptlpestanas-admin.service';
import { PtllogActividadesService } from 'src/app/theme/shared/service/ptllog-actividades.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { ESTRATEGIAS, TipoPestana, camposDeTipo, faltantesTipo } from '../../nucleo';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

@Component({
    selector: 'app-gestion-tipo-pestana',
    imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective, TextEditorComponent],
    templateUrl: './gestion-tipo-pestana.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './gestion-tipo-pestana.component.scss'
})
export class GestionTipoPestanaComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems!: Observable<NavigationItem[]>;
    modoEdicion = false;
    enviado = false;
    guardando = false;
    tipoEditorTexto = 'basica';
    readonly estrategias = ESTRATEGIAS;
    tipo: TipoPestana = { codigoTipo: '', estrategia: '', descripcion: null, estado: true };

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly navegacion: NavigationService,
        private readonly avisos: SwalAlertService,
        private readonly pestanas: PtlPestanasAdminService,
        private readonly logs: PtllogActividadesService
    ) { }

    ngOnInit(): void {
        this.navegacion.getNavigationItems();
        this.menuItems = this.navegacion.menuItems$;
        const codigo = this.route.snapshot.queryParamMap.get('tipo');
        if (codigo) {
            this.modoEdicion = true;
            this.pestanas.obtenerTipo(codigo).subscribe({
                next: (t) => (this.tipo = { ...this.tipo, ...t }),
                error: () => this.avisos.getAlertError(traducir('UTILIDADES.PESTANAS.TIPOS_PESTANA.COULD_NOT_GET_TAB_TYPES'))
            });
        }
    }

    actualizarDescripcion(contenido: string): void {
        this.tipo.descripcion = contenido;
    }

    alEscribirCodigo(): void {
        this.tipo.codigoTipo = (this.tipo.codigoTipo || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    }

    guardar(): void {
        this.enviado = true;
        if (this.guardando) return;
        const datos = camposDeTipo(this.tipo);
        const faltan = faltantesTipo(datos);
        if (faltan.length) {
            this.avisos.getAlertError(`${traducir('COMMON.CHECK_FORM_SOME_REQUIRED_FIELDS_ARE')}: ${faltan.map((k) => traducir(k)).join(', ')}`);
            return;
        }
        this.guardando = true;
        const peticion = this.modoEdicion ? this.pestanas.modificarTipo(datos.codigoTipo, datos) : this.pestanas.crearTipo(datos);
        peticion.subscribe({
            next: () => {
                this.guardando = false;
                const msg = traducir(
                    this.modoEdicion ? 'UTILIDADES.PESTANAS.TIPOS_PESTANA.GESTION.TAB_TYPE_UPDATED' : 'UTILIDADES.PESTANAS.TIPOS_PESTANA.GESTION.TAB_TYPE_CREATED'
                );
                this.logs.postCrearRegistro({ codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: msg }).subscribe({ error: () => undefined });
                this.avisos.getAlertSuccess(msg);
                this.volver();
            },
            error: (e) => {
                this.guardando = false;
                const campos = (e?.error?.details || e?.error?.errores || []).map((d: any) => d.mensaje).filter(Boolean);
                this.avisos.getAlertError(
                    campos.length && e?.status === 400 ? campos.join(' ') : e?.error?.msg || traducir('UTILIDADES.PESTANAS.TIPOS_PESTANA.GESTION.COULD_NOT_SAVE_TAB_TYPE')
                );
            }
        });
    }

    volver(): void {
        this.router.navigate(['utilidades/tipos-pestana']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
