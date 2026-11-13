/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Roles del usuario (OT-026, usuario 2026-11-09)
    Description:
      Arma la llave de un rol asignado: suscriptor (vínculo usuario–suscriptor) → empresa del suscriptor → aplicación con licencia del suscriptor
      → roles de esa aplicación. Guardar sincroniza solo los roles de esa aplicación en ese vínculo y esa empresa (los de otras aplicaciones
      o empresas no se tocan). Mismo API que Suscriptores › Usuarios › Roles (POST /api/usuarios-roles/sincronizar, ACT_USUSC_ROLES).
*/
import { Component, Input, OnChanges, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { v4 as uuidv4 } from 'uuid';
import { PtlusuariosRolesApService, PTLRolesAPService, LocalStorageService, SwalAlertService } from 'src/app/theme/shared/service';
import { PtlusuariosScService } from 'src/app/theme/shared/service/ptlusuarios-sc.service';
import { PtlEmpresasScService } from 'src/app/theme/shared/service/ptlempresas-sc.service';
import { PTLSuscriptoresService } from 'src/app/theme/shared/service/ptlsuscriptores.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

interface VinculoSuscriptor {
  codigoUsuarioSC: string;
  codigoSuscriptor: string;
  nombre: string;
}
interface AplicacionSuscriptor {
  codigoAplicacion: string;
  nombreAplicacion: string;
}
interface RolMarcable {
  codigoRole: string;
  nombreRole: string;
  marcado: boolean;
}

@Component({
  selector: 'app-asignacion-roles-usuario',
  imports: [FormsModule, TranslateModule, AppPermisoDirective],
  templateUrl: './asignacion-roles-usuario.component.html',
  styleUrl: './asignacion-roles-usuario.component.scss'
})
export class AsignacionRolesUsuarioComponent implements OnChanges {
  @Input() codigoUsuario = '';

  vinculos: VinculoSuscriptor[] = [];
  empresas: { codigoEmpresaSC: string; nombreEmpresa: string }[] = [];
  aplicaciones: AplicacionSuscriptor[] = [];
  roles: RolMarcable[] = [];

  codigoSuscriptor = '';
  codigoUsuarioSC = '';
  codigoEmpresaSC = '';
  codigoAplicacion = '';
  cargandoAplicaciones = false;
  guardando = false;

  private readonly usuariosSC = inject(PtlusuariosScService);
  private readonly suscriptores = inject(PTLSuscriptoresService);
  private readonly empresasSC = inject(PtlEmpresasScService);
  private readonly rolesAP = inject(PTLRolesAPService);
  private readonly usuariosRoles = inject(PtlusuariosRolesApService);
  private readonly almacen = inject(LocalStorageService);
  private readonly avisos = inject(SwalAlertService);

  ngOnChanges(): void {
    this.cargarVinculos();
  }

  /** 1. Suscriptores a los que está vinculado el usuario (vincular a otro se hace en Suscriptores › Usuarios). */
  cargarVinculos(): void {
    const nombres = new Map((this.suscriptores.getSuscriptoresActuales() || []).map((s) => [s.codigoSuscriptor, s.nombreSuscriptor]));
    this.vinculos = (this.usuariosSC.getUsuariosSCActuales() || [])
      .filter((v) => v.codigoUsuario === this.codigoUsuario && v.estadoUsuarioSC !== false)
      .map((v) => ({
        codigoUsuarioSC: v.codigoUsuarioSC || '',
        codigoSuscriptor: v.codigoSuscriptor || '',
        nombre: v.nombreSuscriptor || nombres.get(v.codigoSuscriptor) || v.codigoSuscriptor || ''
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    this.codigoSuscriptor = '';
    this.alCambiarSuscriptor();
  }

  /** 2 y 3. Empresas del suscriptor y aplicaciones que tiene con licencia activa. */
  alCambiarSuscriptor(): void {
    const vinculo = this.vinculos.find((v) => v.codigoSuscriptor === this.codigoSuscriptor);
    this.codigoUsuarioSC = vinculo?.codigoUsuarioSC || '';
    this.empresas = (this.empresasSC.getEmpresasSCActuales() || [])
      .filter((e) => e.codigoSuscriptor === this.codigoSuscriptor && e.estadoEmpresa !== false)
      .map((e) => ({ codigoEmpresaSC: e.codigoEmpresaSC || '', nombreEmpresa: e.nombreEmpresa || e.codigoEmpresaSC || '' }))
      .sort((a, b) => a.nombreEmpresa.localeCompare(b.nombreEmpresa, 'es'));
    this.codigoEmpresaSC = this.empresas.length === 1 ? this.empresas[0].codigoEmpresaSC : '';
    this.aplicaciones = [];
    this.codigoAplicacion = '';
    this.roles = [];
    if (!this.codigoSuscriptor) return;
    this.cargandoAplicaciones = true;
    this.suscriptores.getAplicaciones(this.codigoSuscriptor).subscribe({
      next: (apps) => {
        this.aplicaciones = apps;
        this.cargandoAplicaciones = false;
      },
      error: () => {
        this.cargandoAplicaciones = false;
        this.avisos.getAlertError(traducir('USUARIOS.GESTION.ASIGNACION_ROLES_USUARIO.COULD_NOT_GET_SUBSCRIBER_APPLICATIONS'));
      }
    });
  }

  /** 4. Roles de la aplicación, marcados los que el usuario ya tiene en ese vínculo y esa empresa. */
  armarRoles(): void {
    if (!this.codigoUsuarioSC || !this.codigoEmpresaSC || !this.codigoAplicacion) {
      this.roles = [];
      return;
    }
    const asignados = new Set(
      (this.usuariosRoles.getUsuairosRolesActuales() || [])
        .filter(
          (r) => r.codigoUsuarioSC === this.codigoUsuarioSC && r.codigoEmpresaSC === this.codigoEmpresaSC && r.estadoUsuarioRole !== false
        )
        .map((r) => r.codigoRole)
    );
    this.roles = (this.rolesAP.getRolesActuales() || [])
      .filter((r) => r.codigoAplicacion === this.codigoAplicacion && r.estadoRole !== false)
      .map((r) => ({
        codigoRole: r.codigoRole || '',
        nombreRole: r.nombreRole || r.codigoRole || '',
        marcado: asignados.has(r.codigoRole)
      }))
      .sort((a, b) => a.nombreRole.localeCompare(b.nombreRole, 'es'));
  }

  /** La llave: vínculo usuario–suscriptor + empresa + rol. Solo se reemplazan los roles de esta aplicación. */
  guardar(): void {
    if (!this.roles.length || this.guardando) return;
    const usuario = this.almacen.getUsuarioLocalStorage()?.codigoUsuario;
    const payload = {
      codigoUsuarioSC: this.codigoUsuarioSC,
      codigoEmpresaSC: this.codigoEmpresaSC,
      rolesContexto: this.roles.map((r) => r.codigoRole),
      roles: this.roles
        .filter((r) => r.marcado)
        .map((r) => ({
          codigoUsuarioRole: uuidv4(),
          codigoRole: r.codigoRole,
          codigoUsuarioSC: this.codigoUsuarioSC,
          codigoEmpresaSC: this.codigoEmpresaSC,
          estadoUsuarioRole: true,
          codigoUsuarioCreacion: usuario,
          fechaCreacion: new Date().toISOString()
        }))
    };
    this.guardando = true;
    this.usuariosRoles.postSincronizarRoles(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.usuariosRoles.cargarRegistros().subscribe(() => this.armarRoles());
        this.avisos.getAlertConfirmSuccess(traducir('USUARIOS.GESTION.ASIGNACION_ROLES_USUARIO.USER_ROLES_SAVED'));
      },
      error: () => {
        this.guardando = false;
        this.avisos.getAlertError(traducir('USUARIOS.GESTION.ASIGNACION_ROLES_USUARIO.COULD_NOT_SAVE_ROLES'));
      }
    });
  }
}
