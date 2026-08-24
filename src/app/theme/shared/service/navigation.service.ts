/*
    Author: German Valencia
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { PtlmodulosApService } from './ptlmodulos-ap.service';
import { Subscription, Observable, BehaviorSubject, Subject } from 'rxjs';
import { PTLModuloAP } from '../_helpers/models/PTLModuloAP.model';
import { LocalStorageService } from './local-storage.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './lenguage.service';
import { Router } from '@angular/router';
import { NavigationItem } from '../_helpers/models/Navigation.model';

@Injectable({
    providedIn: 'root'
})
export class NavigationService implements OnInit, OnDestroy {
    aplicacion: any;
    suite: any;
    modulos: any[] = [];

    menuSubject = new BehaviorSubject<NavigationItem[]>([]);
    menuItems$: Observable<NavigationItem[]> = this.menuSubject.asObservable();

    lockScreenSubject = new Subject<string>();
    lockScreenEvent$: Observable<string> = this.lockScreenSubject.asObservable();

    private subscriptions: Subscription = new Subscription();

    constructor(
        private router: Router,
        private _modulosService: PtlmodulosApService,
        private _localStorageService: LocalStorageService,
        private _languageService: LanguageService,
        private translate: TranslateService
    ) {
        this.subscriptions.add(
            this._languageService.currentLang$.subscribe(lang => {
                console.log(`[NavigationService] Detectado cambio de idioma a: ${lang}. Actualizando menú.`);
                this.getNavigationItems();
            })
        );
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    emitLockScreen(message: string): void {
        this.lockScreenSubject.next(message);
    }

    private getAbsoluteUrl(url: string | undefined): string | undefined {
        if (!url) {
            return undefined;
        }
        return url.startsWith('/') ? url : `/${url}`;
    }

    private sortMenuItems(items: NavigationItem[]): NavigationItem[] {
        if (!items || items.length === 0) {
            return [];
        }

        items.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
        });

        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                item.children = this.sortMenuItems(item.children);
            }
        });

        return items;
    }

    private consultarNodosHijos(codModulo: string, modulos: PTLModuloAP[]) {
        return modulos.filter(x => x.codigoPadre == codModulo);
    }

    private buildMenuItems(modulosPadre: any[], todosLosModulos: any[]): NavigationItem[] {
        const menuItems: NavigationItem[] = [];
        modulosPadre.forEach((modulo: any) => {
            const childrenNodes = this.consultarNodosHijos(modulo.codigoModulo, todosLosModulos);
            const hasChildren = modulo.hijos == true;
            const type: 'collapse' | 'item' = hasChildren ? 'collapse' : 'item';
            const titleKey = this.translate.instant('PLATAFORMA.MODULOS.' + modulo.translateKey);

            const item: NavigationItem = {
                id: modulo.codigoModulo,
                title: titleKey,
                type: type,
                icon: modulo.icon
            };

            if (hasChildren) {
                item.children = this.buildMenuItems(childrenNodes, todosLosModulos);
            } else {
                item.url = this.getAbsoluteUrl(modulo.rutaModulo);
            }
            menuItems.push(item);
        });
        return menuItems;
    }

    private getAplicacionSuiteItems(todosLosModulos: any[]): NavigationItem[] {
        const modulos: any[] = [];

        todosLosModulos.forEach((mod: any) => {
            modulos.push(mod.modulo)
            mod.submodulos.forEach((sub: any) => {
                modulos.push(sub)
            });
        });

        const modulosPadreRaiz = modulos.filter(x => x.codigoPadre === '0');
        let hijosDelNodoSuite = this.buildMenuItems(modulosPadreRaiz, modulos);
        hijosDelNodoSuite = this.sortMenuItems(hijosDelNodoSuite);

        const suiteTitleKey = this.translate.instant('PLATAFORMA.SUITES.' + this.suite.translateKey);

        const nodoSuite: NavigationItem = {
            id: this.suite.codigoSuite || '',
            title: suiteTitleKey,
            type: 'group',
            icon: 'feather icon-monitor',
            children: hijosDelNodoSuite
        };
        return [nodoSuite];
    }

    getNavigationItems(): void {
        const navSettings = this._localStorageService.getObject<any>('navsettings');

        this.aplicacion = navSettings.aplicacion;
        this.suite = navSettings.suite;

        const mods: any[] = []

        this.aplicacion.modulos.forEach((mod: any) => {
            const idx = mods.findIndex(x => x.codigoModulo == mod.codigoModulo);
            if (idx == -1) {
                if (mod.codigoSuite == this.suite.codigoSuite) {
                    mods.push(mod);
                }
            }
        });

        const menu = this.getAplicacionSuiteItems(mods);
        this.menuSubject.next(menu);
    }

    navigateNodoMenu(url: any) {
        const modulos = this._modulosService.getModulosActuales();
        const modulo = modulos.find(x => x.codigoModulo == url.id);

        if (!modulo) {
            console.warn('No se encontró el módulo en la lista actual', url.id);
            return;
        }

        this._localStorageService.setModuloLocalStorage(modulo);

        if (modulo.codigoModulo !== undefined) {
            this._localStorageService.setObject('regId', modulo.codigoModulo)
            this.router.navigate([modulo.rutaModulo]);
        } else {
            this.router.navigate([modulo.rutaModulo]);
        }
    }
}

