import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss'
})
export class IconComponent {
  @Input() name: string = ''; // El nombre exacto que viene de la BD ('home', 'icon-user', 'ti-aws')
  @Input() customClass: string = ''; // Para inyectar 'text-primary', 'me-2', etc.

  get esMaterial(): boolean {
    if (!this.name) return false;
    return !this.name.startsWith('icon-') && !this.name.startsWith('ti');
  }

  get claseGenerada(): string {
    if (!this.name) return '';
    if (this.name.startsWith('ti')) return this.name;

    // Usamos concatenación normal para evitar errores de sintaxis
    if (this.name.startsWith('icon-')) return 'feather ' + this.name;

    return this.name; // Fallback
  }
}
