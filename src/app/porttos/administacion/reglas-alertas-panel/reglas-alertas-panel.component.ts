/*
    Author: German Valencia
    Componente: Reglas de alertas del mapa (Administración)
    Activa o apaga cada regla, ajusta sus umbrales y su enfriamiento, globalmente o por puerto.
    Origen del valor: propio del puerto > global > valor por defecto del catálogo.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { NavigationService } from 'src/app/theme/shared/service';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { PuertosService } from 'src/app/theme/shared/service/tablero-control/puertos.service';
import {
    ReglasAlertasService, RespuestaReglas, ReglaCatalogo, FilaConfigAlerta
} from 'src/app/theme/shared/service/tablero-control/reglas-alertas.service';

type Origen = 'puerto' | 'global' | 'defecto';

interface FilaEdicion {
    regla: ReglaCatalogo;
    activa: boolean;
    umbrales: Array<number | null>;
    enfriamiento: number;
    origen: Origen;
    editable: boolean;
    guardando: boolean;
    modificada: string | null;
}

@Component({
    selector: 'app-reglas-alertas-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, NavContentComponent, NavBarComponent, DataLoaderComponent],
    templateUrl: './reglas-alertas-panel.component.html',
    styleUrls: ['./reglas-alertas-panel.component.scss']
})
export class ReglasAlertasPanelComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' = 'menu';

    cargando = true;
    persistencia = true;
    puerto = '*';
    puertos: Array<{ id: string; nombre: string }> = [];
    filas: FilaEdicion[] = [];

    private datos: RespuestaReglas | null = null;
    private subs = new Subscription();

    constructor(
        private _reglasService: ReglasAlertasService,
        private _puertosService: PuertosService,
        private _navigationService: NavigationService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.subs.add(this._puertosService.puertos$.subscribe((lista: any[]) => {
            this.puertos = (lista || []).map((p) => ({ id: String(p.id_puerto || p.nombre).toUpperCase(), nombre: p.nombre || p.id_puerto }));
        }));
        if (!this._puertosService.getPuertosActuales().length) this.subs.add(this._puertosService.cargarPuertos().subscribe());
        this.cargar();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    cargar(): void {
        this.cargando = true;
        this.subs.add(this._reglasService.listar().subscribe({
            next: (r) => this.aplicar(r),
            error: () => {
                this.cargando = false;
                this.toastr.error('No se pudieron leer las reglas de alertas', 'Reglas de alertas');
            }
        }));
    }

    cambiarPuerto(puerto: string): void {
        this.puerto = puerto;
        if (this.datos) this.aplicar(this.datos);
    }

    guardar(fila: FilaEdicion): void {
        const dto: FilaConfigAlerta = {
            codigo_regla: fila.regla.codigo,
            id_puerto: this.puerto,
            activa: fila.activa,
            umbral_1: fila.umbrales[0] ?? null,
            umbral_2: fila.umbrales[1] ?? null,
            umbral_3: fila.umbrales[2] ?? null,
            enfriamiento_min: Number(fila.enfriamiento)
        };
        fila.guardando = true;
        this.subs.add(this._reglasService.guardar(dto).subscribe({
            next: (r) => {
                this.toastr.success(`${fila.regla.nombre}${this.puerto === '*' ? ' (global)' : ` · ${this.puerto}`}`, 'Regla guardada');
                this.aplicar(r);
            },
            error: (e) => {
                fila.guardando = false;
                this.toastr.error(e?.error?.msg || 'No se pudo guardar la regla', fila.regla.nombre);
            }
        }));
    }

    restablecer(fila: FilaEdicion): void {
        fila.guardando = true;
        this.subs.add(this._reglasService.restablecer(fila.regla.codigo, this.puerto).subscribe({
            next: (r) => {
                this.toastr.info(`${fila.regla.nombre} vuelve a la configuración global`, 'Regla restablecida');
                this.aplicar(r);
            },
            error: (e) => {
                fila.guardando = false;
                this.toastr.error(e?.error?.msg || 'No se pudo restablecer la regla', fila.regla.nombre);
            }
        }));
    }

    etiquetaOrigen(origen: Origen): string {
        return origen === 'puerto' ? 'Propia del puerto' : origen === 'global' ? 'Global' : 'Por defecto';
    }

    trackRegla(_: number, f: FilaEdicion): string {
        return f.regla.codigo;
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    /** Arma las filas editables con el valor efectivo y su origen para el puerto elegido. */
    private aplicar(r: RespuestaReglas): void {
        this.datos = r;
        this.persistencia = r.persistencia;
        this.cargando = false;
        this.filas = r.catalogo.map((regla) => {
            const deRegla = r.filas.filter((f) => f.codigo_regla === regla.codigo);
            const global = deRegla.find((f) => f.id_puerto === '*');
            const propia = this.puerto !== '*' ? deRegla.find((f) => f.id_puerto === this.puerto) : undefined;
            const fuente = propia || global;
            const valor = (i: number): number | null => {
                const clave = `umbral_${i + 1}` as 'umbral_1' | 'umbral_2' | 'umbral_3';
                return propia?.[clave] ?? global?.[clave] ?? regla.umbrales[i]?.defecto ?? null;
            };
            return {
                regla,
                activa: propia ? propia.activa : global ? global.activa : true,
                umbrales: regla.umbrales.map((_, i) => valor(i)),
                enfriamiento: fuente?.enfriamiento_min ?? regla.enfriamientoMin,
                origen: propia ? 'puerto' : global ? 'global' : 'defecto',
                editable: this.persistencia && (this.puerto === '*' || regla.porPuerto),
                guardando: false,
                modificada: fuente?.fecha_modificacion
                    ? `${new Date(fuente.fecha_modificacion).toLocaleString()} · ${fuente.usuario_modificacion || ''}`
                    : null
            } as FilaEdicion;
        });
    }
}
