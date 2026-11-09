import { TranslateModule } from '@ngx-translate/core';
// angular import
import { Component } from '@angular/core';

// project import
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mainten-offline-ui',
  standalone: true,
  imports: [TranslateModule, RouterModule],
  templateUrl: './mainten-offline-ui.component.html',
  styleUrls: ['./mainten-offline-ui.component.scss']
})
export default class MaintenOfflineUiComponent {}
