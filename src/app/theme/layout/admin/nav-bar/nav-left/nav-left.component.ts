// Angular Import
import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';

import { NavSearchComponent } from './nav-search/nav-search.component';

@Component({
  selector: 'app-nav-left',
  imports: [],
  templateUrl: './nav-left.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./nav-left.component.scss']
})
export class NavLeftComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor() {
    console.log('abriendo navbar-left');
  }

  onToggleClick() {
    this.toggleSidebar.emit();
  }
}
