/*
    Author: German Valencia
    Pattern: Prueba de concepto OT-034 (despliegue por aplicación con Native Federation)
    Description: Pantalla de Sistemas que vive en el remoto `sistemas-remoto` (puerto 4201) y la plataforma (4200) la carga en tiempo
    de ejecución con loadRemoteModule, sin compilarla dentro. Usa el TranslateService de la plataforma: @ngx-translate/core es
    compartido (singleton) en federation.config.mjs, así que las traducciones y el idioma son los mismos.
*/
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-poc-sistemas',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslateModule],
    templateUrl: './poc-sistemas.component.html',
    styleUrls: ['./poc-sistemas.component.scss']
})
export class PocSistemasComponent {
    private readonly translate = inject(TranslateService);
    /** Origen desde el que se descargó este componente (prueba de que viene del remoto). */
    readonly origen = new URL(import.meta.url).origin;
    readonly idioma = this.translate.currentLang || this.translate.defaultLang || '—';
    readonly cargadoEn = new Date().toLocaleString();
}
