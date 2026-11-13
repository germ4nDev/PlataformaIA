// Angular Import
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guest', // OT-023 fase 5 (regla 21)
  imports: [RouterOutlet],
  templateUrl: './guest.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./guest.component.scss']
})
export class GuestComponent {}
