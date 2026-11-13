import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PLATAFORMA Component - Entrada del modo embebido (OT-014 fase 1, CC-109; regla 17)
    Description: /embebido es la puerta de la web dentro de la app Porttos (tableta). Espera la sesión de la app (postMessage),
      la renueva (GET /api/auth/renew), arma el usuario y la navegación con las mismas piezas del login y de la entrada a una
      aplicación (plataforma/sesion/nucleo) y entra a la ruta de inicio de la aplicación (la Torre de Control).
      No registra otra sesión: es la misma de la app (sesión única). Fuera de la app muestra un aviso y no hace nada más.
*/
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, take } from 'rxjs';
import {
  AuthenticationService,
  LocalStorageService,
  PtlAplicacionesService,
  PtlEmpresasScService,
  PTLPaquetesSCService,
  PTLRolesAPService,
  PTLSuscriptoresService,
  PtlusuariosEmpresasScService,
  PtlusuariosScService,
  SocketService
} from 'src/app/theme/shared/service';
import { PTLModulosPaqueteService } from 'src/app/theme/shared/service/ptlmodulos-paquete.service';
import { PtlusuariosRolesApService } from 'src/app/theme/shared/service/ptlusuarios-roles-ap.service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { PtlWidgetsRolesService } from 'src/app/theme/shared/service/ptlwidgets-roles.service';
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service';
import { ContextoDominioService } from 'src/app/theme/shared/service/contexto-dominio.service';
import { EmbebidoService } from 'src/app/theme/shared/service/embebido.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import {
  armarUsuariosSC,
  contextoDeUsuario,
  empresaParaPermisos,
  listaDe,
  normalizarListasSesion,
  rolesYWidgetsDeAplicacion
} from '../sesion/nucleo';
import {
  SesionEntregada,
  aplicacionEmbebida,
  currentUserEmbebido,
  sesionProvisional,
  suiteEmbebida,
  suscriptorConAplicacion
} from './nucleo';

type Estado = 'fuera' | 'esperando' | 'entrando' | 'error';

@Component({
  selector: 'app-embebido',
  imports: [TranslateModule],
  templateUrl: './embebido.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './embebido.component.scss'
})
export class EmbebidoComponent implements OnInit {
  estado: Estado = 'esperando';
  mensaje = '';

