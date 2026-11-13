// Angular Import
import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  // public props
  @Input() cardTitle: string;
  @Input() cardClass!: string;
  @Input() blockClass!: string;
  @Input() headerClass!: string;
  @Input() hidHeader: boolean;
  @Input() customHeader: boolean;
  @Input() customDate: boolean;
  @Input() CardDate!: string;
  @Input() isCardFooter: boolean;
  @Input() footerClass!: string;

  // constructor
  constructor() {
    this.customHeader = false;
    this.customDate = false;
    this.hidHeader = false;
    this.cardTitle = 'Card Title';
    this.isCardFooter = false;
  }
}
