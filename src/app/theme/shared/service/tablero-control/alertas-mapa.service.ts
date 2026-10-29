/*
    Author: German Valencia
    Servicio: Alertas del mapa (fase 1)
    Recibe el evento único 'alerta-mapa' de la sala puerto:{PUERTO}:mapa y lo muestra con toastr:
      info = azul (movimiento normal) · warning = amarillo (atención) · error = rojo (actuar).
    En pantalla: se apilan hasta 5 a la vez, entra una por segundo y cada una se va sola a sus 5 s (azul)
    u 8 s (amarillo); las rojas se quedan hasta cerrarlas. Si se represan más de 15, se muestra la más grave
    y "+N alertas más" (todas quedan en la bitácora).
    Clic en una notificación → enfocar$ (el mapa vuela al punto). nueva$ → el mapa pinta un pulso.
*/
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { SocketService } from '../sockets.service';

export type NivelAlerta = 'info' | 'warning' | 'error';

export interface AlertaMapa {
    id: string;
    nivel: NivelAlerta;
    categoria: string;
    titulo: string;
    mensaje: string;
    coordenadas: [number, number] | null;
    entidad: string;
    simulado: boolean;
    fecha: string;
    puerto?: string;
}

const EVENTO = 'alerta-mapa';
const DUENO_SALA = 'alertas-mapa';
const MAX_BITACORA = 20;
const INTERVALO_MS = 1000;
const MAX_VISIBLES = 5;
const MAX_EN_COLA = 15;
const DURACION: Record<NivelAlerta, number> = { info: 5000, warning: 8000, error: 0 };

@Injectable({ providedIn: 'root' })
export class AlertasMapaService implements OnDestroy {
    private readonly url = `${environment.apiUrl}/alertas-mapa`;

    private readonly bitacoraSubject = new BehaviorSubject<AlertaMapa[]>([]);
    public readonly bitacora$: Observable<AlertaMapa[]> = this.bitacoraSubject.asObservable();

    private readonly sinLeerSubject = new BehaviorSubject<number>(0);
    public readonly sinLeer$: Observable<number> = this.sinLeerSubject.asObservable();

    private readonly nuevaSubject = new Subject<AlertaMapa>();
    /** Cada alerta que llega (para el pulso en el mapa). */
    public readonly nueva$: Observable<AlertaMapa> = this.nuevaSubject.asObservable();

    private readonly enfocarSubject = new Subject<AlertaMapa>();
    /** El usuario pidió ver una alerta (clic en la notificación o en la bitácora). */
    public readonly enfocar$: Observable<AlertaMapa> = this.enfocarSubject.asObservable();

    private puerto: string | null = null;
    private socketSub: Subscription | null = null;
    private cola: AlertaMapa[] = [];
    private temporizador: any = null;
    private visibles = 0;
    private vistos = new Set<string>();

    constructor(
        private http: HttpClient,
        private _socketService: SocketService,
        private toastr: ToastrService
    ) { }

    /** Empieza a recibir alertas del puerto (o cambia de puerto). */
    public iniciar(puerto: string | null | undefined): void {
        const clave = SocketService.normalizarPuerto(puerto || '');
        if (!this.socketSub) {
            this.socketSub = this._socketService.listen<AlertaMapa>(EVENTO).subscribe((a) => this.recibir(a));
        }
        if (!clave || clave === 'ALL') {
            this.puerto = null;
            this._socketService.salirSalaPuerto('mapa', DUENO_SALA);
            this.reiniciarBitacora([]);
            return;
        }
        if (clave === this.puerto) return;
        this.puerto = clave;
        this.cola = [];
        this._socketService.unirseSalaPuerto('mapa', clave, DUENO_SALA);
        this.cargarBitacora(clave);
    }

    public detener(): void {
        this.socketSub?.unsubscribe();
        this.socketSub = null;
        this._socketService.salirSalaPuerto('mapa', DUENO_SALA);
        this.puerto = null;
        this.cola = [];
        if (this.temporizador) { clearInterval(this.temporizador); this.temporizador = null; }
    }

    /** Alerta calculada en el navegador (p. ej. nave que entra a la zona de un faro). Mismo flujo que las del servidor. */
    public registrarLocal(alerta: Omit<AlertaMapa, 'id' | 'fecha'> & Partial<Pick<AlertaMapa, 'id' | 'fecha'>>): void {
        const fecha = alerta.fecha || new Date().toISOString();
        this.recibir({ ...alerta, id: alerta.id || `${alerta.categoria}:${alerta.entidad}:${fecha}`, fecha, puerto: this.puerto || undefined });
    }

