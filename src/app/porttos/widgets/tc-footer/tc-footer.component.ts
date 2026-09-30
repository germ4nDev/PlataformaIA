import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-tc-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tc-footer.component.html',
    styleUrls: ['./tc-footer.component.scss']
})
export class TcFooterComponent {
    @Input() titulo?: string = '';
}
