/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo (puro, AD-16) - Leyenda de los slides del login (CC-104)
    Description: Sin Angular ni navegador, probado en _pruebas/login-portal.test.js.
      textoPlano(html)        la descripción del slide viene del editor de texto (HTML): solo el texto, sin etiquetas
      leyendaDeSlide(slide)   título (nombreSlider sin la numeración de orden «01 - ») y texto (máx. 220 caracteres)
    La leyenda se pinta como texto (interpolación), nunca como HTML.
*/
export interface LeyendaSlide { titulo: string | null; texto: string | null }

const ENTIDADES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };

export function textoPlano(html: string | null | undefined): string {
  return String(html ?? '')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/gi, (e) => ENTIDADES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, ' ')
    .trim();
}

export function leyendaDeSlide(slide: { nombreSlider?: string | null; descripcionSlider?: string | null } | null | undefined,
  max = 220): LeyendaSlide {
  const titulo = String(slide?.nombreSlider ?? '').replace(/^\s*\d+\s*[-.)_:]?\s*/, '').trim() || null;
  let texto = textoPlano(slide?.descripcionSlider);
  if (texto.length > max) texto = texto.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return { titulo, texto: texto || null };
}
