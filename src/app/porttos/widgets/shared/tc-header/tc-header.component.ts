/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component';
import { ProfileDrpComponent } from 'src/app/theme/shared/components/profile-drp/profile-drp.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { MapaGeneralService } from 'src/app/theme/shared/service/tablero-control/mapa-general.service';
import { PuertosService } from 'src/app/theme/shared/service/tablero-control/puertos.service';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { LocalStorageService, UploadFilesService } from 'src/app/theme/shared/service';
import { EmbebidoService } from 'src/app/theme/shared/service/embebido.service';
import { Puerto } from 'src/app/theme/shared/_helpers/models/tablero-control/puerto.model';
import { colorPestana, iconoPestana } from '../iconos-pestana';

@Component({
    selector: 'app-tc-header',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        LanguageSelectorComponent,
        ProfileDrpComponent
    ],
    templateUrl: './tc-header.component.html',
    styleUrl: './tc-header.component.scss'
})
export class TcHeaderComponent implements OnInit, OnDestroy {
    // Entradas desde TorreControlComponent
    @Input() titulo: string = 'Porttos 1.0';
    @Input() subtitulo: string = 'Plataforma para la gestión portuaria';
    @Input() nodos: any[] = [];
    @Input() tableroBloqueado: boolean = true;
    @Input() pestanaActiva: string = '';

    /** Teléfono (CC-123): pestañas visibles para el menú lateral (las de la Torre de Control). */
    @Input() pestanas: any[] = [];

    @Output() toggleBloqueo = new EventEmitter<void>();
    @Output() abrirCatalogo = new EventEmitter<void>();
    @Output() nodoCambiado = new EventEmitter<string>();
    /** Teléfono (CC-123): acciones del menú lateral (lo que en la web hace la barra de pestañas y el engranaje). */
    @Output() pestanaElegida = new EventEmitter<string>();
    /** Teléfono (CC-125): abre el catálogo de pestañas del teléfono (elección guardada en el dispositivo). */
    @Output() abrirPestanas = new EventEmitter<void>();
    @Output() restaurar = new EventEmitter<void>();

    /** Teléfono (CC-123): menú lateral abierto. */
    public menuAbierto: boolean = false;

    // Estado del Filtro de Brazo (Exclusivo para pestaña GNL)
    public brazoSeleccionado: string = 'TODOS';
    public listaBrazos: string[] = [];

    public nodoSeleccionado: string = 'BUENAVENTURA';
    public isOptionBloqueo: boolean = false;
    public isBloqueado: boolean = false;
    public mapaPortuario: any[] = [];
    public listaCiudadesPortuarias: any[] = [];
    public newPuerto: Puerto = new Puerto();
    public mostrarLobby: boolean = false;
    logoEmpresa: string = 'assets/images/logo.png';
    /** Dentro de la app Porttos (OT-014): sin botón de menú principal. */
    readonly embebido: boolean;
    /** Teléfono con la web embebida (OT-017): barra con ☰, logo y puerto, y menú lateral (CC-123). La tableta no cambia. */
    @HostBinding('class.tc-header-telefono') readonly telefono: boolean;
    suscriptor: string = '';

