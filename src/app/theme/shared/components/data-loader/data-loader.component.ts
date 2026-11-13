import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-data-loader',
  imports: [],
  templateUrl: './data-loader.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './data-loader.component.scss'
})
export class DataLoaderComponent {
  @Input() isLoading: boolean = false;
  @Input() message: string = 'Cargando información...';
}
