/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Traducciones (OT-027, patrón de los módulos de administración, regla 19)
    Description:
      Lista de las llaves de los JSON de idioma (MODULO.SUBMODULO.LLAVE) con su texto en cada idioma; filtros por módulo, texto y
      «sin traducción»; crear, modificar y eliminar (las que usa el sistema no se eliminan). Si el API no tiene un idioma que trae la web,
      ofrece sembrarlo con el JSON del build. «Descargar JSON» baja el árbol del API para llevarlo al repositorio.
*/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, combineLatest, forkJoin, map, of, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { PtlTraduccionesService, FilaTraduccion } from 'src/app/theme/shared/service/ptltraducciones.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

const IDIOMAS_DEL_BUILD = ['es', 'en'];

@Component({
    selector: 'app-traducciones',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent, AppPermisoDirective],
    templateUrl: './traducciones.component.html',
    styleUrl: './traducciones.component.scss'
})
export class TraduccionesComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    activeTab: 'menu' | 'filters' = 'menu';
    menuItems!: Observable<NavigationItem[]>;

    idiomas: string[] = [];
    modulos: string[] = [];
    sinSembrar: string[] = [];
    filas: FilaTraduccion[] = [];
    columnas: ColumnMetadata[] = [];
    columnasDetail: ColumnMetadata[] = [];
    cargando = true;

    private readonly filas$ = new BehaviorSubject<FilaTraduccion[]>([]);
    readonly filtroModulo$ = new BehaviorSubject<string>('todos');
    readonly filtroTexto$ = new BehaviorSubject<string>('');
    readonly filtroSinTraduccion$ = new BehaviorSubject<boolean>(false);
    filtradas$: Observable<any[]> = of([]);

    constructor(
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly navegacion: NavigationService,
        private readonly avisos: SwalAlertService,
        private readonly traducciones: PtlTraduccionesService
    ) { }

    ngOnInit(): void {
        this.navegacion.getNavigationItems();
        this.menuItems = this.navegacion.menuItems$;
        this.filtradas$ = combineLatest([this.filas$, this.filtroModulo$, this.filtroTexto$, this.filtroSinTraduccion$]).pipe(
            map(([filas, modulo, texto, sinTraduccion]) => {
                const t = texto.trim().toLowerCase();
                return filas
                    .filter((f) => modulo === 'todos' || f.modulo === modulo)
                    .filter((f) => !t || f.llave.toLowerCase().includes(t) || Object.values(f.textos).some((x) => String(x || '').toLowerCase().includes(t)))
                    .filter((f) => !sinTraduccion || this.idiomas.some((i) => !String(f.textos[i] ?? '').trim()))
                    .map((f) => ({
                        ...f,
                        ...Object.fromEntries(this.idiomas.map((i) => [`texto_${i}`, f.textos[i] ?? '—'])),
                        nomEstado: f.protegida ? traducir('UTILIDADES.TRADUCCIONES.IN_USE') : traducir('UTILIDADES.TRADUCCIONES.UNUSED')
                    }));
            })
        );
        this.cargar();
    }

    cargar(): void {
        this.cargando = true;
        this.traducciones.listar().subscribe({
            next: (r) => {
                this.idiomas = r.idiomas;
                this.modulos = r.ramas.map((x) => x.modulo).sort();
                this.filas = r.filas;
                this.columnas = [
                    ...this.idiomas.map((i) => ({ name: `texto_${i}`, header: i.toUpperCase(), type: 'text' })),
                    { name: 'nomEstado', header: 'UTILIDADES.TRADUCCIONES.USAGE', type: 'text' }
                ] as ColumnMetadata[];
                this.columnasDetail = [
                    { name: 'llave', header: 'UTILIDADES.TRADUCCIONES.KEY', type: 'text' }
                ] as ColumnMetadata[];
                this.filas$.next(this.filas);
                this.cargando = false;
                this.revisarSembrado();
            },
            error: () => {
                this.cargando = false;
                this.avisos.getAlertError(traducir('UTILIDADES.TRADUCCIONES.COULD_NOT_GET_TRANSLATIONS'));
            }
        });
    }

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoPaquete', header: 'COMMON.CODE', type: 'text' },
        { name: 'precioPromocion', header: 'PAQUETES.PROMOTIONAL_PRICE', type: 'price' },
        { name: 'descripcionPaquete', header: 'COMMON.DESCRIPTION', type: 'text' },
        { name: 'acuerdoLicencia', header: 'PAQUETES.LICENSE_AGREEMENT', type: 'text' },
        { name: 'iconoPaquete', header: 'COMMON.ICON', type: 'avatar' },
        { name: 'imagenPaquete', header: 'COMMON.IMAGE', type: 'image' }
    ];

    /** Idiomas que trae la web y el API todavía no tiene (producción recién desplegada). */
    revisarSembrado(): void {
        const faltan = IDIOMAS_DEL_BUILD.filter((i) => !this.idiomas.includes(i));
        if (!faltan.length) { this.sinSembrar = []; return; }
        forkJoin(faltan.map((i) => this.traducciones.jsonDelBuild(i).pipe(map(() => i), catchError(() => of(''))))).subscribe((r) => {
            this.sinSembrar = r.filter(Boolean);
        });
    }

    sembrar(idioma: string): void {
        this.traducciones.jsonDelBuild(idioma).subscribe((arbol) =>
            this.traducciones.sembrar(idioma, arbol).subscribe({
                next: () => { this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.TRADUCCIONES.LANGUAGE_LOADED_INTO_API')); this.cargar(); },
                error: () => this.avisos.getAlertError(traducir('UTILIDADES.TRADUCCIONES.COULD_NOT_LOAD_LANGUAGE_INTO_API'))
            })
        );
    }

    descargar(idioma: string): void {
        this.traducciones.arbol(idioma).subscribe((arbol) => {
            const blob = new Blob([JSON.stringify(arbol, null, 4) + '\n'], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${idioma}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }

    alFiltrarModulo(e: any): void { this.filtroModulo$.next(e.target.value); }
    alFiltrarTexto(e: any): void { this.filtroTexto$.next(e.target.value || ''); }
    alFiltrarSinTraduccion(e: any): void { this.filtroSinTraduccion$.next(!!e.target.checked); }

    nueva(): void { this.router.navigate(['utilidades/gestion-traduccion']); }

    editar(llave: string): void { this.router.navigate(['utilidades/gestion-traduccion'], { queryParams: { llave } }); }

    eliminar(llave: string): void {
        const fila = this.filas.find((f) => f.llave === llave);
        if (fila?.protegida) {
            this.avisos.getAlertConfirmWarning(traducir('UTILIDADES.TRADUCCIONES.KEY_USED_BY_SYSTEM_SCREEN_OR'));
            return;
        }
        Swal.fire({
            title: this.translate.instant('UTILIDADES.TRADUCCIONES.DELETE_KEY'),
            text: this.translate.instant('UTILIDADES.TRADUCCIONES.LLAVE_WILL_BE_DELETED_IN_ALL', { llave }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('UTILIDADES.TRADUCCIONES.YES_DELETE'),
            cancelButtonText: this.translate.instant('COMMON.CANCEL')
        }).then((r) => {
            if (!r.isConfirmed) return;
            this.traducciones.eliminar(llave).subscribe({
                next: () => { this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.TRADUCCIONES.KEY_DELETED')); this.cargar(); },
                error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.TRADUCCIONES.COULD_NOT_DELETE_KEY'))
            });
        });
    }

    toggleNav(): void { this.toggleSidebar.emit(); }
}