    public horaActual: string = '';
    public fechaActual: string = '';
    private timer: any;
    private subs: Subscription = new Subscription();

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private _dashboardService: DashboardService,
        private _mapaGeneralService: MapaGeneralService,
        private _puertosService: PuertosService,
        private _localStorageService: LocalStorageService,
        private _filtroTableroService: FiltroTableroService,
        private _uploadService: UploadFilesService,
        private _gnlState: GnlStateService,
        _embebido: EmbebidoService
    ) {
        this.embebido = _embebido.activo;
        this.telefono = _embebido.esTelefono;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        const navSettings: any = this._localStorageService.getObject('navsettings')
        const aplicacion = navSettings.aplicacion;
        const dark = this._uploadService.getFilePath(this.suscriptor, 'aplicaciones', aplicacion.imagenLogoB) || 'no-image.png';
        const soft = this._uploadService.getFilePath(this.suscriptor, 'aplicaciones', aplicacion.imagenLogo) || 'no-image.png';
        const isDark = this._localStorageService.getThemeSettings();
        // this.logoEmpresa = isDark.isDarkTheme ? dark : soft;
        this.logoEmpresa = dark;
    }

    ngOnInit(): void {



        this.listaCiudadesPortuarias = this._puertosService.getPuertosActuales() || [];
        this.newPuerto = (this.listaCiudadesPortuarias.find(
            (x) => x.id_puerto === 'BUENAVENTURA'
        ) || new Puerto()) as Puerto;
        this.nodoSeleccionado = this.newPuerto?.id_puerto || 'BUENAVENTURA';
        this._localStorageService.setPuertoLocalStorage(this.nodoSeleccionado);

        // 1. Suscripción reactiva al brazo seleccionado en GNL
        if (this._gnlState?.brazoSeleccionado$) {
            this.subs.add(
                this._gnlState.brazoSeleccionado$.subscribe((brazo: string) => {
                    this.brazoSeleccionado = brazo || 'TODOS';
                    this.cdr.detectChanges();
                })
            );
        }

        // 2. Suscripción reactiva a la lista de brazos activos de telemetría GNL
        const streamBrazos =
            (this._gnlState as any)?.brazosActivos$ ||
            (this._gnlState as any)?.brazosDisponibles$;

        if (streamBrazos) {
            this.subs.add(
                streamBrazos.subscribe((brazos: string[]) => {
                    if (Array.isArray(brazos)) {
                        this.listaBrazos = [...brazos].sort((a, b) => {
                            const numA = parseInt(String(a).replace(/\D/g, ''), 10) || 0;
                            const numB = parseInt(String(b).replace(/\D/g, ''), 10) || 0;
                            return numA - numB;
                        });
                        this.cdr.detectChanges();
                    }
                })
            );
        }

        this.actualizarReloj();
        this.timer = setInterval(() => {
            this.actualizarReloj();
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.subs.unsubscribe();
    }

    /**
     * Evalúa si la pestaña activa en Torre de Control corresponde a GNL (ej. 'TLC_GNL_001')
     */
    get esPestanaGnl(): boolean {
        return (this.pestanaActiva || '').toUpperCase().includes('GNL');
    }

    /**
     * Notifica al GnlStateService cuando el usuario cambia el brazo desde el Header
     */
    onCambioBrazo(event: any): void {
        const brazo = event?.target?.value || this.brazoSeleccionado || 'TODOS';
        this.brazoSeleccionado = brazo;
        this._gnlState.seleccionarBrazo(brazo);
    }

    private actualizarReloj(): void {
        const ahora = new Date();
        this.horaActual = ahora.toTimeString().split(' ')[0];

        const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];

        const diaSemana = dias[ahora.getDay()];
        const diaMes = String(ahora.getDate()).padStart(2, '0');
        const mes = meses[ahora.getMonth()];
        const anio = ahora.getFullYear();

        this.fechaActual = `${diaSemana}, ${diaMes} DE ${mes} DE ${anio} · UTC-5`;
    }

    onCambioNodo(event: any): void {
        const valor = event?.target?.value || this.nodoSeleccionado;
        this.newPuerto = (this.listaCiudadesPortuarias.find(
            (x) => x.id_puerto === valor
        ) || new Puerto()) as Puerto;
        const ciudad = this.newPuerto?.id_puerto || valor || 'BUENAVENTURA';

        this.nodoCambiado.emit(ciudad.toUpperCase());
        this._localStorageService.setPuertoLocalStorage(ciudad);
        this._filtroTableroService.cambiarCiudad(ciudad.toUpperCase());

        // Si estamos en GNL y cambia el puerto, reiniciamos el filtro de brazo a Consolidado
        if (this.esPestanaGnl) {
            this.brazoSeleccionado = 'TODOS';
            this._gnlState.seleccionarBrazo('TODOS');
        }
    }

    onPuertoChange(selectedOption: any): void {
        this._localStorageService.setPuertoLocalStorage(selectedOption);
        this._mapaGeneralService.seleccionarPuerto(selectedOption.nombre);
    }

    consultarMapaPortuario(): void {
        this._dashboardService.cargarMapaPortuario().subscribe((mapa: any) => {
            this.mapaPortuario = mapa.data;
        });
    }

    // ---------- Teléfono (CC-123): menú lateral ----------
    abrirMenu(): void {
        this.menuAbierto = true;
        this.cdr.detectChanges();
    }

    cerrarMenu(): void {
        this.menuAbierto = false;
        this.cdr.detectChanges();
    }

    elegirPestana(codigoPestana: string): void {
        this.cerrarMenu();
        this.pestanaElegida.emit(codigoPestana);
    }

    /** Cierra el menú y avisa a la Torre de Control (catálogo, pestañas, bloqueo o restaurar). */
    accion(salida: EventEmitter<void>): void {
        this.cerrarMenu();
        salida.emit();
    }

    /** Ícono y color de la pestaña: la misma pieza común que usa la barra de pestañas de la web. */
    icono(pestana: any): string {
        return iconoPestana(pestana?.codigoPestana, pestana);
    }

    color(pestana: any): string | null {
        return colorPestana(pestana);
    }

    dispararCatalogo(): void {
        this.abrirCatalogo.emit();
    }

    onBloqueoClick(): void {
        this.isBloqueado = !this.isBloqueado;
        this.toggleBloqueo.emit();
    }

    goBack(evento: any): void {
        evento.stopPropagation()
        this.router.navigate(['/starter/inicio-suites']);
    }
}
