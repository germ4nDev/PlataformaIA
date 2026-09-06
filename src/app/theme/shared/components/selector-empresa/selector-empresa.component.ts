import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../service/local-storage.service';
import { PtlPermisosService } from '../../service/ptlpermisos.service';

@Component({
    selector: 'app-selector-empresa',
    standalone: true,
    imports: [CommonModule, FormsModule], // Importamos FormsModule para el ngModel
    templateUrl: './selector-empresa.component.html',
    styleUrls: ['./selector-empresa.component.scss']
})
export class SelectorEmpresaComponent implements OnInit {

    public empresasDisponibles: any[] = [];
    public empresaSeleccionada: string = '';

    @Output() empresaCambiada = new EventEmitter<string>();

    constructor(
        private _localStorage: LocalStorageService,
        private _permisosService: PtlPermisosService
    ) { }

    ngOnInit(): void {
        this.cargarEmpresasDelContexto();
    }

    private cargarEmpresasDelContexto(): void {
        const currentUser = this._localStorage.getCurrentUserLocalStorage();
        const contexto = this._localStorage.getObject<any>('contexto');

        if (!currentUser || !contexto) return;

        const usuSC = currentUser.usuariosSC?.find((u: any) => u.codigoUsuarioSC === contexto.codigoUsuarioSC);

        if (usuSC) {
            const suscriptor = usuSC.suscriptores?.find((s: any) => s.codigoSuscriptor === contexto.codigoSuscriptor);

            if (suscriptor && suscriptor.empresasAsignadas) {
                this.empresasDisponibles = suscriptor.empresasAsignadas;
            }
        }

        this.empresaSeleccionada = contexto.codigoEmpresaSC || '';
    }

    public onCambioEmpresa(): void {
        const contexto = this._localStorage.getObject<any>('contexto');
        if (!contexto || !this.empresaSeleccionada) return;

        const cont = {
            codigoEmpresaSC: this.empresaSeleccionada,
            codigoUsuarioSC: contexto.codigoUsuarioSC
        }
        this._localStorage.setContextoLocalStorage(cont);

        this._permisosService.cargarPermisosUsuarioYEmpresa(contexto.codigoUsuarioSC, this.empresaSeleccionada)
            .subscribe(() => {
                console.log(`🔄 Contexto cambiado a Empresa: ${this.empresaSeleccionada}. Permisos actualizados.`);
                this.empresaCambiada.emit(this.empresaSeleccionada);
            });
    }
}
