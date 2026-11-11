/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Países › gestión
    Description: Código ISO 3166-1 (alfa-2, alfa-3 y numérico), nombre, moneda ISO 4217 con símbolo y decimales, indicativo telefónico, zona
    horaria IANA e idioma. Al escribir el código alfa-2 propone el nombre (Intl). El código no se cambia al editar. El API valida los formatos.
*/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
import { PtlPaisesService, Pais } from 'src/app/theme/shared/service/ptlpaises.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

@Component({
    selector: 'app-gestion-pais',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective, TextEditorComponent],
    templateUrl: './gestion-pais.component.html',
    styleUrl: './gestion-pais.component.scss'
})
export class GestionPaisComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems!: Observable<NavigationItem[]>;
    modoEdicion = false;
    enviado = false;
    guardando = false;
    tipoEditorTexto = 'basica';

    pais: Pais = {
        codigoPais: '', codigoIso3: '', codigoNumerico: '', nombrePais: '', moneda: '', simboloMoneda: '', decimalesMoneda: 2,
        indicativo: '', zonaHoraria: '', idioma: '', descripcion: '', estadoPais: true
    };
    /** Zonas IANA que conoce el navegador (para la lista de sugerencias). */
    readonly zonas: string[] = (() => { try { return (Intl as any).supportedValuesOf('timeZone') as string[]; } catch { return []; } })();

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly navegacion: NavigationService,
        private readonly avisos: SwalAlertService,
        private readonly paises: PtlPaisesService
    ) { }

    ngOnInit(): void {
        this.navegacion.getNavigationItems();
        this.menuItems = this.navegacion.menuItems$;
        const codigo = this.route.snapshot.queryParamMap.get('pais');
        if (codigo) {
            this.modoEdicion = true;
            this.paises.obtener(codigo).subscribe({
                next: (p) => (this.pais = { ...p, codigoPais: String(p.codigoPais).trim(), estadoPais: !!p.estadoPais }),
                error: () => this.avisos.getAlertError(traducir('UTILIDADES.PAISES.COULD_NOT_GET_COUNTRIES'))
            });
        }
    }

    /** Propone el nombre en español al escribir un código alfa-2 válido (si el nombre está vacío). */
    alEscribirCodigo(): void {
        this.pais.codigoPais = (this.pais.codigoPais || '').toUpperCase();
        if (/^[A-Z]{2}$/.test(this.pais.codigoPais) && !this.pais.nombrePais) {
            try { this.pais.nombrePais = new Intl.DisplayNames(['es'], { type: 'region' }).of(this.pais.codigoPais) || ''; } catch { /* sin Intl */ }
        }
    }

    get valido(): boolean {
        const p = this.pais;
        return /^[A-Z]{2}$/.test(p.codigoPais) && /^[A-Za-z]{3}$/.test(p.codigoIso3) && !!p.nombrePais?.trim() && /^[A-Za-z]{3}$/.test(p.moneda);
    }

    actualizarDescripcionSuscriptor(nuevoContenido: string): void {
        this.pais.descripcion = nuevoContenido;
        console.log('Descripción del pais actualizada:', this.pais.descripcion);
        // if (this.validationForm && this.isSubmit) {
        // }
    }

    guardar(): void {
        this.enviado = true;
        if (!this.valido || this.guardando) return;
        this.guardando = true;
        const datos = { ...this.pais, codigoIso3: this.pais.codigoIso3.toUpperCase(), moneda: this.pais.moneda.toUpperCase() };
        const peticion = this.modoEdicion ? this.paises.modificar(datos.codigoPais, datos) : this.paises.crear(datos);
        peticion.subscribe({
            next: () => {
                this.guardando = false;
                this.avisos.getAlertSuccess(traducir(this.modoEdicion ? 'UTILIDADES.PAISES.GESTION.COUNTRY_UPDATED' : 'UTILIDADES.PAISES.GESTION.COUNTRY_CREATED'));
                this.volver();
            },
            error: (e) => { this.guardando = false; this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.PAISES.GESTION.COULD_NOT_SAVE_COUNTRY')); }
        });
    }

    volver(): void { this.router.navigate(['utilidades/paises']); }

    toggleNav(): void { this.toggleSidebar.emit(); }
}
