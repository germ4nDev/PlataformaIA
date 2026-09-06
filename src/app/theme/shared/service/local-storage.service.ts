/*
    Author: German Valencia
    Refactorizado: Resolución de conflictos de estado asíncrono y almacenamiento
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLAplicacionModel } from '../_helpers/models/PTLAplicacion.model';
import { PTLSuiteAPModel } from '../_helpers/models/PTLSuiteAP.model';
import { PTLModuloAP } from '../_helpers/models/PTLModuloAP.model';
import { BaseSessionModel } from '../_helpers/models/BaseSession.model';
import { ThemeSettingsModel } from '../_helpers/models/ThemeSettings.model';
import { NavSettings } from '../_helpers/models/navSettings.model';
import { PTLSuscriptorModel } from '../_helpers/models/PTLSuscriptor.model';
import { CurrentUserModel } from '../_helpers/models/CurrentUser.model';
import { PTLRoleAPModel } from '../_helpers/models/PTLRoleAP.model';
import { PTLEmpresaSCModel } from '../_helpers/models/PTLEmpresaSC.model';
import { PTLActividadModel } from '../_helpers/models/PTLActividades.model';
import { Puerto } from '../_helpers/models/tablero-control/puerto.model';
import { CurrentTableroModel } from '../_helpers/models/CurrentTableroSettings.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    UserModel: CurrentUserModel = new CurrentUserModel();
    DataModel: BaseSessionModel = new BaseSessionModel();
    navsettings: NavSettings = new NavSettings();
    public roles: PTLRoleAPModel[] = [];
    public actividades: PTLActividadModel[] = [];
    public usuario: any = {};
    public token: any;
    public currentUser: any;
    public aplicacion: any = {};
    public suite: any = {};
    public modulo: any = {};
    public suscriptor: any = {};
    public empresa: any = {};
    public FormRegistro: any;
    public lang: string = 'es';
    public themeSettings: any;
    contexto: any;
    aplicaciones: PTLAplicacionModel[] = []

    constructor(
    ) { }

    // ====================================================================
    // #region MÉTODOS GENÉRICOS DE ALMACENAMIENTO
    // ====================================================================
    getObject<T>(key: string): T | null {
        const value = sessionStorage.getItem(key);
        if (!value) return null;
        try { return JSON.parse(value) as T; }
        catch (error) { return null; }
    }

    setObject(key: string, value: any): void {
        if (value === null || value === undefined) return;
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    removeObject(key: string): void {
        sessionStorage.removeItem(key);
    }

    // --- LOCAL STORAGE (Persiste al cerrar el navegador) ---
    getLocalObject<T>(key: string): T | null {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try { return JSON.parse(value) as T; }
        catch (error) { return null; }
    }

    setLocalObject(key: string, value: any): void {
        if (value === null || value === undefined) return;
        localStorage.setItem(key, JSON.stringify(value));
    }
    // #endregion

    // ====================================================================
    // #region GETTERS Y SETTERS TRADICIONALES PORTTOS
    // ====================================================================

    getCurrentUserLocalStorage(): any {
        return this.getObject<any>('currentUser');
    }

    getUsuarioLocalStorage() {
        const currentUser = this.getCurrentUserLocalStorage();
        return currentUser ? currentUser.usuario : null;
    }

    getTokenLocalStorage() {
        const currentUser = this.getCurrentUserLocalStorage();
        return currentUser ? currentUser.token : null;
    }

    getNavSettingsLocalStorage(): NavSettings {
        return this.getObject<NavSettings>('navsettings') || new NavSettings();
    }

    getAplicaicionLocalStorage(): PTLAplicacionModel {
        return this.getNavSettingsLocalStorage().aplicacion || new PTLAplicacionModel();
    }

    getSuiteLocalStorage(): PTLSuiteAPModel {
        return this.getNavSettingsLocalStorage().suite || new PTLSuiteAPModel();
    }

    getModuloLocalStorage(): PTLModuloAP {
        return this.getNavSettingsLocalStorage().modulo || new PTLModuloAP();
    }

    getSuscriptorPlataformaLocalStorage() {
        return 'plataforma';
    }

    getSuscriptorLocalStorage(): PTLSuscriptorModel | null {
        const currentUser = this.getCurrentUserLocalStorage();
        return currentUser;
    }

    getDataModelsLocalStorage() {
        this.usuario = this.getUsuarioLocalStorage() || new PTLUsuarioModel();
        this.aplicacion = this.getAplicaicionLocalStorage();
        this.suite = this.getSuiteLocalStorage();
        this.modulo = this.getModuloLocalStorage();

        const modelo: BaseSessionModel = {
            codigoAplicacion: this.aplicacion.codigoAplicacion,
            codigoSuite: this.suite.codigoSuite,
            codigoModulo: this.modulo.codigoModulo,
            usuarioCreacion: this.usuario.codigoUsuario,
            usuarioModificacion: this.usuario.codigoUsuario,
            fechaCreacion: new Date(),
            fechaModificacion: new Date(),
            dataLog: []
        };
        return modelo;
    }

    getLanguage(): string {
        return this.lang;
    }

    getFormRegistro() {
        this.FormRegistro = this.getObject<any>('FormRegistro') || [];
        return this.FormRegistro;
    }

    getThemeSettings() {
        const localSettings = localStorage.getItem('themeSettings');
        if (localSettings) {
            this.themeSettings = JSON.parse(localSettings);
        } else {
            this.themeSettings = {
                isDarkTheme: false,
                navbarColor: '#346BA6',
                iconosColor: '',
                textoColor: '',
                buttonsHoverColor: '#346BA6'
            } as ThemeSettingsModel;
        }
        return this.themeSettings;
    }

    getLanguageUrl() {
        return `//cdn.datatables.net/plug-ins/1.10.25/i18n/${this.lang === 'es' ? 'Spanish' : 'English'}.json`;
    }

    // --- SETTERS GLOBALES ---
    setNavSettingsLocalStorage(navsettings: NavSettings) {
        this.setObject('navsettings', navsettings);
        this.navsettings = navsettings;
    }

    setAplicacionLocalStorage(aplicacion: PTLAplicacionModel) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), aplicacion };
        this.setNavSettingsLocalStorage(navSetts);
        this.aplicacion = aplicacion;
    }

    setSuiteLocalStorage(suite: PTLSuiteAPModel) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), suite };
        this.setNavSettingsLocalStorage(navSetts);
        this.suite = suite;
    }

    setModuloLocalStorage(modulo: PTLModuloAP) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), modulo };
        this.setNavSettingsLocalStorage(navSetts);
        this.modulo = modulo;
    }

    setContextoLocalStorage(contexto: any) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), contexto: contexto };
        this.setNavSettingsLocalStorage(navSetts);
        this.contexto = contexto;
    }

    setSuscriptorLocalStorage(suscriptor: PTLSuscriptorModel) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), suscriptor: suscriptor };
        this.setNavSettingsLocalStorage(navSetts);
        this.suscriptor = suscriptor;
    }

    setAplicacionesLocalStorage(aplicaciones: PTLAplicacionModel[]) {
        const navSetts = { ...this.getNavSettingsLocalStorage(), aplicaciones: aplicaciones };
        this.setNavSettingsLocalStorage(navSetts);
        this.aplicaciones = aplicaciones;
    }

    setThemeSettingsLocalStorage(settings: ThemeSettingsModel) {
        this.setLocalObject('themeSettings', settings);
        this.themeSettings = settings;
    }

    setCurrentUserLocalStorage(data: CurrentUserModel) {
        this.setObject('currentUser', data);
        this.currentUser = data;
    }

    setUsuarioLocalStorage(usuario: PTLUsuarioModel) {
        const currentUser = { ...this.getCurrentUserLocalStorage(), usuario };
        this.setCurrentUserLocalStorage(currentUser);
        this.usuario = usuario;
    }

    setRolesLocalStorage(roles: PTLRoleAPModel[]) {
        const currentUser = { ...this.getCurrentUserLocalStorage(), roles };
        this.setCurrentUserLocalStorage(currentUser);
        this.roles = roles;
    }

    setActividadesLocalStorage(actividades: PTLActividadModel[]) {
        const currentUser = { ...this.getCurrentUserLocalStorage(), actividades };
        this.setCurrentUserLocalStorage(currentUser);
        this.actividades = actividades;
    }

    setEmpresasLocalStorage(empresa: PTLEmpresaSCModel) {
        const currentUser = { ...this.getCurrentUserLocalStorage(), empresa };
        this.setCurrentUserLocalStorage(currentUser);
        this.empresa = empresa;
    }

    setTokenLocalStorage(token: any) {
        const currentUser = { ...this.getCurrentUserLocalStorage(), token };
        this.setCurrentUserLocalStorage(currentUser);
        this.token = token;
    }

    setLanguage(lang: string) {
        localStorage.setItem('lang', lang);
        this.lang = lang;
    }

    setFormRegistro(FormRegistro: any) {
        this.setObject('FormRegistro', FormRegistro);
        this.FormRegistro = FormRegistro;
    }

    // --- REMOVERS ---
    removeFormRegistro() {
        this.removeObject('FormRegistro');
    }

    setLogOut() {
        this.removeObject('currentUser');
        this.removeObject('navsettings');
        this.removeObject('FormRegistro');
        localStorage.removeItem('currentTablero'); // Opcional: limpiar settings al salir
    }
    // #endregion
}

