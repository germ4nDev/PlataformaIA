import { TranslateModule } from '@ngx-translate/core';
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
    imports: [TranslateModule, CommonModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './origen-dato.component.html',
    styleUrl: './origen-dato.component.scss'
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
