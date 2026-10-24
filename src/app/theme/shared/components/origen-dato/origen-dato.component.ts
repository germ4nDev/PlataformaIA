/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Bloque 5 de la vista ampliada (origen del dato): de dónde sale lo que se ve, si es simulado o de respaldo,
    el periodo que cubre y cuándo se actualizó. Acepta el contrato del API `origen: { fuente, simulado, esRespaldo,
    periodo, generadoEn }` completo o sus campos sueltos.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

export interface OrigenDato { fuente?: string | null; simulado?: boolean; esRespaldo?: boolean; periodo?: string | null; generadoEn?: string | Date | null; nota?: string | null }

@Component({
    selector: 'app-origen-dato-tcl',
    standalone: true,
    imports: [CommonModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="origen-dato" *ngIf="o.fuente || o.simulado || o.esRespaldo || o.periodo || o.generadoEn || o.nota">
            <i class="feather icon-info"></i>
            <span *ngIf="o.fuente">Fuente: <strong>{{ o.fuente }}</strong></span>
            <span *ngIf="o.periodo">Periodo: {{ o.periodo }}</span>
            <span *ngIf="o.generadoEn">Actualizado: {{ o.generadoEn | date: 'dd/MM HH:mm' : '-0500' }}</span>
            <span *ngIf="o.simulado" class="marca marca-simulado">Datos simulados</span>
            <span *ngIf="o.esRespaldo" class="marca marca-respaldo">Valores de respaldo</span>
            <span *ngIf="o.nota" class="nota">{{ o.nota }}</span>
        </div>
    `,
    styles: [`
        :host { display: block; }
        .origen-dato { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; padding: 8px 10px; border-top: 1px solid var(--border-color);
            font-size: 0.72rem; color: var(--widget-subtitle, var(--text-subtitle-color)); }
        .origen-dato strong { color: var(--text-color); font-weight: 600; }
        .marca { padding: 1px 8px; border-radius: 10px; font-weight: 600; }
        .marca-simulado { background: rgba(248, 148, 6, 0.15); color: #d97c05; }
        .marca-respaldo { background: rgba(189, 54, 47, 0.15); color: #bd362f; }
        .nota { font-style: italic; }
    `]
})
export class OrigenDatoTclComponent {
    @Input() origen: OrigenDato | null = null;
    @Input() fuente?: string | null;
    @Input() simulado?: boolean;
    @Input() esRespaldo?: boolean;
    @Input() periodo?: string | null;
    @Input() generadoEn?: string | Date | null;
    @Input() nota?: string | null;

    get o(): OrigenDato {
        const b = this.origen || {};
        return {
            fuente: this.fuente ?? b.fuente, simulado: this.simulado ?? b.simulado, esRespaldo: this.esRespaldo ?? b.esRespaldo,
            periodo: this.periodo ?? b.periodo, generadoEn: this.generadoEn ?? b.generadoEn, nota: this.nota ?? b.nota
        };
    }
}
