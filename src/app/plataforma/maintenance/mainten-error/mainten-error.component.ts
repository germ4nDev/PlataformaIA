import { TranslateModule } from '@ngx-translate/core';
// angular import
import { Component } from '@angular/core';

// project import
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mainten-error',
  standalone: true,
  imports: [TranslateModule, RouterModule],
  templateUrl: './mainten-error.component.html',
  styleUrls: ['./mainten-error.component.scss']
})
export default class MaintenErrorComponent {}
