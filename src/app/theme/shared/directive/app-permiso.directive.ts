import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PtlPermisosService } from '../service/ptlpermisos.service'; // Ajusta la ruta a tu servicio

@Directive({
    selector: '[appPermiso]',
    standalone: true
})
export class AppPermisoDirective implements OnInit, OnDestroy {
    private permisoRequerido: string = '';
    private sub?: Subscription;
    private hasView = false;

    @Input() set appPermiso(codigoActividad: string) {
        this.permisoRequerido = codigoActividad;
        this.actualizarVista();
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private _permisosService: PtlPermisosService
    ) { }

    ngOnInit() {
        this.sub = this._permisosService.actividadesAutorizadas$.subscribe(() => {
            this.actualizarVista();
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private actualizarVista() {
        // 🟢 NUEVO: Si el componente padre no envía un permiso, el botón se muestra por defecto.
        // Esto evita que se rompan las tablas viejas que aún no usan seguridad.
        if (!this.permisoRequerido) {
            if (!this.hasView) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.hasView = true;
            }
            return;
        }

        const autorizado = this._permisosService.tienePermiso(this.permisoRequerido);

        if (autorizado && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!autorizado && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}
