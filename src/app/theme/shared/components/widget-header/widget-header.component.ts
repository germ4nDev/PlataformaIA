import { TranslateModule } from '@ngx-translate/core';

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnfoqueWidgetService } from '../../service/tableros/enfoque-widget.service';

@Component({
  selector: 'app-widget-header',
  imports: [TranslateModule],
  templateUrl: './widget-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./widget-header.component.scss']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
  // Inputs básicos del componente
  @Input() titulo: string = '';
  @Input() subtitulo: string = '';
  @Input() icono: string = '';
  @Input() widgetId: string = '';
  @Input() data: any = null;

  // Inputs para control de diseño
  @Input() variante: 'normal' | 'kpi' = 'normal';
  @Input() mostrarEnfoque: boolean = true;

  // Input y Output para la Torre de Control
  @Input() isEnfoque: boolean = false;
  @Output() clickEnfoque = new EventEmitter<void>();

  public enModoEnfoque: boolean = false;
  private enfoquesSub!: Subscription;

  constructor(private _enfoqueService: EnfoqueWidgetService) {}

  ngOnInit() {
    this.enfoquesSub = this._enfoqueService.widgetFocus$.subscribe((widgetActivo) => {
      this.enModoEnfoque = widgetActivo !== null && widgetActivo.type === this.widgetId;
    });
  }

  toggleEnfoque() {
    // 1. Lógica para el Home
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAA widgetId', this.widgetId);

    if (this.enModoEnfoque) {
      this._enfoqueService.cerrarModoEnfoque();
    } else {
      this._enfoqueService.abrirModoEnfoque(this.widgetId, this.data);
    }

    // 2. Lógica para la Torre de Control
    this.clickEnfoque.emit();
  }

  ngOnDestroy() {
    if (this.enfoquesSub) {
      this.enfoquesSub.unsubscribe();
    }
  }
}
