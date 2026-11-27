import { TranslateModule } from '@ngx-translate/core';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrigenDato, OrigenDatoTclComponent } from '../origen-dato/origen-dato.component';

@Component({
  selector: 'app-widget-shell',
  imports: [TranslateModule, CommonModule, OrigenDatoTclComponent],
  templateUrl: './widget-shell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./widget-shell.component.scss']
})
export class WidgetShellComponent {
  // Textos principales
  @Input() titulo: string = '';
  @Input() subtitulo: string = '';
  @Input() icono: string = '';
  @Input() tituloFooter?: string = '';
  @Input() isEnfoque: boolean = false;
  /**
   * Vista ampliada como lienzo: la vista del tablero arriba y el [detalle-enfoque] debajo. Sin lienzo (por defecto,
   * como estaba), el detalle reemplaza la vista. Si el widget no proyecta detalle, se ve lo mismo que en el tablero.
   */
  @Input() lienzo: boolean = false;
  /** CC-318 · En el lienzo, la vista del tablero crece con su contenido (una lista que debe salir completa: un solo scroll, el del cuerpo). */
  @Input() lienzoAuto: boolean = false;
  /** Origen del dato (contrato `origen` del API): se muestra al pie de la vista ampliada. */
  @Input() origen: OrigenDato | null | undefined = null;

  // Emisor para avisarle al padre que queremos maximizar
  @Output() clickEnfoque = new EventEmitter<void>();

  maximizarWidget() {
    this.clickEnfoque.emit();
  }
}
