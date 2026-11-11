/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Paquetes › Ítems por paquete › gestión (reescrito en OT-029)
    Description: Qué lleva un paquete: el ítem del catálogo (PTLItemsPaquete.codigoValor) y su cantidad. El precio ya no va aquí: lo fija
    Paquetes › Listas de precios. PTLItemsPaquete.codigoItem es el código de la fila (uuid); nombre y descripción se copian del ítem.
    Antes: el ítem elegido se sobrescribía con un uuid, la cantidad quedaba en 0 y tipoValorId llegaba como NaN (nunca se guardó una fila).
*/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin, of, catchError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { PtlItemsPaqueteService } from 'src/app/theme/shared/service/ptlitems-paquete.service';
import { PTLItemsService } from 'src/app/theme/shared/service/ptlitems.service';
import { PTLPaquetesService } from 'src/app/theme/shared/service/ptlpaquetes.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

@Component({
    selector: 'app-gestion-itempq',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective],
    templateUrl: './gestion-itempq.component.html',
    styleUrl: './gestion-itempq.component.scss'
})
export class GestionItempqComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems$!: Observable<NavigationItem[]>;
    modoEdicion = false;
    enviado = false;
    guardando = false;
    codigoFila = '';
    form = { codigoPaquete: '', codigoValor: '', cantidad: 1, estadoItem: true };
    paquetes: any[] = [];
    items: any[] = [];
    private original: any = null;

    constructor(
        private readonly router: Router,
        private readonly navegacion: NavigationService,
        private readonly almacen: LocalStorageService,
        private readonly avisos: SwalAlertService,
        private readonly itemsPaquete: PtlItemsPaqueteService,
        private readonly itemsService: PTLItemsService,
        private readonly paquetesService: PTLPaquetesService
    ) {}

    ngOnInit(): void {
        this.navegacion.getNavigationItems();
        this.menuItems$ = this.navegacion.menuItems$;
        const id = this.almacen.getObject<string>('regId') || 'nuevo';
        this.form.codigoPaquete = this.almacen.getObject<string>('regPQ') || '';
        forkJoin([
            this.paquetesService.cargarRegistros().pipe(catchError(() => of(this.paquetesService.getPaquetesActuales()))),
            this.itemsService.cargarRegistros().pipe(catchError(() => of(this.itemsService.getItemsActuales())))
        ]).subscribe(([paquetes, items]) => {
            this.paquetes = (paquetes || []).filter((p: any) => p.estadoPaquete !== false);
            this.items = (items || []).filter((i: any) => i.estadoItem !== false);
        });
        if (id !== 'nuevo') {
            this.modoEdicion = true;
            this.codigoFila = id;
            this.itemsPaquete.getRegistros().subscribe({
                next: (r: any) => {
                    const fila = (r.itemsPaquete || []).find((x: any) => x.codigoItem === id);
                    if (!fila) return;
                    this.original = fila;
                    this.form = { codigoPaquete: fila.codigoPaquete, codigoValor: fila.codigoValor, cantidad: Number(fila.cantidad) || 1, estadoItem: fila.estadoItem !== false };
                },
                error: () => this.avisos.getAlertError(traducir('PAQUETES.ITEMS_PAQUETE.GESTION.COULD_NOT_GET_PACKAGE_ITEMS'))
            });
        }
    }

    get valido(): boolean { return !!(this.form.codigoPaquete && this.form.codigoValor && Number.isInteger(Number(this.form.cantidad)) && Number(this.form.cantidad) >= 1); }

    guardar(): void {
        this.enviado = true;
        if (!this.valido || this.guardando) return;
        const item = this.items.find((i) => i.codigoItem === this.form.codigoValor) || {};
        const usuario = this.almacen.getUsuarioLocalStorage()?.codigoUsuario || '';
        const ahora = new Date().toISOString();
        const fila: any = {
            ...(this.original || {}),
            codigoItem: this.modoEdicion ? this.codigoFila : uuidv4(),
            codigoPaquete: this.form.codigoPaquete,
            codigoValor: this.form.codigoValor,
            tipoValorId: 0,
            nombreItem: item.nombreItem || this.original?.nombreItem || '',
            descripcionItem: item.descripcionItem || this.original?.descripcionItem || '',
            cantidad: Number(this.form.cantidad),
            estadoItem: !!this.form.estadoItem,
            codigoUsuarioCreacion: this.original?.codigoUsuarioCreacion || usuario,
            fechaCreacion: this.original?.fechaCreacion || ahora,
            codigoUsuarioModificacion: usuario,
            fechaModificacion: ahora
        };
        this.guardando = true;
        const peticion = this.modoEdicion ? this.itemsPaquete.putModificarRegistro(fila) : this.itemsPaquete.postCrearRegistro(fila);
        peticion.subscribe({
            next: () => {
                this.guardando = false;
                this.avisos.getAlertSuccess(traducir(this.modoEdicion ? 'COMMON.RECORD_UPDATED_SUCCESSFULLY' : 'COMMON.RECORD_INSERTED_SUCCESSFULLY'));
                this.volver();
            },
            error: (e: any) => {
                this.guardando = false;
                this.avisos.getAlertError(e?.error?.msg || traducir(this.modoEdicion ? 'COMMON.COULD_NOT_UPDATE_RECORD' : 'COMMON.COULD_NOT_INSERT_RECORD'));
            }
        });
    }

    volver(): void { this.router.navigate(['paquetes/items-paquete']); }

    toggleNav(): void { this.toggleSidebar.emit(); }
}
