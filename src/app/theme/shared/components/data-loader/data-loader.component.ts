import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-loader',
  imports: [],
  templateUrl: './data-loader.component.html',
  styleUrl: './data-loader.component.scss'
})
export class DataLoaderComponent {
  @Input() isLoading: boolean = false;
  @Input() message: string = 'Cargando información...';
}
