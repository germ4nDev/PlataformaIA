import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-social-networks',
  imports: [TranslateModule],
  templateUrl: './social-networks.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './social-networks.component.scss'
})
export class SocialNetworksComponent {
  constructor(private translate: TranslateService) {}
}
