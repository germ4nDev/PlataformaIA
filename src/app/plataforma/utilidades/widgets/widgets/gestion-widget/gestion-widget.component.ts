import { traducir } from '../../../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UploadFilesService } from 'src/app/theme/shared/service/upload-files.service';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { PtllogActividadesService, PTLRolesAPService, PtlusuariosRolesApService } from 'src/app/theme/shared/service';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { PtlWidgetsRolesService } from 'src/app/theme/shared/service/ptlwidgets-roles.service';
import { Observable, Subscription } from 'rxjs';
import { PtltiposWidgetService } from 'src/app/theme/shared/service/ptltipos-widget.service';
import { PTLTipoWidgetModel } from 'src/app/theme/shared/_helpers/models/PTLTipoWidget.model';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
import { PTLPestanaModel } from 'src/app/theme/shared/_helpers/models/PTLPestana.model';
import { camposDelWidget, canalDelFormulario } from '../../nucleo';

@Component({
  selector: 'app-gestion-widget',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent],
  templateUrl: './gestion-widget.component.html',
  styleUrl: './gestion-widget.component.scss'
})
export class GestionWidgetComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  usuario: PTLUsuarioModel = new PTLUsuarioModel();
  FormRegistro: PTLWidgetMaestroModel = new PTLWidgetMaestroModel();
  form: undefined;
  isSubmit: boolean = false;
  menuItems!: Observable<NavigationItem[]>;
  modoEdicion: boolean = false;
  isAsociarRoles: boolean = false;
  codeRegistro = uuidv4();
  claveUsuario: string = '';

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  userPhotoUrl: string = '';
  fileName: string = '';
  selectedFileUrl: string | null = null;

  selectedFileDark: File | null = null;
  previewUrlDark: string | ArrayBuffer | null = null;
  userPhotoUrlDark: string = '';
  fileNameDark: string = '';
  selectedFileUrlDark: string | null = null;

  isClaveActual: boolean = true;
  claveActual: string = '';
  tipoEditorTexto = 'basica';
  lockScreenSubscription: Subscription | undefined;
  isLocked: boolean = false;
  isUserRole: boolean = true;
  lockMessage: string = '';
  suscPlataforma: string = '';
  codAplicacion: string = '';
  codSuscriptor: string = '';
  codEmpresaSC: string = '';
  codSuite: string = '';
  roles: PTLRoleAPModel[] = [];
  rolesFiltrado: PTLRoleAPModel[] = [];
  tiposWidget: PTLTipoWidgetModel[] = [];
  pestanas: any[] = [];
  widgetRoles: any[] = [];
  todosLosRoles: any[] = [];
  tipoRolSeleccionado: string = '';
  rolesAsignadosAlUsuario: any[] = [];
  nombreUsuario: string = '';

  constructor(
    private router: Router,
    private translate: TranslateService,
    private _logActividadesService: PtllogActividadesService,
    private _navigationService: NavigationService,
    private _registrosService: PTLWidgetsMaestroService,
    private _swalAlertService: SwalAlertService,
    private _translate: TranslateService,
    private _localStorageService: LocalStorageService,
    private _tiposWidgetService: PtltiposWidgetService,
    private _pestanasService: PtlpestanasService,
    private _uploadService: UploadFilesService
  ) {
    this.isSubmit = false;
    this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    const registroId = this._localStorageService.getObject<string>('regId') || '';
    this.tiposWidget = this._tiposWidgetService.getTipoeWidgetActuales();
    console.log('***** [COMPONENTE] tipos de widget', this.tiposWidget);

    if (registroId != 'nuevo') {
      // console.log('me llena el Id', registroId);
      this.modoEdicion = true;
      this._registrosService.getWidgetById(registroId).subscribe({
        next: (resp: any) => {
          // console.log('respuesta carga widget', resp);
          this.usuario = resp.widget;
          this.FormRegistro = { ...resp.widget, canal: canalDelFormulario(resp.widget) };
          this.selectedFileUrl = this._uploadService.getFilePath(this.suscPlataforma, 'widgets', resp.widget.imagenWidget_light);
          this.selectedFileUrlDark = this._uploadService.getFilePath(this.suscPlataforma, 'widgets', resp.widget.imagenWidget_dark);
          this.fileName = resp.widget.imagenWidget_light;
          this.fileNameDark = resp.widget.imagenWidget_dark;
        },
        error: () => {
          Swal.fire(traducir('COMMON.ERROR'), traducir('COMMON.COULD_NOT_GET_APPLICATION'), 'error');
        }
      });
    } else {
      this.modoEdicion = false;
    }
  }

  ngOnInit() {
    this._navigationService.getNavigationItems();
    this.menuItems = this._navigationService.menuItems$;
    this.consultarPestanas();
    this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
      next: (message: string) => {
        this._localStorageService.setFormRegistro(this.FormRegistro);
        this.isLocked = true;
        this.lockMessage = message;
      },
      error: (err) => console.error('Error al suscribirse al evento de bloqueo:', err)
    });
    const form = this._localStorageService.getFormRegistro();
    if (form != undefined) {
      this.FormRegistro = form;
      this._localStorageService.removeFormRegistro();
    }
    if (!this.modoEdicion) {
      this.FormRegistro.codigoPestana = '';
      this.FormRegistro.codigoTipo = '';
      this.FormRegistro.layoutVersion = 0;
      this.FormRegistro.offsetY = 0;
      this.FormRegistro.canal = 'web';
      this.FormRegistro.estadoWidget = true;
      this.FormRegistro.inicial = false;
      // Anclaje por defecto: relativo (el más común del catálogo); se cambia en la lista (OT-015, CC-114)
      this.FormRegistro.anclajeTipo = 'RELATIVO';
      //   console.log('formRegistro original', this.FormRegistro);
    }
  }

  ngOnDestroy(): void {}

  consultarPestanas() {
    this._pestanasService.getPestanas().subscribe((data) => {
      console.log('***** [COMPONENTE] pestanas', data);
      this.pestanas = data.pestanas || [];
      this.completarAplicacionDesdePestana();
    });
  }

  /** La aplicación y la suite del widget son las de su pestaña (PTLPestanas): el API las exige y el formulario no las pedía. */
  completarAplicacionDesdePestana() {
    const p = (this.pestanas || []).find((x: any) => x.codigoPestana === this.FormRegistro.codigoPestana);
    if (p) {
      this.FormRegistro.codigoAplicacion = p.codigoAplicacion;
      this.FormRegistro.codigoSuite = p.codigoSuite;
    }
  }

  actualizarDescripcionRegistro(nuevoContenido: string): void {
    this.FormRegistro.descripcionWidget = nuevoContenido;
  }

  onCodigoTipoClick(event: any) {
    console.log('Codigo ttipo wieget', event.target.value);
    this.FormRegistro.codigoTipo = event.target.value;
  }

  onCodigoPestanaClick(event: any) {
    console.log('Codigo PESTANA', event.target.value);
    this.FormRegistro.codigoPestana = event.target.value;
    this.completarAplicacionDesdePestana();
  }

  /** Sube la imagen del widget a la carpeta 'widgets' del suscriptor y devuelve el nombre guardado. */
  private subirImagen(file: File, alTerminar: (nombre: string) => void) {
    const objUpload = { susc: this._localStorageService.getSuscriptorPlataformaLocalStorage(), tipo: 'widgets', id: '0' };
    this._uploadService.uploadUserPhoto(file, objUpload).subscribe({
      next: (path: any) => {
        const nombre = path?.data?.respuesta?.fileName;
        if (nombre) alTerminar(nombre);
      },
      error: () => this._swalAlertService.getAlertError(this._translate.instant('COMMON.ERROR_UPLOADING_IMAGE'))
    });
  }

  onFileSelectedClick(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      // Antes la subida estaba comentada: la imagen nunca llegaba al servidor y el widget quedaba con 'no-imagen.png'.
      this.subirImagen(file, (nombre) => {
        this.fileName = nombre;
        this.FormRegistro.imagenWidget_light = nombre;
      });
    } else {
      this.selectedFileUrl = null;
      this.userPhotoUrl = '';
    }
  }

  onFileSelectedDarkClick(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      // Antes pintaba la vista previa en la imagen clara (selectedFileUrl).
      reader.onload = (e: any) => {
        this.selectedFileUrlDark = e.target.result;
      };
      reader.readAsDataURL(file);
      this.subirImagen(file, (nombre) => {
        this.fileNameDark = nombre;
        this.FormRegistro.imagenWidget_dark = nombre;
      });
    } else {
      this.selectedFileUrlDark = null;
    }
  }
  btnGestionarRegistroClick(form: any) {
    this.isSubmit = true;
    // if (!form.valid) {
    //   return;
    // }
    // Registro completo: lo del formulario sobre lo cargado, con la aplicación y la suite de la pestaña y el canal.
    this.completarAplicacionDesdePestana();
    const registroData = camposDelWidget({ ...this.FormRegistro, ...form.value }) as PTLWidgetMaestroModel;
    registroData.canal = canalDelFormulario({ canal: this.FormRegistro.canal });
    registroData.movil = registroData.canal === 'telefono';
    if (
      !registroData.codigoWidget ||
      !registroData.nombreWidget ||
      !registroData.codigoPestana ||
      !registroData.codigoTipo ||
      !registroData.codigoAplicacion ||
      !registroData.codigoSuite ||
      !registroData.anclajeTipo
    ) {
      this._swalAlertService.getAlertError(this._translate.instant('UTILIDADES.WIDGETS.GESTION.MISSING_REQUIRED_DATA_CODE_NAME_TYPE'));
      return;
    }
    registroData.imagenWidget_light = this.fileName !== '' ? this.fileName : 'no-imagen.png';
    registroData.imagenWidget_dark = this.fileNameDark !== '' ? this.fileNameDark : 'no-imagen.png';
    const version = registroData.layoutVersion || 0;
    registroData.layoutVersion = version + 1;
    console.log('gestionar widget', registroData);

    if (this.modoEdicion) {
      // MODIFICAR REGISTRO
      registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
      registroData.fechaModificacion = new Date().toISOString();
      this._registrosService.actualizarWidget(registroData.codigoWidget || '', registroData).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('COMMON.RECORD_UPDATED_SUCCESSFULLY') + ', ' + resp.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            // Texto del widget (antes «El Usuario se modificó correctamente»; OT-015, CC-114)
            this._swalAlertService.getAlertSuccess(this._translate.instant('COMMON.WIDGET_UPDATED'));
            this.router.navigate(['/utilidades/widgets']);
          } else {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '501',
              descripcionLog: this.translate.instant('COMMON.COULD_NOT_UPDATE_RECORD') + ', ' + resp.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            this._swalAlertService.getAlertError(resp.message || this._translate.instant('COMMON.COULD_NOT_UPDATE_USER'));
          }
        },
        error: (err: any) => {
          console.error(err);
          const logData = {
            codigoTipoLog: '',
            codigoRespuesta: '501',
            descripcionLog: this.translate.instant('COMMON.COULD_NOT_UPDATE_RECORD') + ', ' + err.mensaje
          };
          this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
          this._swalAlertService.getAlertError(this._translate.instant('COMMON.COULD_NOT_UPDATE_USER'));
        }
      });
    } else {
      // INSERTAR REGISTRO
      registroData.fechaCreacion = new Date().toISOString();
      registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
      this._registrosService.crearWidget(registroData).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('COMMON.RECORD_INSERTED_SUCCESSFULLY')
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            this._swalAlertService.getAlertSuccess(this._translate.instant('UTILIDADES.WIDGETS.GESTION.WIDGET_CREATED'));
            form.resetForm();
            this.isSubmit = false;
            this.router.navigate(['/utilidades/widgets']);
          }
        },
        error: (err: any) => {
          console.error(err);
          const logData = {
            codigoTipoLog: '',
            codigoRespuesta: '501',
            descripcionLog: this.translate.instant('COMMON.COULD_NOT_INSERT_RECORD') + ', ' + err.mensaje
          };
          this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado error'));
          // Antes borraba un archivo de la carpeta 'usuarios' con el nombre de la imagen del widget.
          // La imagen subida se conserva: sirve si se corrige el formulario y se guarda otra vez.
          const detalle = err?.error?.details?.map((d: any) => d.campo).join(', ') || err?.error?.msg || '';
          this._swalAlertService.getAlertError(
            this._translate.instant('UTILIDADES.WIDGETS.WIDGET_COULD_NOT_BE_SAVED') + (detalle ? ': ' + detalle : '')
          );
        }
      });
    }
  }

  btnRegresarClick() {
    this.router.navigate(['/utilidades/widgets']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
