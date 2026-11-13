import { TranslateModule } from '@ngx-translate/core';
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-nav-search',
  imports: [TranslateModule],
  templateUrl: './nav-search.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./nav-search.component.scss']
})
export class NavSearchComponent {
  searchOn = false;
}
