// Angular Import
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { CustomsThemeService } from '../../../service/customs-theme.service';
import { GradientConfig } from 'src/app/app-config';

@Component({
  selector: 'app-animation-modal', // OT-023 fase 5 (regla 21)
  imports: [CommonModule],
  templateUrl: './animation-modal.component.html',
  styleUrls: ['./animation-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AnimationModalComponent implements OnInit {
  // public props
  @Input() modalClass!: string;
  @Input() contentClass!: string;
  @Input() modalID!: string;
  @Input() backDrop = false;

  themeMode = GradientConfig.layoutType;

  constructor(public theme: CustomsThemeService) {}

  // public method
  close(event: string) {
    (document.querySelector('#' + event) as HTMLElement).classList.remove('md-show');
  }

  ngOnInit() {
    this.theme.customsTheme.subscribe((themeMode: string) => {
      this.themeMode = themeMode;
    });
  }
}
