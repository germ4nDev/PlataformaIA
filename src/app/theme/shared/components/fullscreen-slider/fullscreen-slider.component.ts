import { TranslateModule } from '@ngx-translate/core';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PtlSlidersInicioService } from '../../service/ptlsliders-inicio.service';
import { of, Subscription } from 'rxjs';
import { PTLSliderInicioModel } from '../../_helpers/models/PTLSliderInicio.model';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService, UploadFilesService } from '../../service';
import { ContextoDominioService } from '../../service/contexto-dominio.service';
import { LeyendaSlide, leyendaDeSlide } from './leyenda';

const base_url = environment.apiUrl;

@Component({
    selector: 'app-full-screen-slider',
    standalone: true,
    imports: [TranslateModule, CommonModule, NgOptimizedImage],
    templateUrl: './fullscreen-slider.component.html',
    styleUrl: './fullscreen-slider.component.scss'
})
export class FullScreenSliderComponent implements OnInit, OnDestroy {
    @Input() tipoSlider: number = 0;
    @Input() slides: any[] = [];
    /** CC-104: título y texto de cada slide (nombre y descripción de la gestión) sobre la imagen, con pausa */
    @Input() leyendas = false;
    /** CC-104: ocupa su contenedor en vez de toda la ventana (login de pantalla dividida) */
    @Input() contenido = false;
    pausado = false;
    private subs = new Subscription();
    autoSlideInterval: number = 7000;
    registrosSub?: Subscription;
    registros: PTLSliderInicioModel[] = [];
    currentIndex: number = 0;
    images: PTLSliderInicioModel[] = [];
    private readonly defaultPlaceholder = `${base_url}/upload/sliders/imagen-inicio.png`;
    private intervalId: any;
    suscriptor: string = '';

    constructor(
        private _sliderService: PtlSlidersInicioService,
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService,
        private _contextoDominio: ContextoDominioService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
    }

    // ngOnInit(): void {
    //     if (this.tipoSlider == 1) {
    //         this.images = this._sliderService.getSlidersActuales();
    //         console.log('slides', this.images);
    //         this._sliderService.slider$.subscribe(data => {
    //             data.forEach((slider: any) => {
    //                 slider.imageSlider = this._uploadService.getFilePath(this.suscriptor, 'sliders', slider.urlSlider);
    //                 console.log('slides', slider.imageSlider);
    //             });
    //             this.images = data;
    //             console.log('Slides actualizados reactivamente:', this.slides);
    //         });
    //         this._sliderService.cargarSliders().subscribe();
    //         // this.consultarRegistros();
    //     } else if (this.tipoSlider == 2) {
    //         const newImage = {
    //             nombreslider: 'Ner Image',
    //             urlSlider: 'imagen-inicio.png',
    //             imageSlider: this._uploadService.getFilePath(this.suscriptor, 'sliders', 'imagen-inicio.png')
    //         };
    //         console.log('que me trae el color', newImage);
    //         this.images.push(newImage);
    //     } else if (this.tipoSlider == 3) {
    //         console.log('slides', this.slides);
    //         this.slides.forEach((image: any) => {
    //             const newImage = {
    //                 nombreslider: '',
    //                 urlSlider: '',
    //                 imageSlider: image
    //             };
    //             this.images.push(newImage);
    //         });
    //     }
    // }
    ngOnInit(): void {
        if (this.tipoSlider == 1) {
            // CC-104: slides del dominio (su aplicación o, si no tiene, los generales); se recargan cuando la gestión los cambia
            this.cargarSlidesDelDominio();
            this.subs.add(this._sliderService.slidersChange$.subscribe(() => this.cargarSlidesDelDominio()));

        } else if (this.tipoSlider == 2) {
            const newImage = {
                nombreslider: 'New Image', // Corregí un pequeño typo de 'Ner Image'
                urlSlider: 'imagen-inicio.png',
                imageSlider: this._uploadService.getFilePath(this.suscriptor, 'sliders', 'imagen-inicio.png')
            };
            this.images.push(newImage);

        } else if (this.tipoSlider == 3) {
            this.slides.forEach((image: any) => {
                const newImage = {
                    nombreslider: '',
                    urlSlider: '',
                    imageSlider: image
                };
                this.images.push(newImage);
            });
            // Si el slider tipo 3 también debe ser automático, agrega esto aquí:
            // this.startAutoSlide();
        }
    }

    ngOnDestroy(): void {
        // Limpiar el temporizador y las suscripciones al destruir el componente
        this.subs.unsubscribe();
        this.stopAutoSlide();
    }

    /** Slides del login de este dominio (PTLSliderInicio.codigoAplicacion, migración 027): sin aplicación → generales. */
    private cargarSlidesDelDominio(): void {
        const para = this._contextoDominio.contexto?.codigoAplicacion || null;
        this.subs.add(this._sliderService.slidesPara(para).subscribe({
            next: (data) => {
                const activos = (data || []).filter((s: any) => s.estadoSlider !== false);
                activos.forEach((slider: any) => {
                    slider.imageSlider = this._uploadService.getFilePath(this.suscriptor, 'sliders', slider.urlSlider);
                });
                this.images = activos;
                this.currentIndex = 0;
                this.resetAutoSlide();   // antes se abría un temporizador nuevo en cada carga y el slider se aceleraba
            },
            error: () => { /* sin slides: queda el fondo; el login sigue funcionando */ }
        }));
    }

    get leyenda(): LeyendaSlide {
        return leyendaDeSlide(this.images[this.currentIndex]);
    }

    alternarPausa(): void {
        this.pausado = !this.pausado;
        if (this.pausado) this.stopAutoSlide(); else this.startAutoSlide();
    }

    consultarRegistros() {
        this.registrosSub = this._sliderService
            .getRegistros()
            .pipe(
                tap((resp: any) => {
                    if (resp.ok) {
                        console.log('sliders', resp);

                        resp.slidersInicio.forEach((slider: any) => {
                            slider.imageSlider = this._uploadService.getFilePath(this.suscriptor, 'sliders', slider.urlSlider);
                            console.log('slides', slider.imageSlider);

                        });
                        this.images = resp.slidersInicio;
                        this.startAutoSlide();
                        return;
                    }
                }),
                catchError((err) => {
                    console.log('Ha ocurrido un error', err);
                    return of(null);
                })
            )
            .subscribe();
    }

    private startAutoSlide(): void {
        this.stopAutoSlide();
        const sinMovimiento = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!this.pausado && !sinMovimiento && this.images.length > 1 && this.autoSlideInterval > 0) {
            this.intervalId = setInterval(() => {
                this.nextImage();
            }, this.autoSlideInterval);
        }
    }

    private stopAutoSlide(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private resetAutoSlide(): void {
        this.stopAutoSlide();
        this.startAutoSlide();
    }

    nextImage(): void {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }

    prevImage(): void {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }

    goToImage(index: number): void {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.resetAutoSlide();
        }
    }

    onImageError(event: Event, index: number): void {
        const imgElement = event.target as HTMLImageElement;
        console.error(`Error al cargar la imagen en el índice ${index}: ${imgElement.src}`);
        // Reemplazar la URL por el placeholder solo si no es ya el placeholder
        if (imgElement.src !== this.defaultPlaceholder) {
            imgElement.src = this.defaultPlaceholder;
        }
    }
}