    public enfocar(alerta: AlertaMapa): void {
        this.enfocarSubject.next(alerta);
    }

    /** Marca la bitácora como leída (al abrir el panel). */
    public marcarLeidas(): void {
        this.bitacoraSubject.getValue().forEach((a) => this.vistos.add(a.id));
        this.sinLeerSubject.next(0);
    }

    ngOnDestroy(): void {
        this.detener();
    }

    // ── interno ──────────────────────────────────────────────────────────────

    private cargarBitacora(puerto: string): void {
        const params = new HttpParams({ fromObject: { puerto, limite: String(MAX_BITACORA) } });
        this.http.get<AlertaMapa[]>(this.url, { params }).subscribe({
            next: (lista) => { if (this.puerto === puerto) this.reiniciarBitacora(lista || [], true); },
            error: () => { if (this.puerto === puerto) this.reiniciarBitacora([]); }
        });
    }

    private reiniciarBitacora(lista: AlertaMapa[], historicas = false): void {
        if (historicas) lista.forEach((a) => this.vistos.add(a.id)); // lo anterior a abrir el mapa no cuenta como nuevo
        this.bitacoraSubject.next(lista.slice(0, MAX_BITACORA));
        this.sinLeerSubject.next(0);
    }

    private recibir(alerta: AlertaMapa): void {
        if (!alerta || !alerta.nivel) return;
        if (alerta.puerto && this.puerto && SocketService.normalizarPuerto(alerta.puerto) !== this.puerto) return;
        const lista = [alerta, ...this.bitacoraSubject.getValue().filter((a) => a.id !== alerta.id)].slice(0, MAX_BITACORA);
        this.bitacoraSubject.next(lista);
        this.sinLeerSubject.next(lista.filter((a) => !this.vistos.has(a.id)).length);
        this.nuevaSubject.next(alerta);
        this.encolar(alerta);
    }

    private encolar(alerta: AlertaMapa): void {
        this.cola.push(alerta);
        if (!this.temporizador) {
            this.mostrarSiguiente();
            this.temporizador = setInterval(() => this.mostrarSiguiente(), INTERVALO_MS);
        }
    }

    private mostrarSiguiente(): void {
        if (!this.cola.length) {
            clearInterval(this.temporizador);
            this.temporizador = null;
            return;
        }
        if (this.visibles >= MAX_VISIBLES) return; // pila llena: espera a que se vaya alguna
        if (this.cola.length > MAX_EN_COLA) {
            // Primero la más grave; el resto se resume (todas quedan en la bitácora)
            const orden: Record<NivelAlerta, number> = { error: 0, warning: 1, info: 2 };
            const [primera, ...resto] = [...this.cola].sort((a, b) => orden[a.nivel] - orden[b.nivel]);
            this.cola = [];
            this.mostrar(primera);
            const n = resto.length;
            this.contar(this.toastr.info('Ver la bitácora de alertas del mapa', `+${n} alerta${n === 1 ? '' : 's'} más`, this.opciones('info')));
            return;
        }
        this.mostrar(this.cola.shift()!);
    }

    private mostrar(a: AlertaMapa): void {
        const mensaje = a.simulado ? `${a.mensaje} · simulado` : a.mensaje;
        // Las alertas tempranas del analista IA llevan su sello (borde violeta y etiqueta IA: estilos en styles.scss)
        const opciones = a.categoria === 'ia_temprana'
            ? { ...this.opciones(a.nivel), toastClass: 'ngx-toastr toast-ia' }
            : this.opciones(a.nivel);
        const ref = this.toastr[a.nivel](mensaje, a.titulo, opciones);
        ref?.onTap?.subscribe(() => this.enfocar(a));   // sin coordenadas (p. ej. IA): el mapa no se mueve
        this.contar(ref);
    }

    /** Lleva la cuenta de las notificaciones en pantalla (toastr avisa cuando cada una se oculta). */
    private contar(ref: any): void {
        if (!ref) return;
        this.visibles++;
        ref.onHidden?.subscribe(() => (this.visibles = Math.max(0, this.visibles - 1)));
    }

    private opciones(nivel: NivelAlerta): Partial<IndividualConfig> {
        const fija = DURACION[nivel] === 0;
        return {
            timeOut: DURACION[nivel],
            disableTimeOut: fija,
            closeButton: fija,
            progressBar: !fija,
            tapToDismiss: true,
            positionClass: 'toast-bottom-right'
        };
    }
}
