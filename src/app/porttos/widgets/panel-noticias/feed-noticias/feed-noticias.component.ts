/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_NOT_FEED · 📰 Actualidad portuaria y logística
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroNoticias } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';


@Component({
    selector: 'app-feed-noticias',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent],
    templateUrl: './feed-noticias.component.html',
    styleUrls: ['./feed-noticias.component.scss']
})
export class FeedNoticiasComponent extends WidgetTableroBase<TableroNoticias> {
    readonly modulo: ModuloTablero = 'noticias';
    readonly tituloDefecto = '📰 Actualidad portuaria y logística';
    override readonly subtituloDefecto = 'Puertos, transporte, carreteras, comercio exterior y gremios';
    override readonly iconoDefecto = 'feather icon-file-text';
    public todas: any[] = [];
    public noticias: any[] = [];
    public categorias: Array<{ codigo: string; nombre: string; noticias: number }> = [];
    public categoria: string | null = null;
    /** Vista ampliada (2026-10-24) */
    public busqueda = '';
    public medio: string | null = null;
    public medios: string[] = [];
    public readonly mensajeVacio = 'Aún no hay noticias guardadas: el proceso de noticias corre cada 30 minutos.';
    porId = (_: number, n: any) => n.id;

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroNoticias | null): void {
        this.todas = d?.noticias || [];
        this.categorias = (d?.categorias || []).filter((c) => c.noticias > 0);
        this.medios = [...new Set(this.todas.map((n) => n.medio).filter(Boolean))].sort();
        this.aplicarFiltro();
    }
    filtrar(categoria: string | null): void {
        this.categoria = categoria;
        this.aplicarFiltro();
    }

    buscar(texto: string): void {
        this.busqueda = texto;
        this.aplicarFiltro();
    }

    elegirMedio(medio: string): void {
        this.medio = medio || null;
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        const q = this.normalizar(this.busqueda);
        this.noticias = this.todas.filter((n) =>
            (!this.categoria || n.categoria === this.categoria) &&
            (!this.isEnfoque || !this.medio || n.medio === this.medio) &&
            (!this.isEnfoque || !q || this.normalizar(`${n.titulo} ${n.resumen || ''} ${n.medio || ''}`).includes(q)));
    }

    private normalizar(v: string): string {
        return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
}
