import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil-configuracion',
  imports: [TranslateModule, RouterModule],
  templateUrl: './perfil-configuracion.component.html',
  styleUrl: './perfil-configuracion.component.scss'
})
export class PerfilConfiguracionComponent {}
