import { TranslateModule } from '@ngx-translate/core';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil-configuracion',
  imports: [TranslateModule, RouterModule],
  templateUrl: './perfil-configuracion.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './perfil-configuracion.component.scss'
})
export class PerfilConfiguracionComponent {}
