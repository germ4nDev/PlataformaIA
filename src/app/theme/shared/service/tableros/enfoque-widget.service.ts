/*
    Author: German Valencia
    Pattern: PLATAFORMA Tableros - Modo enfoque de un widget (motor de tableros, núcleo; CC-178)
    Description: qué widget está en vista ampliada en el tablero que se ve. Lo usan el encabezado de los widgets y el home de la
      plataforma; las apps lo reciben por aquí (antes vivía dentro del DashboardService de Porttos, que ahora delega en este).
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WidgetEnfocado {
  type: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class EnfoqueWidgetService {
  private readonly fuente = new BehaviorSubject<WidgetEnfocado | null>(null);
  readonly widgetFocus$ = this.fuente.asObservable();

  abrirModoEnfoque(type: string, data?: any): void {
    this.fuente.next({ type, data });
  }

  cerrarModoEnfoque(): void {
    this.fuente.next(null);
  }
}
