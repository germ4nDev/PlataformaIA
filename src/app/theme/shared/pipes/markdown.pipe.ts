/*
    Pipe: markdown → HTML SEGURO
    Corrección 2026-10-24 (fase 5 del asistente): antes confiaba en el HTML generado (bypassSecurityTrustHtml), y el
    texto viene de un modelo que lee datos externos (noticias, alertas): un <script> o un onerror="" en esos datos
    podía terminar ejecutándose. Ahora el HTML pasa por el sanitizador de Angular (quita scripts, eventos y URLs
    javascript:) y los enlaces abren en otra pestaña sin acceso a esta.
*/
import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'markdown',
    standalone: true
})
export class MarkdownPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string | undefined | null): string {
        if (!value) return '';
        const htmlRaw = marked.parse(String(value), { async: false }) as string;
        const limpio = this.sanitizer.sanitize(SecurityContext.HTML, htmlRaw) || '';
        return limpio.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
    }
}
