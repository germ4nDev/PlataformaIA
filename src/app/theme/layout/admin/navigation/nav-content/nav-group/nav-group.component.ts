import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NavigationItem } from '../../../../../shared/_helpers/models/Navigation.model';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nav-group',
  imports: [TranslateModule],
  templateUrl: './nav-group.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./nav-group.component.scss']
})
export class NavGroupComponent {
  @Input() item!: NavigationItem;

  constructor() {}
}
