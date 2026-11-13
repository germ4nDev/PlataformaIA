import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nav-search',
  imports: [TranslateModule],
  templateUrl: './nav-search.component.html',
  styleUrls: ['./nav-search.component.scss']
})
export class NavSearchComponent {
  searchOn = false;
}
