/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_TAB_MOTONAVES · 🚢 Motonaves graneleras activas
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { AvanceOperacion, ModuloTablero, TablerosPestanasService, TableroGranel } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { TablaTclComponent, ColumnaTabla } from '../../shared/tabla-tcl/tabla-tcl.component';

import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';
import { RangoTclComponent } from '../../shared/rango-tcl/rango-tcl.component';
@Component({
    selector: 'app-motonaves-granel',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent, GraficaTclComponent, RangoTclComponent],
    templateUrl: './motonaves-granel.component.html',
    styleUrls: ['./motonaves-granel.component.scss']
})
export class MotonavesGranelComponent extends WidgetTableroBase<TableroGranel> {
    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '🚢 Motonaves graneleras activas';
    override readonly subtituloDefecto = 'Operación en muelle granelero';
    override readonly iconoDefecto = 'feather icon-anchor';
    public filas: any[] = [];
    public readonly mensajeVacio = 'No hay motonaves graneleras en operación.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'motonave', titulo: 'Motonave', tipo: 'principal' },
        { campo: 'terminal', titulo: 'Terminal' },
        { campo: 'producto', titulo: 'Producto' },
        { campo: 'tmTotal', titulo: 'TM total', tipo: 'numero' },
        { campo: 'tmOperadas', titulo: 'TM operadas', tipo: 'numero' },
        { campo: 'avancePct', titulo: 'Avance', tipo: 'avance', ancho: '120px' },
        { campo: 'ritmoTmh', titulo: 'Ritmo', tipo: 'numero', unidad: 't/h' },
        { campo: 'finEstimado', titulo: 'Fin estimado', tipo: 'fecha' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'muelle', titulo: 'Muelle' },
        { campo: 'tipo', titulo: 'Tipo', tipo: 'estado' },
        { campo: 'sentido', titulo: 'Sentido' },
        { campo: 'equipos', titulo: 'Equipos asignados', tipo: 'lista' },
        { campo: 'simulado', titulo: 'Simulado', tipo: 'si-no' }
    ];
    get operando(): number { return this.filas.filter((f) => f.estado === 'OPERANDO').length; }

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.filas = (d?.motonaves || []).map((m) => ({ ...m, id: m.idOperacion }));
    }


    // ---------------------------------------------------------------- vista ampliada: avance de la motonave elegida (Fase 3)
    public seleccion: any = null;
    public horas: 24 | 72 | 168 = 24;
    public avance: AvanceOperacion | null = null;
    public seriesAvance: SerieGrafica[] = [];
    public cargandoAvance = false;
    public errorAvance: string | null = null;
    private subAvance?: Subscription;

    seleccionar(fila: any): void {
        this.seleccion = fila;
        this.cargarAvance();
    }

    cambiarHoras(h: 24 | 72 | 168): void {
        this.horas = h;
        this.cargarAvance();
    }

    private cargarAvance(): void {
        if (!this.seleccion) return;
        this.subAvance?.unsubscribe();
        this.cargandoAvance = true;
        this.errorAvance = null;
        this.subAvance = this.tableros.avanceGranel(this.puerto, this.horas, this.seleccion.idOperacion).subscribe({
            next: (a) => {
                this.avance = a;
                const ritmo = a.ritmoNecesarioTmh;
                this.seriesAvance = [
                    { label: `Operado (${a.unidad})`, data: a.valores || [], color: '#2f96b4', relleno: true },
                    ...(ritmo !== null && ritmo !== undefined && a.unidad === 't/h'
                        ? [{ label: 'Ritmo necesario para cerrar a tiempo', data: (a.valores || []).map(() => ritmo), color: '#f89406' }]
                        : [])
                ];
                this.cargandoAvance = false;
                this.cdr.detectChanges();
            },
            error: (e) => {
                this.errorAvance = e?.error?.msg || 'No se pudo consultar el avance';
                this.cargandoAvance = false;
                this.cdr.detectChanges();
            }
        });
    }
}
