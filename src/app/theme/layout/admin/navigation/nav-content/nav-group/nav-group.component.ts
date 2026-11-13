import { Component, Input } from '@angular/core';
import { NavigationItem } from '../../../../../shared/_helpers/models/Navigation.model';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nav-group',
  imports: [TranslateModule],
  templateUrl: './nav-group.component.html',
  styleUrls: ['./nav-group.component.scss']
})
export class NavGroupComponent {
  @Input() item!: NavigationItem;

  constructor() {}
}
