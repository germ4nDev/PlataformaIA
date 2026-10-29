/*
    Author: German Valencia
    Componente: Administración IA (capa de análisis con IA, fase 4)
    Ruta: /porttos/ia-admin-panel (solo ROLE_ADMINISTRADOR; el API exige además IA_PERMISO_ADMIN si está definido).
    Tres vistas:
      Resumen        interruptores del .env, cortacircuito, consumo y costo por día, y por puerto: estado del analista
                     y de los resúmenes, llamadas, costo, alertas, precisión (se cumplieron) y votos «útil».
                     Acciones por puerto: analizar ahora y rehacer el cierre de turno.
      Configuración  por puerto ('*' = todos) y tarea: encendido, modo sombra, topes, confianza mínima y tipos a
                     publicar. Vacío = hereda (del '*' o del .env); se ve el valor efectivo y de dónde sale.
      Prompts        versiones por tarea: crear una nueva (BORRADOR), activarla o retirarla (vuelve la anterior
                     activa o el prompt incorporado).
      Asistente      (fase 5) preguntas de los usuarios por decisión de alcance (dentro, frontera, fuera), votos, y el
                     marco de alcance: temas incorporados y ajustados (encender/apagar, palabras clave, ejemplos),
                     temas nuevos y una prueba sin costo de cómo clasificarían las reglas una pregunta.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { NavigationService } from 'src/app/theme/shared/service';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import {
    AdminConfigIA, AdminPromptsIA, AdminResumenIA, AnalisisIAService, ConfigEfectivaIA, FilaConfigIA, PromptIA
} from 'src/app/theme/shared/service/tablero-control/analisis-ia.service';
import { NOMBRE_TIPO_IA } from '../../widgets/panel-ia/analista-ia/analista-ia.component';

type Vista = 'resumen' | 'config' | 'prompts' | 'asistente';
type Triestado = 'hereda' | 'si' | 'no';

interface FormConfig {
    activo: Triestado;
    modoSombra: Triestado;
    topeLlamadasDia: number | null;
    topeTokensDia: number | null;
    confianzaMinima: number | null;
    tiposHeredan: boolean;
    tipos: Record<string, boolean>;
}

@Component({
    selector: 'app-ia-admin-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, NavContentComponent, NavBarComponent, DataLoaderComponent],
    templateUrl: './ia-admin-panel.component.html',
    styleUrls: ['./ia-admin-panel.component.scss']
})
export class IaAdminPanelComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' = 'menu';

    vista: Vista = 'resumen';
    dias = 7;
    cargando = true;
    resumen: AdminResumenIA | null = null;
    config: AdminConfigIA | null = null;
    prompts: AdminPromptsIA | null = null;
    trabajando = new Set<string>();

    // configuración
    puertoConfig = '*';
    tareaConfig = 'analista_turno';
    form: FormConfig = this.formVacio();

    // prompts
    tareaPrompts = 'analista_turno';
    borrador: Partial<PromptIA> | null = null;
    verSistema: number | string | null = null;

    // asistente
    asistente: any = null;
    alcance: any = null;
    filtroDecision = '';
    preguntaPrueba = '';
    resultadoPrueba: any = null;
    temaEdicion: any = null;

    readonly marcadores = { analista: '{PUERTO}', resumen: '{PUERTO} y {TIPO}' };
    readonly nombreTipo = (t: string) => (t === 'todos' ? 'Todos' : NOMBRE_TIPO_IA[t] || t);
    private subs = new Subscription();

    constructor(
        private ia: AnalisisIAService,
        private _navigationService: NavigationService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.cargarResumen();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    cambiarVista(v: Vista): void {
        this.vista = v;
        if (v === 'resumen') this.cargarResumen();
        if (v === 'config' && !this.config) this.cargarConfig();
        if (v === 'prompts' && !this.prompts) this.cargarPrompts();
        if (v === 'asistente') { this.cargarAsistente(); if (!this.alcance) this.cargarAlcance(); }
    }

    // ── resumen ─────────────────────────────────────────────────────────────────────────────────────

    cargarResumen(): void {
        this.cargando = !this.resumen;
        this.subs.add(this.ia.adminResumen(this.dias).subscribe({
            next: (r) => { this.resumen = r; this.cargando = false; },
            error: (e) => { this.cargando = false; this.error(e, 'No se pudo leer el estado de la IA'); }
        }));
    }

    get maxCostoDia(): number {
        return Math.max(0.0001, ...(this.resumen?.consumo.porDia || []).map((d) => d.costoUsd));
    }

    get maxLlamadasDia(): number {
        return Math.max(1, ...(this.resumen?.consumo.porDia || []).map((d) => d.llamadas));
    }

    estadoTarea(t: ConfigEfectivaIA | undefined): { texto: string; clase: string } {
        if (!t) return { texto: '—', clase: '' };
        if (!this.resumen?.env?.habilitada) return { texto: 'IA apagada', clase: 'apagada' };
        if (!t.activa) return { texto: 'Apagada', clase: 'apagada' };
        return t.modoSombra ? { texto: 'Modo sombra', clase: 'sombra' } : { texto: 'Publicando', clase: 'activa' };
    }

    analizar(puerto: string): void {
        this.accion(`analizar|${puerto}`, this.ia.analizar(puerto), (r) => {
            const msg = r?.estado === 'OK' ? `${r.hallazgos ?? 0} hallazgo(s) nuevos, ${r.actualizadas ?? 0} actualizados` : `${r?.estado}: ${r?.motivo || ''}`;
            this.toastr.info(msg, `Análisis · ${puerto}`);
            this.cargarResumen();
        });
    }

    rehacerCierre(puerto: string): void {
        this.accion(`cierre|${puerto}`, this.ia.generarResumen(puerto, 'cierre_turno'), (r) => {
            this.toastr.success(`${r?.resumen?.titulo || 'Listo'} (${r?.origen === 'modelo' ? 'IA' : 'automático'}${r?.guardado === false ? ', sin guardar: falta la 017' : ''})`, `Cierre de turno · ${puerto}`);
        });
    }

    // ── configuración ───────────────────────────────────────────────────────────────────────────────

    cargarConfig(): void {
        this.subs.add(this.ia.adminConfig().subscribe({
            next: (c) => { this.config = c; this.armarForm(); },
            error: (e) => this.error(e, 'No se pudo leer la configuración de la IA')
        }));
    }

    get tareas(): Array<{ codigo: string; nombre: string; descripcion: string }> {
        return Object.entries(this.config?.tareas || this.prompts?.tareas || {}).map(([codigo, t]) => ({ codigo, ...t }));
    }

    get efectiva(): ConfigEfectivaIA | null {
        return this.config?.efectiva.find((e) => e.puerto === this.puertoConfig)?.tareas[this.tareaConfig] || null;
    }

    get filaActual(): FilaConfigIA | null {
        return this.config?.filas.find((f) => f.puerto === this.puertoConfig && f.codigoTarea === this.tareaConfig) || null;
    }

    origen(campo: string): string {
        const o = this.efectiva?.origen?.[campo];
        return o === 'puerto' ? 'de este puerto' : o === '*' ? 'de todos los puertos' : 'del .env';
    }

    cambiarSeleccion(): void {
        this.armarForm();
    }

    guardarConfig(): void {
        const f = this.form;
        const tri = (v: Triestado) => (v === 'hereda' ? null : v === 'si');
        const tipos = Object.entries(f.tipos).filter(([, v]) => v).map(([k]) => k);
        const fila: FilaConfigIA = {
            puerto: this.puertoConfig, codigoTarea: this.tareaConfig, activo: tri(f.activo), modoSombra: tri(f.modoSombra),
            topeLlamadasDia: f.topeLlamadasDia || null, topeTokensDia: f.topeTokensDia || null,
            confianzaMinima: f.confianzaMinima === null || (f.confianzaMinima as any) === '' ? null : Number(f.confianzaMinima),
            tiposPublicar: f.tiposHeredan || !tipos.length ? null : tipos
        };
        this.accion('guardar-config', this.ia.adminGuardarConfig(fila), (c) => {
            this.config = c;
            this.armarForm();
            this.toastr.success(`${this.puertoConfig === '*' ? 'Todos los puertos' : this.puertoConfig} · ${this.tareaConfig}`, 'Configuración guardada');
        });
    }

    restablecerConfig(): void {
        this.accion('guardar-config', this.ia.adminRestablecerConfig(this.puertoConfig, this.tareaConfig), (c) => {
            this.config = c;
            this.armarForm();
            this.toastr.info('Todo vuelve a heredar', 'Configuración restablecida');
        });
    }

    marcarTodos(): void {
        const todos = !!this.form.tipos['todos'];
        if (todos) Object.keys(this.form.tipos).forEach((k) => { if (k !== 'todos') this.form.tipos[k] = false; });
    }

    private formVacio(): FormConfig {
        return { activo: 'hereda', modoSombra: 'hereda', topeLlamadasDia: null, topeTokensDia: null, confianzaMinima: null, tiposHeredan: true, tipos: {} };
    }

    private armarForm(): void {
        const fila = this.filaActual;
        const tri = (v: boolean | null | undefined): Triestado => (v === null || v === undefined ? 'hereda' : v ? 'si' : 'no');
        const tipos: Record<string, boolean> = { todos: false };
        (this.config?.tiposAlerta || []).forEach((t) => (tipos[t] = false));
        (fila?.tiposPublicar || []).forEach((t) => (tipos[t] = true));
        this.form = {
            activo: tri(fila?.activo), modoSombra: tri(fila?.modoSombra), topeLlamadasDia: fila?.topeLlamadasDia ?? null,
            topeTokensDia: fila?.topeTokensDia ?? null, confianzaMinima: fila?.confianzaMinima ?? null,
            tiposHeredan: !fila?.tiposPublicar?.length, tipos
        };
    }

    // ── prompts ─────────────────────────────────────────────────────────────────────────────────────

    cargarPrompts(): void {
        this.subs.add(this.ia.adminPrompts().subscribe({
            next: (p) => (this.prompts = p),
            error: (e) => this.error(e, 'No se pudieron leer los prompts')
        }));
    }

    get versiones(): PromptIA[] {
        return (this.prompts?.versiones || []).filter((v) => v.codigoTarea === this.tareaPrompts);
    }

    get incorporado(): PromptIA | null {
        return this.prompts?.incorporados.find((p) => p.codigoTarea === this.tareaPrompts) || null;
    }

    get activo(): { origen: string; id?: number; version: number } | null {
        return this.prompts?.activos[this.tareaPrompts] || null;
    }

    nuevaVersion(base?: PromptIA | null): void {
        const b = base || this.versiones.find((v) => v.estado === 'ACTIVO') || this.incorporado;
        this.borrador = {
            codigoTarea: this.tareaPrompts, modelo: b?.modelo || 'claude-sonnet-5-5', temperatura: b?.temperatura ?? 0.2,
            maxTokens: b?.maxTokens ?? 2000, sistema: b?.sistema || '', esquemaSalida: b?.esquemaSalida || '', nota: ''
        };
    }

    guardarBorrador(): void {
        if (!this.borrador) return;
        this.accion('crear-prompt', this.ia.adminCrearPrompt(this.borrador), (p) => {
            this.prompts = this.mezclar(p);
            this.borrador = null;
            this.toastr.success(`Versión ${p.creado?.version} creada como BORRADOR`, 'Prompt');
        });
    }

    cambiarEstado(v: PromptIA, estado: 'ACTIVO' | 'RETIRADO'): void {
        if (!v.id) return;
        this.accion(`prompt|${v.id}`, this.ia.adminEstadoPrompt(v.id, estado), (p) => {
            this.prompts = this.mezclar(p);
            this.toastr.success(estado === 'ACTIVO' ? `Versión ${v.version} activa` : `Versión ${v.version} retirada`, 'Prompt');
        });
    }

    alternarSistema(clave: number | string): void {
        this.verSistema = this.verSistema === clave ? null : clave;
    }

    /** La respuesta trae solo la tarea tocada: se reemplazan sus versiones y su activo; lo de las demás tareas se conserva. */
    private mezclar(p: AdminPromptsIA): AdminPromptsIA {
        const t = this.tareaPrompts;
        const actual = this.prompts as AdminPromptsIA;
        return {
            ...actual,
            versiones: [...(actual?.versiones || []).filter((v) => v.codigoTarea !== t), ...p.versiones.filter((v) => v.codigoTarea === t)],
            activos: { ...(actual?.activos || {}), [t]: p.activos[t] }
        };
    }

    // ── asistente y marco de alcance (fase 5) ──────────────────────────────────────────────────────

    cargarAsistente(): void {
        this.subs.add(this.ia.adminAsistente(this.dias, this.filtroDecision || undefined).subscribe({
            next: (a) => (this.asistente = a),
            error: (e) => this.error(e, 'No se pudieron leer las preguntas del asistente')
        }));
    }

    cargarAlcance(): void {
        this.subs.add(this.ia.adminAlcance().subscribe({
            next: (a) => (this.alcance = a),
            error: (e) => this.error(e, 'No se pudo leer el marco de alcance')
        }));
    }

    probar(): void {
        const q = this.preguntaPrueba.trim();
        if (!q) return;
        this.accion('probar', this.ia.adminProbarAlcance(q), (r) => (this.resultadoPrueba = r));
    }

    editarTema(t?: any): void {
        this.temaEdicion = t
            ? { codigo: t.codigo, nombre: t.nombre, ambito: t.ambito, descripcion: t.descripcion, activo: t.activo !== false, orden: t.orden,
                palabras: (t.palabras || []).join(', '), ejemplos: (t.ejemplos || []).join('\n'), nuevo: false }
            : { codigo: '', nombre: '', ambito: 'dentro', descripcion: '', activo: true, palabras: '', ejemplos: '', nuevo: true };
    }

    alternarTema(t: any): void {
        this.editarTema(t);
        this.temaEdicion.activo = !(t.activo !== false);
        this.guardarTema();
    }

    guardarTema(): void {
        const t = this.temaEdicion;
        if (!t) return;
        const dto = {
            codigo: String(t.codigo || '').trim().toLowerCase(), nombre: t.nombre, ambito: t.ambito, descripcion: t.descripcion, activo: !!t.activo,
            ...(Number.isInteger(t.orden) ? { orden: t.orden } : {}),
            palabrasClave: String(t.palabras || '').split(',').map((x: string) => x.trim()).filter(Boolean),
            ejemplos: String(t.ejemplos || '').split('\n').map((x: string) => x.trim()).filter(Boolean)
        };
        this.accion('tema', this.ia.adminGuardarTema(dto), (a) => {
            this.alcance = a;
            this.temaEdicion = null;
            this.toastr.success(dto.nombre, 'Marco de alcance actualizado');
        });
    }

    readonly nombreHerramienta = (h: any) => String(h?.nombre || h || '').replace(/_/g, ' ');

    ambitoTexto(a: string): string {
        return a === 'dentro' ? 'Dentro' : a === 'frontera' ? 'Frontera' : 'Fuera';
    }

    // ── comunes ─────────────────────────────────────────────────────────────────────────────────────

    private accion<T>(clave: string, obs: Observable<T>, ok: (r: T) => void): void {
        if (this.trabajando.has(clave)) return;
        this.trabajando.add(clave);
        this.subs.add(obs.subscribe({
            next: (r) => { this.trabajando.delete(clave); ok(r); },
            error: (e) => { this.trabajando.delete(clave); this.error(e, 'No se pudo completar la acción'); }
        }));
    }

    private error(e: any, titulo: string): void {
        this.toastr.error(e?.error?.msg || e?.message || 'Error', titulo);
    }
}