  constructor(
    private router: Router,
    private _embebido: EmbebidoService,
    private _auth: AuthenticationService,
    private _localStorage: LocalStorageService,
    private _contextoDominio: ContextoDominioService,
    private _socket: SocketService,
    private _permisos: PtlPermisosService,
    private _filtro: FiltroTableroService,
    private _layout: LayoutService,
    private _usuariosSC: PtlusuariosScService,
    private _usuariosEmpresasSC: PtlusuariosEmpresasScService,
    private _empresasSC: PtlEmpresasScService,
    private _suscriptores: PTLSuscriptoresService,
    private _paquetesSC: PTLPaquetesSCService,
    private _modulosPQ: PTLModulosPaqueteService,
    private _usuariosRoles: PtlusuariosRolesApService,
    private _roles: PTLRolesAPService,
    private _aplicaciones: PtlAplicacionesService,
    private _suites: PtlSuitesAPService,
    private _widgetsMaestro: PTLWidgetsMaestroService,
    private _widgetsRoles: PtlWidgetsRolesService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this._embebido.activo) {
      this.estado = 'fuera';
      return;
    }
    try {
      const sesion = await this._embebido.esperarSesion();
      this.estado = 'entrando';
      await this.entrar(sesion);
    } catch (e) {
      this.estado = 'error';
      this.mensaje = (e as Error)?.message || 'No se pudo abrir el tablero.';
      this._embebido.avisar('error', { mensaje: this.mensaje });
    }
  }

  private async entrar(sesion: SesionEntregada): Promise<void> {
    // 0. Canal de la app (OT-017): 'telefono' arma la rejilla de 4 columnas; sin canal, la tableta = la web
    this._embebido.fijarCanal(sesion.canal);
    // 1. La sesión de la app, provisional, para que el interceptor mande x-token y x-sesion-id
    this._localStorage.setCurrentUserLocalStorage(sesionProvisional(sesion));
    let current = currentUserEmbebido(await firstValueFrom(this._auth.renovarSesion()), sesion);
    if (!current) throw new Error('La sesión de la app no es válida.');

    // 2. Las mismas listas que usa el login, y las de la aplicación
    const datos: any = await firstValueFrom(
      forkJoin({
        usuariosSC: this._usuariosSC.cargarRegistros().pipe(take(1)),
        usuariosEmpresasSC: this._usuariosEmpresasSC.cargarRegistros().pipe(take(1)),
        empresasSC: this._empresasSC.cargarRegistros().pipe(take(1)),
        suscriptores: this._suscriptores.getRegistros().pipe(take(1)),
        paquetesSC: this._paquetesSC.cargarRegistros().pipe(take(1)),
        modulosPQ: this._modulosPQ.cargarRegistros().pipe(take(1)),
        usuariosRoles: this._usuariosRoles.cargarRegistros().pipe(take(1)),
        rolesMaestros: this._roles.cargarRegistros().pipe(take(1)),
        aplicaciones: this._aplicaciones.cargarAplicaciones().pipe(take(1)),
        suites: this._suites.cargarRegistros().pipe(take(1)),
        widgetsMaestro: this._widgetsMaestro.cargarRegistros().pipe(take(1)),
        widgetsRoles: this._widgetsRoles.cargarRegistros().pipe(take(1))
      })
    );
    const listas = normalizarListasSesion(datos);
    const codigoUsuario = current['usuario'].codigoUsuario;
    current = { ...current, usuariosSC: armarUsuariosSC(codigoUsuario, listas) };

    // 3. La aplicación: la que pide la app o la del dominio; el suscriptor del usuario debe tenerla en sus paquetes
    const ctx = this._contextoDominio.contexto;
    const codigoAplicacion = aplicacionEmbebida(sesion, ctx.codigoAplicacion);
    const aplicacion = listaDe(datos.aplicaciones).find((a: any) => a.codigoAplicacion == codigoAplicacion);
    const suscriptor = codigoAplicacion ? suscriptorConAplicacion(current['usuariosSC'], codigoAplicacion) : null;
    if (!codigoAplicacion || !aplicacion || !suscriptor) {
      this._embebido.cerrarSesion('sin-acceso');
      throw new Error('Tu usuario no tiene esta aplicación en sus paquetes.');
    }
    const suite = suiteEmbebida(listaDe(datos.suites), codigoAplicacion, sesion.codigoSuite || ctx.codigoSuite);
    // La suite que pide la app manda sobre la ruta fija del dominio
    const destino = (sesion.codigoSuite && suite?.rutaInicio) || ctx.rutaInicio || suite?.rutaInicio;
    if (!destino) throw new Error('La aplicación no tiene ruta de inicio.');

    const { roles, widgets } = rolesYWidgetsDeAplicacion({
      codigoUsuario,
      codigoAplicacion,
      usuariosSC: listas.usuariosSC,
      roles: listas.rolesMaestros,
      usuariosRoles: listas.usuariosRoles,
      widgetsMaestro: listaDe(datos.widgetsMaestro),
      widgetsRoles: listaDe(datos.widgetsRoles)
    });
    current['usuario'] = { ...current['usuario'], roles, widgets, layout: await this.layoutDe(codigoUsuario) };
    if (sesion.pestana) current['pestanaActiva'] = sesion.pestana;

    // 4. Sesión y navegación como al entrar desde el login (sin registrar otra sesión)
    this._localStorage.setCurrentUserLocalStorage(current);
    this._localStorage.setNavSettingsLocalStorage({
      aplicacion,
      suite: suite || {},
      modulo: {},
      suscriptor,
      aplicaciones: [aplicacion],
      // CC-132: la empresa del suscriptor de la aplicación (no la primera del usuario): la usan los permisos y validarPermiso del API
      contexto: empresaParaPermisos(current['usuariosSC'], null, suscriptor.codigoSuscriptor) || contextoDeUsuario(current)
    } as any);
    this._auth.iniciarSesionEmbebida(current as any);
    this._socket.conectarConUsuario(codigoUsuario, sesion.codigoSesion);
    if (sesion.puerto) this._filtro.cambiarCiudad(sesion.puerto);
    await firstValueFrom(this._permisos.inicializarPermisosPorDefecto());
    await this.router.navigateByUrl(destino, { replaceUrl: true });
  }

  /** El layout guardado del usuario, como lo deja el login (arreglo; vacío si no tiene o falla). */
  private async layoutDe(codigoUsuario: string): Promise<unknown> {
    try {
      const res: any = await firstValueFrom(this._layout.getLayoutByUsuario(codigoUsuario));
      return res?.ok && res.layout ? res.layout : [];
    } catch (_) {
      return [];
    }
  }
}
