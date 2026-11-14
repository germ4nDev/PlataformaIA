/*
    Author: German Valencia
    Pattern: PLATAFORMA Tableros - Contexto del tablero (motor de tableros, núcleo; CC-180)
    Description: valores que fija quien abre el tablero (p. ej. la app móvil en modo embebido) para que la aplicación los lea sin que el
      núcleo la conozca. Llave → valor de texto; cada app decide qué llaves usa (Porttos: 'puerto').
*/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContextoTableroService {
  private readonly valores = new BehaviorSubject<Record<string, string>>({});

  fijar(llave: string, valor: string | null | undefined): void {
    if (!llave || !valor) return;
    if (this.valores.value[llave] === valor) return;
    this.valores.next({ ...this.valores.value, [llave]: valor });
  }

  valor(llave: string): string | null {
    return this.valores.value[llave] ?? null;
  }

  valor$(llave: string): Observable<string | null> {
    return this.valores.pipe(map((v) => v[llave] ?? null), distinctUntilChanged());
  }
}
