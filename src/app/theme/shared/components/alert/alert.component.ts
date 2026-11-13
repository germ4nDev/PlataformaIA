import { TranslateModule } from '@ngx-translate/core';
// Angular Import
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [TranslateModule, CommonModule],
  templateUrl: './alert.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent {
  // public props
  @Input() type!: string;
  @Input() dismiss!: string;

  // public method
  dismissAlert(element: { remove: () => void }) {
    element.remove();
  }
}
